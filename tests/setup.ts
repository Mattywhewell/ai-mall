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

// Ensure tests perform robust cleanup between runs to avoid lingering state or DOM mutations
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  try { cleanup(); } catch (e) {}
  try { document.body.innerHTML = ''; } catch (e) {}
  try { localStorage.clear(); } catch (e) {}
  try { document.cookie = ''; } catch (e) {}
  try { const marker = document.getElementById('__test_user'); if (marker) marker.remove(); } catch (e) {}
  try { const clientMarker = document.getElementById('__client_test_user_status'); if (clientMarker) clientMarker.remove(); } catch (e) {}
  try { (globalThis as any).__e2e_notifyTestUser = undefined; } catch (e) {}
  try { (globalThis as any).React = (globalThis as any).React; } catch (e) {}
  try { vi.resetAllMocks(); } catch (e) {}
  try { vi.useRealTimers(); } catch (e) {}
});

// Test-only diagnostic: dump active handles/requests when VITEST_DUMP_HANDLES is set or when SIGUSR2 is received.
// This helps detect worker-level deadlocks in Vitest (similar to Jest's --detectOpenHandles).
if (process.env.VITEST_DUMP_HANDLES === '1' || process.env.VITEST_DUMP_HANDLES === 'true') {
  const dump = (tag = 'scheduled') => {
    try {
      // eslint-disable-next-line no-console
      console.warn('--- VITEST_DUMP_HANDLES START (' + tag + ') PID:' + process.pid + ' ---');
      // eslint-disable-next-line no-console
      console.warn('time:', new Date().toISOString());
      // eslint-disable-next-line no-console
      console.warn('activeHandles:', process._getActiveHandles().map((h: any) => ({ type: h && h.constructor && h.constructor.name, details: h && (h.address || h._sock || h._server ? 'socket/server' : '') })));
      // eslint-disable-next-line no-console
      console.warn('activeRequests:', process._getActiveRequests());
      // eslint-disable-next-line no-console
      console.warn('--- VITEST_DUMP_HANDLES END ---');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('VITEST_DUMP_HANDLES failed', e && (e.message || e));
    }
  };

  // Schedule an automatic dump after 2 minutes to catch hangs that don't respond to signals
  setTimeout(() => dump('timeout-2m'), 120000);

  // Also allow manual triggering via SIGUSR2 for interactive debugging
  try {
    process.on('SIGUSR2', () => dump('sigusr2'));
  } catch (e) {
    // ignore on platforms that don't support signals
  }
}