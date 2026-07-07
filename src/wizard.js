import { intro, outro, select, text, spinner, isCancel, cancel } from '@clack/prompts';
import fs from 'fs';
import path from 'path';

export async function runWizard() {
  intro('🤖 Welcome to AI Persona Setup');

  const useCase = await select({
    message: 'What will you use this for?',
    options: [
      { value: 'cli', label: 'Terminal chat assistant' },
      { value: 'sdk', label: 'In-project SDK integration' },
      { value: 'rag', label: 'RAG / document Q&A' },
      { value: 'both', label: 'All of the above' },
    ],
  });
  if (isCancel(useCase)) return cancel('Setup cancelled.');

  const provider = await select({
    message: 'Choose your AI provider',
    options: [
      { value: 'openai', label: 'OpenAI' },
      { value: 'anthropic', label: 'Anthropic' },
      { value: 'google', label: 'Google Gemini' },
    ],
  });
  if (isCancel(provider)) return cancel('Setup cancelled.');

  const apiKey = await text({
    message: 'Enter your API key',
    validate: (v) => (!v ? 'API key is required' : undefined),
  });
  if (isCancel(apiKey)) return cancel('Setup cancelled.');

  const s = spinner();
  s.start('Setting up your project...');

  const configDir = path.join(process.cwd(), '.ai-persona');
  if (!fs.existsSync(configDir)) fs.mkdirSync(configDir);
  fs.writeFileSync(
    path.join(configDir, 'config.json'),
    JSON.stringify({ useCase, provider }, null, 2)
  );

  const envPath = path.join(process.cwd(), '.env');
  const envLine = `AI_API_KEY=${apiKey}\n`;
  if (fs.existsSync(envPath)) {
    const existing = fs.readFileSync(envPath, 'utf-8');
    if (!existing.includes('AI_API_KEY')) {
      fs.appendFileSync(envPath, envLine);
    }
  } else {
    fs.writeFileSync(envPath, envLine);
  }

  s.stop('Setup complete!');
  outro('You can now use `ai.chat()` in your project 🚀');
}