import 'dotenv/config';
import { generateText, streamText, smoothStream } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { loadConfig, assertUseCaseAllowed } from './config.js';
import {
  getSessionMessages,
  getSessionSummary,
  setSessionSummary,
  addSessionMessage,
  trimSessionMessages
} from './memory.js';

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

  async _generateRollingSummary(sessionId) {
    const summary = getSessionSummary(sessionId);
    const history = getSessionMessages(sessionId);

    if (!history.length) {
      return summary;
    }

    const transcript = history
      .map((item) => `${item.role.toUpperCase()}: ${item.content}`)
      .join('\n');

    const prompt = [
      'You are maintaining a compact memory summary for a chatbot session.',
      'Update the summary using the previous summary and the recent conversation.',
      'Keep only important facts, user preferences, goals, and unresolved topics.',
      'Write a short paragraph in plain text.',
      '',
      `Previous summary:\n${summary || 'None'}`,
      '',
      `Recent conversation:\n${transcript}`
    ].join('\n');

    const { text } = await generateText({
      model: this._getModel(),
      prompt
    });

    const nextSummary = text.trim();
    setSessionSummary(sessionId, nextSummary);
    return nextSummary;
  }

  async _getChatContext(message, sessionId) {
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

    const sessionSummary = getSessionSummary(sessionId);
    const systemParts = [];

    if (this.systemPrompt) {
      systemParts.push(this.systemPrompt);
    }

    if (sessionSummary) {
      systemParts.push(`Conversation summary:\n${sessionSummary}`);
    }

    if (context) {
      systemParts.push(`Use this context if it is relevant:\n${context}`);
    }

    const systemMessage = systemParts.join('\n\n');

    const history = getSessionMessages(sessionId);
    const messages = history.map((item) => ({
      role: item.role,
      content: item.content
    }));

    messages.push({
      role: 'user',
      content: message
    });

    return {
      systemMessage,
      messages
    };
  }

  async _finalizeAssistantTurn(sessionId, userMessage, assistantText) {
    addSessionMessage(sessionId, 'user', userMessage);
    addSessionMessage(sessionId, 'assistant', assistantText);
    trimSessionMessages(sessionId, 12);

    const updatedHistory = getSessionMessages(sessionId);

    if (updatedHistory.length >= 8) {
      await this._generateRollingSummary(sessionId);
      trimSessionMessages(sessionId, 6);
    }
  }

  async chat(message, options = {}) {
    assertUseCaseAllowed(['sdk', 'rag', 'both'], 'SDK usage');

    if (!this.apiKey) {
      throw new Error('No API key found. Run `npx ai-persona init` first.');
    }

    const sessionId = options.sessionId || 'default';
    const { systemMessage, messages } = await this._getChatContext(message, sessionId);

    const { text } = await generateText({
      model: this._getModel(),
      system: systemMessage,
      messages
    });

    await this._finalizeAssistantTurn(sessionId, message, text);

    return text;
  }

  async streamChat(message, options = {}) {
    assertUseCaseAllowed(['sdk', 'rag', 'both'], 'SDK usage');

    if (!this.apiKey) {
      throw new Error('No API key found. Run `npx ai-persona init` first.');
    }

    const sessionId = options.sessionId || 'default';
    const { systemMessage, messages } = await this._getChatContext(message, sessionId);

    const result = streamText({
      model: this._getModel(),
      system: systemMessage,
      messages,
      experimental_transform: smoothStream({
        delayInMs: 60,
        chunking: 'word'
      })
    });

    const finalTextPromise = (async () => {
      const finalText = await result.text;
      await this._finalizeAssistantTurn(sessionId, message, finalText);
      return finalText;
    })();

    return {
      textStream: result.textStream,
      text: finalTextPromise
    };
  }
}

export const ai = new AIClient();