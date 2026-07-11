import readline from 'readline';
import chalk from 'chalk';
import ora from 'ora';
import { intro, outro } from '@clack/prompts';
import { ai } from './index.js';
import { loadConfig, assertUseCaseAllowed } from './config.js';

export async function runChat(sessionName) {
  assertUseCaseAllowed(['cli', 'both'], 'CLI chat');

  const config = loadConfig();
  const sessionId = sessionName || 'cli-default';
  const client = config?.persona ? ai.personality(config.persona) : ai;

  intro(chalk.cyan(`💬 AI Persona Chat (${sessionId}) — type "exit" to quit`));

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.green('you> '),
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

    const spinner = ora({
      text: chalk.gray('Thinking...'),
      discardStdin: false,
    }).start();

    try {
      const result = await client.streamChat(input, { sessionId });

      spinner.stop();
      process.stdout.write(chalk.blue('ai>  '));

      let hasOutput = false;

      for await (const chunk of result.textStream) {
        if (!hasOutput) {
          hasOutput = true;
        }
        process.stdout.write(chunk);
      }

      process.stdout.write('\n\n');
    } catch (error) {
      spinner.stop();
      console.error(chalk.red(`Error: ${error.message}\n`));
    }

    rl.prompt();
  });

  rl.on('close', () => {
    outro(chalk.yellow(`👋 Chat session "${sessionId}" ended.`));
    process.exit(0);
  });
}