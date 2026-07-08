async function main() {
  const [, , command, subcommand, arg] = process.argv;

  if (command === 'init') {
    const { runWizard } = await import('./wizard.js');
    await runWizard();
    return;
  }

  if (command === 'chat') {
    const { runChat } = await import('./chat.js');
    await runChat();
    return;
  }

  if (command === 'rag') {
    const { indexDocuments } = await import('./rag.js');

    if (subcommand === 'init') {
      const result = await indexDocuments(arg || './docs');
      console.log(`Indexed ${result.chunks} chunks from ${result.indexedFiles} files.`);
      return;
    }

    console.log('Usage: ai-persona rag init <folder>');
    return;
  }

  console.log(`
Usage:
  ai-persona init
  ai-persona chat
  ai-persona rag init <folder>
`);
}

main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});