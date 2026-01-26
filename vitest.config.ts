import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.test.tsx'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/.next/**',
      '**/public/**',
      '**/*.sql',
      'tests/e2e/**',
      'tests/integration/**',
      '**/__snapshots__/**',
      '**/*.snap'
    ],
    // TEMP DEBUG: collect bootstrap import info and avoid worker isolation while diagnosing freezes
    logHeapUsage: true,
    onConsoleLog(log) {
      console.log('[VITEST LOG]', log)
    },
    fileParallelism: false,
    isolate: false
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.')
    }
  }
});