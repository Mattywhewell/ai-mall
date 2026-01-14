import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // run unit tests in node environment for server-side checks
    setupFiles: ['./tests/setup.ts'],
    testDir: 'tests',
    include: ['tests/lib/**/*.test.ts'],
    // Ensure TypeScript/TSX files are transformed for the test environment
    transformMode: {
      web: [/\.tsx?$/]
    },
    // Use node threads disabled to avoid CJS deprecation in some environments
    threads: false,
    // Limit concurrency to avoid environmental issues on Windows CI
    isolate: false
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.')
    }
  }
});