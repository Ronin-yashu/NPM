import 'dotenv/config';
import fs from 'fs';
import path from 'path';
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
    .filter((file) => file.endsWith('.txt') || file.endsWith('.md'));

  if (files.length === 0) {
    throw new Error('No .txt or .md files found in the provided folder.');
  }

  const allChunks = [];

  for (const file of files) {
    const fullPath = path.join(fullFolderPath, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const chunks = chunkText(content);

    chunks.forEach((chunk) => {
      allChunks.push({
        source: file,
        text: chunk,
      });
    });
  }

  if (allChunks.length === 0) {
    throw new Error('No valid text chunks were created from the files.');
  }

  const model = getEmbeddingModel();

  const { embeddings } = await embedMany({
    model,
    values: allChunks.map((item) => item.text),
  });

  const store = allChunks.map((item, index) => ({
    ...item,
    embedding: embeddings[index],
  }));

  ensureRagDir();
  fs.writeFileSync(RAG_DB_PATH, JSON.stringify(store, null, 2));

  return {
    indexedFiles: files.length,
    chunks: allChunks.length,
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
    value: query,
  });

  const scored = store.map((entry) => ({
    ...entry,
    similarity: cosineSimilarity(entry.embedding, queryEmbedding),
  }));

  scored.sort((a, b) => b.similarity - a.similarity);

  return scored
    .slice(0, topK)
    .map((item) => `[Source: ${item.source}]\n${item.text}`)
    .join('\n\n---\n\n');
}