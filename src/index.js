import { generateText } from 'ai';

export class AIClient {
  constructor(apiKey, provider = 'openai') {
    this.apiKey = apiKey;
    this.provider = provider;
    this.systemPrompt = '';
  }

  personality(desc) {
    this.systemPrompt = `You are a ${desc}. Respond accordingly.`;
    return this;
  }

  async chat(message) {
    const { text } = await generateText({
      model: this.provider,
      system: this.systemPrompt,
      prompt: message,
    });
    return text;
  }
}

export const ai = new AIClient(process.env.AI_API_KEY);