# @yashu_jaat01/ai-persona

A fluent AI SDK and CLI for terminal chat, personalities, project integration, and simple local RAG.

## Features

- Interactive setup wizard
- Terminal chat mode
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

Your selected use case unlocks specific features only.

### `cli`
Unlocked:
- `npx ai-persona chat`

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

Only available in `cli` or `both` mode.

```bash
npx ai-persona chat
```

Type `exit` to quit.

## SDK Usage

Only available in `sdk`, `rag`, or `both` mode.

```javascript
import { ai } from '@yashu_jaat01/ai-persona';

const reply = await ai
  .personality('Senior developer')
  .chat('Explain closures in simple words');

console.log(reply);
```

## RAG Usage

Only available in `rag` or `both` mode.

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

```javascript
import { ai } from '@yashu_jaat01/ai-persona';

const reply = await ai.chat('What does the documentation say about authentication?');
console.log(reply);
```

If a RAG index exists, the package retrieves relevant document chunks and uses them as context.

## Chatbot Integration

In `both` mode, you can use the package to build chatbots in your own apps.

```javascript
import { ai } from '@yashu_jaat01/ai-persona';

const reply = await ai.chat('Hello, how can you help me?');
console.log(reply);
```

If RAG is enabled and files are indexed first, chatbot responses can also be grounded in your local documents.

## Provider Support

### Chat Providers

- Google
- OpenAI
- Anthropic

### Embedding Providers for RAG

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

### RAG is not working

Make sure:

1. You selected `rag` or `both`
2. You indexed files first
3. `.ai-persona/rag-store.json` exists

### Scope or publish errors

If you publish under your personal npm account, use your npm username as the package scope. User-scoped packages must match the owner’s scope, while organization-scoped packages require access to that organization [web:76][web:397][web:171].

## Local Development

```bash
npm install
npm run build
node dist/cli.js init
node dist/cli.js chat
node dist/cli.js rag init ./docs
```

## License

ISC