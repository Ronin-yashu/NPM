import 'dotenv/config';
import { generateText } from 'ai';

export class AIClient {
  constructor(apiKey = process.env.AI_API_KEY, provider = 'openai') {
    this.apiKey = apiKey;
    this._provider = provider;
    this.systemPrompt = '';
  }

  personality(desc) {
    this.systemPrompt = `You are a ${desc}. Respond accordingly.`;
    return this;
  }

  provider(name) {
    this._provider = name;
    return this;
  }

  async chat(message) {
    if (!this.apiKey) {
      throw new Error('No API key found. Run `npx ai-persona init` first.');
    }
    const { text } = await generateText({
      model: this._provider,
      system: this.systemPrompt,
      prompt: message,
    });
    return text;
  }
}

export const ai = new AIClient();