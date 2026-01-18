import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**', 'tests/lib/**'],
    exclude: ['tests/e2e/**', 'tests/integration/**', '**/__snapshots__/**', '**/*.snap']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.')
    }
  }
});