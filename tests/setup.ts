import '@testing-library/jest-dom';
import * as React from 'react';
// Expose React globally for tests that use classic JSX output that references `React`
;(globalThis as any).React = (globalThis as any).React || React;

// Provide a default fetch mock if tests don't mock it explicitly
if (!globalThis.fetch) {
  // @ts-ignore
  globalThis.fetch = async () => ({ ok: true, json: async () => ({}) });
}

// Compatibility: expose jest to tests that reference jest globals (alias to Vitest's `vi`)
;(globalThis as any).jest = (globalThis as any).vi;

// Ensure encryption key for encryption tests
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'test-key';

// Make Three.js available for tests that expect window.THREE
;(globalThis as any).THREE = (globalThis as any).THREE || {};

// Polyfill ResizeObserver for jsdom tests (used by react-use-measure and react-three)
class _ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-ignore
globalThis.ResizeObserver = (globalThis as any).ResizeObserver || _ResizeObserver;