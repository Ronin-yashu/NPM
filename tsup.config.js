import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.js', 'src/cli.js'],
  format: ['esm', 'cjs'],
  splitting: false,
  clean: true,
  sourcemap: true,
  target: 'node16',
});