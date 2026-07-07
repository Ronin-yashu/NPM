import fs from 'fs';
import path from 'path';

const CONFIG_DIR = path.join(process.cwd(), '.ai-persona');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

export function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  } catch {
    return null;
  }
}

export function saveConfig(config) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export function getCurrentUseCase() {
  const config = loadConfig();
  return config?.useCase || null;
}

export function assertUseCaseAllowed(allowedUseCases, featureName) {
  const config = loadConfig();

  if (!config?.useCase) {
    throw new Error(
      'No setup found. Run `npx ai-persona init` first.'
    );
  }

  const currentUseCase = config.useCase;

  if (currentUseCase === 'both') {
    return config;
  }

  if (!allowedUseCases.includes(currentUseCase)) {
    throw new Error(
      `"${featureName}" is locked for use case "${currentUseCase}". Re-run \`npx ai-persona init\` to change your setup.`
    );
  }

  return config;
}