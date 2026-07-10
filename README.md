# @yashu_jaat01/ai-persona

A fluent AI SDK and CLI for terminal chat, personalities, session memory, project integration, and simple local RAG.

## Features

- Interactive setup wizard
- Terminal chat mode
- Named chat sessions with local memory
- Memory commands: list, show, recent, summary, clear, delete
- SDK-based AI usage in projects
- Local RAG for `.txt` and `.md` files
- Multi-provider support
- Use-case based feature locking

## Installation

```bash
npm install @yashu_jaat01/ai-persona
```

## Setup

Run the interactive setup wizard:

```bash
npx ai-persona init
```

The wizard asks for:

- Use case
- Provider
- API key
- AI personality

It creates:

- `.ai-persona/config.json`
- `.env`

## Use Case Modes

Your selected use case unlocks only the features relevant to that mode.

### `cli`

Unlocked:
- `npx ai-persona chat`
- Session-based local memory commands

Locked:
- SDK usage
- RAG indexing
- RAG retrieval

### `sdk`

Unlocked:
- `import { ai } from '@yashu_jaat01/ai-persona'`
- `ai.chat(...)`

Locked:
- CLI chat
- RAG indexing
- RAG retrieval

### `rag`

Unlocked:
- `npx ai-persona rag init ./docs`
- RAG-based SDK answers after indexing

Locked:
- CLI chat
- Non-RAG SDK mode

### `both`

Unlocked:
- CLI chat
- SDK usage
- RAG indexing
- RAG retrieval

To change your mode later, re-run:

```bash
npx ai-persona init
```

## CLI Usage

CLI chat is available in `cli` or `both` mode.

### Start chat

```bash
npx ai-persona chat
```

### Start chat with a named session

```bash
npx ai-persona chat project-alpha
```

Type `exit` to quit.

## Memory Commands

Session memory commands are available for saved local chat sessions.

### List sessions

```bash
npx ai-persona memory list
```

### Show full session history

```bash
npx ai-persona memory show project-alpha
```

### Show recent messages

```bash
npx ai-persona memory recent project-alpha 5
```

### Show session summary

```bash
npx ai-persona memory summary project-alpha
```

### Clear one session

```bash
npx ai-persona memory clear project-alpha
```

### Clear all sessions

```bash
npx ai-persona memory clear all
```

### Delete one session

```bash
npx ai-persona memory delete project-alpha
```

## SDK Usage

SDK usage is available in `sdk`, `rag`, or `both` mode.

```js
import { ai } from '@yashu_jaat01/ai-persona';

const reply = await ai
  .personality('Senior developer')
  .chat('Explain closures in simple words');

console.log(reply);
```

### SDK chat with session memory

```js
import { ai } from '@yashu_jaat01/ai-persona';

const reply = await ai.chat('Remember that my favorite language is JavaScript.', {
  sessionId: 'project-alpha'
});

console.log(reply);
```

## RAG Usage

RAG is available in `rag` or `both` mode.

RAG answers only work after you index your files first.

### Step 1: Index your files

```bash
npx ai-persona rag init ./docs
```

This creates:

```bash
.ai-persona/rag-store.json
```

### Step 2: Ask RAG-based questions

```js
import { ai } from '@yashu_jaat01/ai-persona';

const reply = await ai.chat('What does the documentation say about authentication?');
console.log(reply);
```

If a RAG index exists, the package retrieves relevant document chunks and uses them as context.

## Chatbot Integration

In `both` mode, you can use the package to build chatbots in your own apps.

```js
import { ai } from '@yashu_jaat01/ai-persona';

const reply = await ai.chat('Hello, how can you help me?');
console.log(reply);
```

If RAG is enabled and files are indexed first, chatbot responses can also be grounded in your local documents.

## Provider Support

### Chat providers

- Google
- OpenAI
- Anthropic

### Embedding providers for RAG

- Google
- OpenAI

Anthropic is not currently supported for embeddings in the RAG pipeline.

## Troubleshooting

### Feature is locked

If you see a locked-feature error, your current use case does not allow that feature.

Re-run:

```bash
npx ai-persona init
```

and choose a different mode.

### Memory is not showing expected results

Make sure:

1. You are using the same session name
2. You exited chat normally after sending messages
3. You are checking the correct session with `memory show` or `memory summary`

### RAG is not working

Make sure:

1. You selected `rag` or `both`
2. You indexed files first
3. `.ai-persona/rag-store.json` exists

## Local Development

```bash
npm install
npm run build
node dist/cli.js init
node dist/cli.js chat
node dist/cli.js chat project-alpha
node dist/cli.js memory list
node dist/cli.js rag init ./docs
```

## License

ISC