import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.js', 'src/cli.js'],
  format: ['esm', 'cjs'],
  splitting: false,
  sourcemap: true,
  clean: true,
  target: 'node16',
  banner: {
    js: '#!/usr/bin/env node',
  },
});