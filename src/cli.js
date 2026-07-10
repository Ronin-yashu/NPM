async function main() {
  const args = process.argv.slice(2);
  const [command, subcommand, arg1, arg2] = args;

  if (command === 'init') {
    const { runWizard } = await import('./wizard.js');
    await runWizard();
    return;
  }

  if (command === 'chat') {
    const { runChat } = await import('./chat.js');
    await runChat(subcommand);
    return;
  }

  if (command === 'rag') {
    const { indexDocuments } = await import('./rag.js');

    if (subcommand === 'init') {
      const result = await indexDocuments(arg1 || './docs');
      console.log(`Indexed ${result.chunks} chunks from ${result.indexedFiles} files.`);
      return;
    }

    console.log('Usage: ai-persona rag init <folder>');
    return;
  }

  if (command === 'memory') {
    const {
      listSessions,
      clearSession,
      clearAllSessions,
      deleteSession,
      getSessionMessages,
      getRecentSessionMessages,
      summarizeSession
    } = await import('./memory.js');

    if (subcommand === 'list') {
      const sessions = listSessions();

      if (!sessions.length) {
        console.log('No memory sessions found.');
        return;
      }

      console.log('Saved memory sessions:');
      for (const session of sessions) {
        console.log(`- ${session}`);
      }
      return;
    }

    if (subcommand === 'show') {
      const sessionId = arg1 || 'default';
      const messages = getSessionMessages(sessionId);

      if (!messages.length) {
        console.log(`No messages found for session "${sessionId}".`);
        return;
      }

      console.log(`Memory for session "${sessionId}":\n`);

      for (const message of messages) {
        console.log(`[${message.createdAt}] ${message.role}> ${message.content}\n`);
      }
      return;
    }

    if (subcommand === 'recent') {
      const sessionId = arg1 || 'default';
      const count = Number.parseInt(arg2 || '5', 10);
      const messages = getRecentSessionMessages(sessionId, Number.isNaN(count) ? 5 : count);

      if (!messages.length) {
        console.log(`No messages found for session "${sessionId}".`);
        return;
      }

      console.log(`Recent messages for session "${sessionId}":\n`);

      for (const message of messages) {
        console.log(`[${message.createdAt}] ${message.role}> ${message.content}\n`);
      }
      return;
    }

    if (subcommand === 'summary') {
      const sessionId = arg1 || 'default';
      const summary = summarizeSession(sessionId);
      console.log(summary);
      return;
    }

    if (subcommand === 'clear') {
      if (arg1 === 'all') {
        clearAllSessions();
        console.log('Cleared memory for all sessions.');
        return;
      }

      const sessionId = arg1 || 'default';
      clearSession(sessionId);
      console.log(`Cleared memory for session "${sessionId}".`);
      return;
    }

    if (subcommand === 'delete') {
      const sessionId = arg1 || 'default';
      deleteSession(sessionId);
      console.log(`Deleted memory session "${sessionId}".`);
      return;
    }

    console.log(`
Usage:
  ai-persona memory list
  ai-persona memory show <sessionId>
  ai-persona memory recent <sessionId> <count>
  ai-persona memory summary <sessionId>
  ai-persona memory clear <sessionId>
  ai-persona memory clear all
  ai-persona memory delete <sessionId>
`);
    return;
  }

  console.log(`
Usage:
  ai-persona init
  ai-persona chat [sessionId]
  ai-persona rag init <folder>
  ai-persona memory list
  ai-persona memory show <sessionId>
  ai-persona memory recent <sessionId> <count>
  ai-persona memory summary <sessionId>
  ai-persona memory clear <sessionId>
  ai-persona memory clear all
  ai-persona memory delete <sessionId>
`);
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});