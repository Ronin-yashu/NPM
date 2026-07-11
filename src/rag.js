import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import { embed, embedMany, cosineSimilarity } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { loadConfig, assertUseCaseAllowed } from './config.js';

const RAG_DB_PATH = path.join(process.cwd(), '.ai-persona', 'rag-store.json');

function getEmbeddingModel() {
  const apiKey = process.env.AI_API_KEY;
  const savedConfig = loadConfig();
  const provider = savedConfig?.provider || 'google';

  switch (provider) {
    case 'google': {
      const google = createGoogleGenerativeAI({ apiKey });
      return google.textEmbeddingModel('gemini-embedding-001');
    }

    case 'openai': {
      const openai = createOpenAI({ apiKey });
      return openai.textEmbeddingModel('text-embedding-3-small');
    }

    case 'anthropic':
      throw new Error(
        'Anthropic is not supported for embeddings yet. Use Google or OpenAI for RAG.'
      );

    default:
      throw new Error(`Provider "${provider}" not supported for embeddings.`);
  }
}

function ensureRagDir() {
  const ragDir = path.dirname(RAG_DB_PATH);

  if (!fs.existsSync(ragDir)) {
    fs.mkdirSync(ragDir, { recursive: true });
  }
}

function chunkText(text, chunkSize = 800, overlap = 100) {
  const chunks = [];
  let start = 0;

  while (start < text.length) {
    const chunk = text.slice(start, start + chunkSize).trim();
    if (chunk) {
      chunks.push(chunk);
    }
    start += chunkSize - overlap;
  }

  return chunks;
}

async function extractTextFromFile(fullPath) {
  const ext = path.extname(fullPath).toLowerCase();

  if (ext === '.txt' || ext === '.md') {
    return fs.readFileSync(fullPath, 'utf-8');
  }

  if (ext === '.pdf') {
  const buffer = fs.readFileSync(fullPath);
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return result.text || '';
}

  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: fullPath });
    return result.value || '';
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

export async function indexDocuments(folderPath) {
  assertUseCaseAllowed(['rag', 'both'], 'RAG indexing');

  if (!folderPath) {
    throw new Error('Please provide a folder path. Example: ai-persona rag init ./docs');
  }

  const fullFolderPath = path.resolve(process.cwd(), folderPath);

  if (!fs.existsSync(fullFolderPath)) {
    throw new Error(`Folder not found: ${fullFolderPath}`);
  }

  const files = fs
    .readdirSync(fullFolderPath)
    .filter((file) => ['.txt', '.md', '.pdf', '.docx'].includes(path.extname(file).toLowerCase()));

  if (files.length === 0) {
    throw new Error('No supported files found. Use .txt, .md, .pdf, or .docx files.');
  }

  const allChunks = [];
  let indexedFiles = 0;

  for (const file of files) {
    const fullPath = path.join(fullFolderPath, file);

    try {
      const content = await extractTextFromFile(fullPath);

      if (!content.trim()) {
        continue;
      }

      const chunks = chunkText(content);

      chunks.forEach((chunk, chunkIndex) => {
        allChunks.push({
          source: file,
          chunkIndex,
          text: chunk
        });
      });

      indexedFiles += 1;
    } catch (error) {
      console.warn(`Skipping ${file}: ${error.message}`);
    }
  }

  if (allChunks.length === 0) {
    throw new Error('No valid text chunks were created from the supported files.');
  }

  const model = getEmbeddingModel();

  const { embeddings } = await embedMany({
    model,
    values: allChunks.map((item) => item.text)
  });

  const store = allChunks.map((item, index) => ({
    ...item,
    embedding: embeddings[index]
  }));

  ensureRagDir();
  fs.writeFileSync(RAG_DB_PATH, JSON.stringify(store, null, 2));

  return {
    indexedFiles,
    chunks: allChunks.length
  };
}

export async function retrieveContext(query, topK = 3) {
  assertUseCaseAllowed(['rag', 'both'], 'RAG retrieval');

  if (!fs.existsSync(RAG_DB_PATH)) {
    throw new Error('No RAG index found. Run `ai-persona rag init <folder>` first.');
  }

  const store = JSON.parse(fs.readFileSync(RAG_DB_PATH, 'utf-8'));
  const model = getEmbeddingModel();

  const { embedding: queryEmbedding } = await embed({
    model,
    value: query
  });

  const scored = store.map((entry) => ({
    ...entry,
    similarity: cosineSimilarity(entry.embedding, queryEmbedding)
  }));

  scored.sort((a, b) => b.similarity - a.similarity);

  return scored
    .slice(0, topK)
    .map((item) => `[Source: ${item.source} | Chunk: ${item.chunkIndex}]\n${item.text}`)
    .join('\n\n---\n\n');
}