#!/usr/bin/env node
import { intro } from '@clack/prompts';

const [, , command] = process.argv;

if (command === 'init') {
  const { runWizard } = await import('./wizard.js');
  await runWizard();
} else if (command === 'chat') {
  const { runChat } = await import('./chat.js');
  await runChat();
} else {
  console.log('Usage: yourpkg [init|chat]');
}