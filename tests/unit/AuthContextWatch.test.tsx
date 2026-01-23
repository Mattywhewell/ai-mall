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

  it('exposes __e2e_notifyTestUser hook and it triggers commit', async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    // The client should attach a test-only hook for deterministic notifications
    await waitFor(() => expect((window as any).__e2e_notifyTestUser).toBeInstanceOf(Function), { timeout: 2000 });

    // Call it and assert the role commits
    (window as any).__e2e_notifyTestUser('supplier');

    await waitFor(() => expect(screen.getByTestId('auth-role-display').textContent).toMatch(/supplier/i), { timeout: 3000 });
  });

  it('honors server-injected __test_user DOM marker and commits role', async () => {
    // Simulate SSR-injected DOM marker present before client mounts
    const marker = document.createElement('div');
    marker.id = '__test_user';
    marker.setAttribute('data-role', 'supplier');
    document.body.appendChild(marker);

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('auth-role-display').textContent).toMatch(/supplier/i), { timeout: 3000 });

    // Also assert the client-side status marker is created and updated
    await waitFor(() => expect(document.getElementById('__client_test_user_status')).not.toBeNull(), { timeout: 2000 });
    expect(document.getElementById('__client_test_user_status')?.getAttribute('data-allowed')).toBe('true');
    expect(document.getElementById('__client_test_user_status')?.getAttribute('data-role')).toMatch(/supplier/);

    // cleanup
    document.body.removeChild(marker);
    const clientMarker = document.getElementById('__client_test_user_status');
    if (clientMarker) document.body.removeChild(clientMarker);
  });

  it('signOut clears client role, localStorage, cookie and notifies listeners', async () => {
    // Start with a test_user in localStorage so initial role is present
    localStorage.setItem('test_user', JSON.stringify({ role: 'citizen' }));

    // Render and verify initial state
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('auth-role-display').textContent).toMatch(/citizen/i), { timeout: 3000 });

    // Ensure client marker is set
    await waitFor(() => expect(document.getElementById('__client_test_user_status')?.getAttribute('data-role')).toMatch(/citizen/), { timeout: 2000 });

    // Call signOut from the provider by rendering a button that invokes it
    function SignOutInvoker() {
      const { signOut } = useAuth();
      return <button data-testid="invoker" onClick={() => signOut()}>signout</button>;
    }

    render(
      <AuthProvider>
        <SignOutInvoker />
        <Consumer />
      </AuthProvider>
    );

    // Click the invoker
    (document.querySelector('[data-testid="invoker"]') as HTMLElement).click();

    // After signOut, role should clear
    await waitFor(() => expect(screen.getByTestId('auth-role-display').textContent).toBe('none'), { timeout: 3000 });

    // localStorage should be cleared
    expect(localStorage.getItem('test_user')).toBeNull();

    // client marker should reflect null
    expect(document.getElementById('__client_test_user_status')?.getAttribute('data-role')).toBe('null');
  });
});
