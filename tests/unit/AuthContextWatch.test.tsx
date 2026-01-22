import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';

function Consumer() {
  const { userRole, loading } = useAuth();
  return (
    <div>
      <div data-testid="auth-loading">{loading ? 'loading' : 'idle'}</div>
      <div data-testid="auth-role-display">{userRole ?? 'none'}</div>
    </div>
  );
}

describe('AuthContext watcher picks up cookie/localStorage changes', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalFlag = process.env.NEXT_PUBLIC_INCLUDE_TEST_USER;

  beforeEach(() => {
    // production-like environment but include test user paths
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_INCLUDE_TEST_USER = 'true';
    // ensure no cookie initially
    Object.defineProperty(window.document, 'cookie', {
      writable: true,
      value: '',
    });
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.NEXT_PUBLIC_INCLUDE_TEST_USER = originalFlag;
    Object.defineProperty(window.document, 'cookie', {
      writable: true,
      value: '',
    });
    vi.resetAllMocks();
  });

  it('detects a cookie change and commits the supplier role', async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    // Initially, no role
    expect(screen.getByTestId('auth-loading').textContent).toBe('idle');
    expect(screen.getByTestId('auth-role-display').textContent).toBe('none');

    // Simulate Playwright setting cookie and firing focus
    Object.defineProperty(window.document, 'cookie', {
      writable: true,
      value: 'test_user={"role":"supplier"}',
    });
    window.dispatchEvent(new Event('focus'));

    await waitFor(() => expect(screen.getByTestId('auth-role-display').textContent).toMatch(/supplier/i), { timeout: 3000 });
  });

  it('responds to `test_user_changed` event and commits supplier role immediately', async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    // Initially, no role
    expect(screen.getByTestId('auth-loading').textContent).toBe('idle');
    expect(screen.getByTestId('auth-role-display').textContent).toBe('none');

    // Dispatch deterministic event as the test harness will
    window.dispatchEvent(new CustomEvent('test_user_changed', { detail: { role: 'supplier' } }));

    await waitFor(() => expect(screen.getByTestId('auth-role-display').textContent).toMatch(/supplier/i), { timeout: 3000 });
  });

  it('re-dispatches on init when localStorage had test_user set before mount', async () => {
    // Simulate E2E harness having set localStorage prior to the page mounting
    localStorage.setItem('test_user', JSON.stringify({ role: 'supplier' }));

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    // The role should be committed (either via the localStorage branch or via the re-dispatch)
    await waitFor(() => expect(screen.getByTestId('auth-role-display').textContent).toMatch(/supplier/i), { timeout: 3000 });
  });
});
