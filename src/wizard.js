import {
  intro,
  outro,
  select,
  text,
  spinner,
  isCancel,
  cancel,
  note,
} from '@clack/prompts';
import fs from 'fs';
import path from 'path';
import { saveConfig } from './config.js';

export async function runWizard() {
  intro('🤖 Welcome to AI Persona Setup');

  note(
    'Your selected use case will unlock only those features.\nTo change modes later, re-run `npx ai-persona init`.',
    'Use Case Locking'
  );

  const useCase = await select({
    message: 'What will you use this package for?',
    options: [
      { value: 'cli', label: 'CLI only' },
      { value: 'sdk', label: 'SDK only' },
      { value: 'rag', label: 'RAG only' },
      { value: 'both', label: 'Everything' },
    ],
  });

  if (isCancel(useCase)) {
    cancel('Setup cancelled.');
    return;
  }

  const provider = await select({
    message: 'Choose your AI provider',
    options: [
      { value: 'google', label: 'Google Gemini' },
      { value: 'openai', label: 'OpenAI' },
      { value: 'anthropic', label: 'Anthropic' },
    ],
  });

  if (isCancel(provider)) {
    cancel('Setup cancelled.');
    return;
  }

  const apiKey = await text({
    message: 'Enter your API key',
    validate: (value) => {
      if (!value || !value.trim()) {
        return 'API key is required';
      }
    },
  });

  if (isCancel(apiKey)) {
    cancel('Setup cancelled.');
    return;
  }

  const persona = await text({
    message: 'Describe your AI personality',
    placeholder: 'Senior developer',
  });

  if (isCancel(persona)) {
    cancel('Setup cancelled.');
    return;
  }

  const s = spinner();
  s.start('Setting up your project...');

  const envPath = path.join(process.cwd(), '.env');

  saveConfig({
    useCase,
    provider,
    persona: persona?.trim() || 'Helpful assistant',
  });

  const envLine = `AI_API_KEY=${apiKey.trim()}\n`;

  if (fs.existsSync(envPath)) {
    const existingEnv = fs.readFileSync(envPath, 'utf-8');

    if (existingEnv.includes('AI_API_KEY=')) {
      const updatedEnv = existingEnv.replace(/AI_API_KEY=.*/g, `AI_API_KEY=${apiKey.trim()}`);
      fs.writeFileSync(envPath, updatedEnv);
    } else {
      fs.appendFileSync(envPath, `\n${envLine}`);
    }
  } else {
    fs.writeFileSync(envPath, envLine);
  }

  s.stop('Setup complete!');

  if (useCase === 'cli') {
    outro('CLI mode enabled. Next step: run `npx ai-persona chat`');
    return;
  }

  if (useCase === 'sdk') {
    outro('SDK mode enabled. Next step: import `{ ai }` in your project');
    return;
  }

  if (useCase === 'rag') {
    outro('RAG mode enabled. Next step: run `npx ai-persona rag init ./docs`');
    return;
  }

  outro('All features enabled. You can now use CLI, SDK, and RAG 🚀');
}