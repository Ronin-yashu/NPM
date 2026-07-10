import fs from 'node:fs';
import path from 'node:path';

const AI_PERSONA_DIR = path.join(process.cwd(), '.ai-persona');
const HISTORY_FILE = path.join(AI_PERSONA_DIR, 'history.json');

function ensureMemoryFile() {
  if (!fs.existsSync(AI_PERSONA_DIR)) {
    fs.mkdirSync(AI_PERSONA_DIR, { recursive: true });
  }

  if (!fs.existsSync(HISTORY_FILE)) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify({ sessions: {} }, null, 2), 'utf-8');
  }
}

function readMemory() {
  ensureMemoryFile();

  try {
    const raw = fs.readFileSync(HISTORY_FILE, 'utf-8');
    const parsed = JSON.parse(raw);

    if (!parsed.sessions || typeof parsed.sessions !== 'object') {
      return { sessions: {} };
    }

    return parsed;
  } catch {
    return { sessions: {} };
  }
}

function writeMemory(data) {
  ensureMemoryFile();
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function ensureSession(memory, sessionId) {
  if (!memory.sessions[sessionId]) {
    memory.sessions[sessionId] = {
      summary: '',
      messages: []
    };
  }

  if (!Array.isArray(memory.sessions[sessionId].messages)) {
    memory.sessions[sessionId].messages = [];
  }

  if (typeof memory.sessions[sessionId].summary !== 'string') {
    memory.sessions[sessionId].summary = '';
  }
}

export function getSessionMessages(sessionId = 'default') {
  const memory = readMemory();
  return memory.sessions?.[sessionId]?.messages || [];
}

export function getRecentSessionMessages(sessionId = 'default', count = 5) {
  const memory = readMemory();
  const messages = memory.sessions?.[sessionId]?.messages || [];
  return messages.slice(-count);
}

export function getSessionSummary(sessionId = 'default') {
  const memory = readMemory();
  return memory.sessions?.[sessionId]?.summary || '';
}

export function setSessionSummary(sessionId = 'default', summary = '') {
  const memory = readMemory();
  ensureSession(memory, sessionId);
  memory.sessions[sessionId].summary = String(summary || '');
  writeMemory(memory);
}

export function summarizeSession(sessionId = 'default') {
  const memory = readMemory();
  const session = memory.sessions?.[sessionId];

  if (!session) {
    return `No messages found for session "${sessionId}".`;
  }

  const messages = session.messages || [];
  const summary = session.summary || '';

  if (!messages.length && !summary) {
    return `No messages found for session "${sessionId}".`;
  }

  const userMessages = messages.filter((m) => m.role === 'user');
  const assistantMessages = messages.filter((m) => m.role === 'assistant');

  const lastUser = userMessages[userMessages.length - 1]?.content || 'none';
  const lastAssistant = assistantMessages[assistantMessages.length - 1]?.content || 'none';

  return [
    `Session: ${sessionId}`,
    `Stored summary: ${summary || 'none'}`,
    `Buffered messages: ${messages.length}`,
    `User messages: ${userMessages.length}`,
    `Assistant messages: ${assistantMessages.length}`,
    `Last user message: ${lastUser}`,
    `Last assistant reply: ${lastAssistant}`
  ].join('\n');
}

export function addSessionMessage(sessionId = 'default', role, content) {
  if (!role || !content) return;

  const memory = readMemory();
  ensureSession(memory, sessionId);

  memory.sessions[sessionId].messages.push({
    role,
    content: String(content),
    createdAt: new Date().toISOString()
  });

  writeMemory(memory);
}

export function trimSessionMessages(sessionId = 'default', maxMessages = 12) {
  const memory = readMemory();
  ensureSession(memory, sessionId);

  memory.sessions[sessionId].messages = memory.sessions[sessionId].messages.slice(-maxMessages);
  writeMemory(memory);
}

export function clearSession(sessionId = 'default') {
  const memory = readMemory();
  ensureSession(memory, sessionId);

  memory.sessions[sessionId].messages = [];
  memory.sessions[sessionId].summary = '';

  writeMemory(memory);
}

export function deleteSession(sessionId = 'default') {
  const memory = readMemory();

  if (memory.sessions[sessionId]) {
    delete memory.sessions[sessionId];
  }

  writeMemory(memory);
}

export function clearAllSessions() {
  writeMemory({ sessions: {} });
}

export function listSessions() {
  const memory = readMemory();
  return Object.keys(memory.sessions || {});
}