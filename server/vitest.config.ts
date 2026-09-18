import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: path.resolve(import.meta.dirname),
  resolve: {
    alias: {
      '@shared': path.resolve(import.meta.dirname, '../src'),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
    },
  },
});
