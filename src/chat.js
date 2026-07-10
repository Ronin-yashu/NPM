import readline from 'readline';
import { intro, outro } from '@clack/prompts';
import { ai } from './index.js';
import { loadConfig, assertUseCaseAllowed } from './config.js';

export async function runChat(sessionName) {
  assertUseCaseAllowed(['cli', 'both'], 'CLI chat');

  const config = loadConfig();
  const sessionId = sessionName || 'cli-default';

  const client = config?.persona ? ai.personality(config.persona) : ai;

  intro(`💬 AI Persona Chat (${sessionId}) — type "exit" to quit`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'you> ',
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();

    if (input.toLowerCase() === 'exit') {
      rl.close();
      return;
    }

    if (!input) {
      rl.prompt();
      return;
    }

    try {
      const response = await client.chat(input, { sessionId });
      console.log(`ai>  ${response}\n`);
    } catch (error) {
      console.error(`Error: ${error.message}\n`);
    }

    rl.prompt();
  });

  rl.on('close', () => {
    outro(`👋 Chat session "${sessionId}" ended.`);
    process.exit(0);
  });
}