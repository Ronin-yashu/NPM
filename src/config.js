import fs from 'fs';
import path from 'path';

const CONFIG_DIR = path.join(process.cwd(), '.ai-persona');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config.json');

export function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return null;
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

export function saveConfig(data) {
  if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR);
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2));
}