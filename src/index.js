import 'dotenv/config';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { loadConfig, assertUseCaseAllowed } from './config.js';

export class AIClient {
  constructor(apiKey = process.env.AI_API_KEY, provider) {
    const savedConfig = loadConfig();
    this.apiKey = apiKey;
    this._provider = provider || savedConfig?.provider || 'google';
    this.systemPrompt = '';

    if (savedConfig?.persona) {
      this.systemPrompt = `You are a ${savedConfig.persona}. Respond accordingly.`;
    }
  }

  personality(desc) {
    this.systemPrompt = `You are a ${desc}. Respond accordingly.`;
    return this;
  }

  provider(name) {
    this._provider = name;
    return this;
  }

  _getModel() {
    switch (this._provider) {
      case 'openai':
        return createOpenAI({ apiKey: this.apiKey })('gpt-4o');
      case 'anthropic':
        return createAnthropic({ apiKey: this.apiKey })('claude-3-5-sonnet-20241022');
      case 'google':
        return createGoogleGenerativeAI({ apiKey: this.apiKey })('gemini-2.5-flash');
      default:
        throw new Error(`Provider "${this._provider}" not supported.`);
    }
  }

  async chat(message) {
    assertUseCaseAllowed(['sdk', 'rag'], 'SDK usage');

    if (!this.apiKey) {
      throw new Error('No API key found. Run `npx ai-persona init` first.');
    }

    let context = '';

    try {
      const config = loadConfig();

      if (config?.useCase === 'rag' || config?.useCase === 'both') {
        const { retrieveContext } = await import('./rag.js');
        context = await retrieveContext(message);
      }
    } catch {
      context = '';
    }

    const systemMessage = context
      ? `${this.systemPrompt}\n\nUse this context if it is relevant:\n${context}`
      : this.systemPrompt;

    const { text } = await generateText({
      model: this._getModel(),
      system: systemMessage,
      prompt: message,
    });

    return text;
  }
}

export const ai = new AIClient();