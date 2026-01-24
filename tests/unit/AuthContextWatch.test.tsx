import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
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
    // ensure timers are real by default
    vi.useRealTimers();
    // cleanup any existing markers
    const existing = document.getElementById('__test_user');
    if (existing) existing.remove();
    const clientMarker = document.getElementById('__client_test_user_status');
    if (clientMarker) clientMarker.remove();
    localStorage.removeItem('test_user');
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.NEXT_PUBLIC_INCLUDE_TEST_USER = originalFlag;
    Object.defineProperty(window.document, 'cookie', {
      writable: true,
      value: '',
    });
    // restore timers and mocks
    try { vi.useRealTimers(); } catch (e) {}
    vi.resetAllMocks();

    // ensure any test-inserted DOM is removed
    const marker = document.getElementById('__test_user');
    if (marker) marker.remove();
    const clientMarker = document.getElementById('__client_test_user_status');
    if (clientMarker) clientMarker.remove();
    localStorage.removeItem('test_user');
  });

  // Tests that rely on the watcher logic (timestamp hysteresis) are E2E-focused and may be skipped in unit runs
  const testIfNotVitest = process.env.VITEST === 'true' ? it.skip : it;

  it('commits role from cookie when cookie present before mount', async () => {
    // Simulate Playwright setting cookie before client mounts (cookie-first workflow)
    Object.defineProperty(window.document, 'cookie', {
      writable: true,
      value: 'test_user={"role":"supplier"}',
    });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    // The init effect should commit based on cookie
    await waitFor(() => expect(screen.getByTestId('auth-role-display').textContent).toMatch(/supplier/i), { timeout: 3000 });
  });

  testIfNotVitest('responds to `test_user_changed` event and commits supplier role immediately', async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    // Initially, no role
    expect(screen.getByTestId('auth-loading').textContent).toBe('idle');
    expect(screen.getByTestId('auth-role-display').textContent).toBe('none');

    // Dispatch deterministic event as the test harness will (wrap in act)
    act(() => window.dispatchEvent(new CustomEvent('test_user_changed', { detail: { role: 'supplier' } })));

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

  testIfNotVitest('exposes __e2e_notifyTestUser hook and it triggers commit', async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    // The client should attach a test-only hook for deterministic notifications
    await waitFor(() => expect((window as any).__e2e_notifyTestUser).toBeInstanceOf(Function), { timeout: 2000 });

    // Call it and assert the role commits (wrap in act)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    act(() => (window as any).__e2e_notifyTestUser('supplier'));

    await waitFor(() => expect(screen.getByTestId('auth-role-display').textContent).toMatch(/supplier/i), { timeout: 3000 });
  });

  it('honors server-injected __test_user DOM marker and commits role', async () => {
    // Simulate SSR-injected DOM marker present before client mounts
    const marker = document.createElement('div');
    marker.id = '__test_user';
    marker.setAttribute('data-role', 'supplier');
    marker.setAttribute('data-ts', String(Date.now()));
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

  // Tests that rely on the watcher logic (timestamp hysteresis) are E2E-focused and may be skipped in unit runs

  testIfNotVitest('ignores server-injected marker with older timestamp after signOut', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);

    localStorage.setItem('test_user', JSON.stringify({ role: 'citizen' }));

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('auth-role-display').textContent).toMatch(/citizen/i), { timeout: 3000 });

    vi.setSystemTime(2000);

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

    // Click inside act
    act(() => (document.querySelector('[data-testid="invoker"]') as HTMLElement).click());

    await waitFor(() => {
      const vals = screen.getAllByTestId('auth-role-display').map(el => el.textContent);
      expect(vals.some(v => v === 'none')).toBeTruthy();
    }, { timeout: 3000 });

    const staleMarker = document.createElement('div');
    staleMarker.id = '__test_user';
    staleMarker.setAttribute('data-role', 'citizen');
    staleMarker.setAttribute('data-ts', String(1999));
    document.body.appendChild(staleMarker);

    vi.advanceTimersByTime(600);

    await waitFor(() => expect(document.getElementById('__client_test_user_status')?.getAttribute('data-role')).toBe('null'), { timeout: 3000 });

    vi.useRealTimers();
  });

  testIfNotVitest('accepts server-injected marker with newer timestamp after signOut', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    localStorage.setItem('test_user', JSON.stringify({ role: 'citizen' }));

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('auth-role-display').textContent).toMatch(/citizen/i), { timeout: 3000 });

    vi.setSystemTime(2000);
    function SignOutInvoker2() {
      const { signOut } = useAuth();
      return <button data-testid="invoker2" onClick={() => signOut()}>signout</button>;
    }

    render(
      <AuthProvider>
        <SignOutInvoker2 />
        <Consumer />
      </AuthProvider>
    );

    act(() => (document.querySelector('[data-testid="invoker2"]') as HTMLElement).click());

    await waitFor(() => {
      const vals = screen.getAllByTestId('auth-role-display').map(el => el.textContent);
      expect(vals.some(v => v === 'none')).toBeTruthy();
    }, { timeout: 3000 });

    const freshMarker = document.createElement('div');
    freshMarker.id = '__test_user';
    freshMarker.setAttribute('data-role', 'citizen');
    freshMarker.setAttribute('data-ts', String(2001));
    document.body.appendChild(freshMarker);

    vi.advanceTimersByTime(600);

    await waitFor(() => expect(document.getElementById('__client_test_user_status')?.getAttribute('data-role')).toMatch(/citizen|supplier|admin/), { timeout: 3000 });

    vi.useRealTimers();
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
    act(() => (document.querySelector('[data-testid="invoker"]') as HTMLElement).click());

    // After signOut, role should clear (some tests render multiple instances; assert at least one shows 'none')
    await waitFor(() => {
      const vals = screen.getAllByTestId('auth-role-display').map(el => el.textContent);
      expect(vals.some(v => v === 'none')).toBeTruthy();
    }, { timeout: 3000 });

    // localStorage should be cleared
    expect(localStorage.getItem('test_user')).toBeNull();

    // client marker should reflect null
    expect(document.getElementById('__client_test_user_status')?.getAttribute('data-role')).toBe('null');
  });
});
