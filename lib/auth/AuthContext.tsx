'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, role?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children, initialUser }: { children: React.ReactNode; initialUser?: { role?: string } }) {
  // Prefer server-provided initialUser (from searchParams) to avoid SSR/CSR hydration mismatches during tests
  const [user, setUser] = useState<User | null>(() => {
    if (initialUser) {
      const role = initialUser.role || 'citizen';
      return {
        id: 'test-id',
        email: 'test@example.com',
        user_metadata: { full_name: 'Test User', roles: [role], is_admin: role === 'admin' },
        created_at: new Date().toISOString(),
      } as any;
    }
    if (typeof window !== 'undefined') {
      try {
        const ls = localStorage.getItem('test_user');
        if (ls) {
          const role = JSON.parse(ls).role || 'citizen';
          return {
            id: 'test-id',
            email: 'test@example.com',
            user_metadata: { full_name: 'Test User', roles: [role], is_admin: role === 'admin' },
            created_at: new Date().toISOString(),
          } as any;
        }
      } catch (e) {}
    }
    return null;
  });
  const [session, setSession] = useState<Session | null>(() => {
    if (initialUser) {
      const role = initialUser.role || 'citizen';
      return { user: { id: 'test-id', email: 'test@example.com', user_metadata: { full_name: 'Test User', roles: [role], is_admin: role === 'admin' }, created_at: new Date().toISOString() } } as any;
    }
    if (typeof window !== 'undefined') {
      try {
        const ls = localStorage.getItem('test_user');
        if (ls) {
          const role = JSON.parse(ls).role || 'citizen';
          return { user: { id: 'test-id', email: 'test@example.com', user_metadata: { full_name: 'Test User', roles: [role], is_admin: role === 'admin' }, created_at: new Date().toISOString() } } as any;
        }
      } catch (e) {}
    }
    return null;
  });
  const [loading, setLoading] = useState(!initialUser);
  const [userRole, setUserRole] = useState<string | null>(() => {
    if (initialUser) return initialUser.role === 'admin' ? 'admin' : initialUser.role === 'supplier' ? 'supplier' : 'citizen';
    if (typeof window !== 'undefined') {
      try {
        const ls = localStorage.getItem('test_user');
        if (ls) {
          const role = JSON.parse(ls).role || 'citizen';
          return role === 'admin' ? 'admin' : role === 'supplier' ? 'supplier' : 'citizen';
        }
      } catch (e) {}
    }
    return null;
  });

  // Single commit helper available to all effects so we can centralize the DIAG at the point of state mutation
  const commitRole = (source: string, role: string | null, mock?: any) => {
    try {
      // eslint-disable-next-line no-console
      console.info('DIAG: AuthContext commitRole', { source, role, timestamp: Date.now() });
    } catch (e) {}
    if (mock) {
      setSession(mock);
      setUser(mock.user);
    }
    const normalized = role ? (role === 'admin' ? 'admin' : role === 'supplier' ? 'supplier' : 'citizen') : null;
    setUserRole(normalized);
    setLoading(false);

    // TEST-ONLY: update a small DOM marker so E2E traces show whether the client accepted test-user
    try {
      if (typeof window !== 'undefined') {
        let marker = document.getElementById('__client_test_user_status');
        if (!marker) {
          marker = document.createElement('div');
          marker.id = '__client_test_user_status';
          marker.style.display = 'none';
          document.body.appendChild(marker);
        }
        marker.setAttribute('data-allowed', allowTestUserClient ? 'true' : 'false');
        marker.setAttribute('data-role', normalized ?? 'null');
      }
    } catch (e) {}
  };

  // Allow test-only client behavior when explicitly enabled (or in development)
  const allowTestUserClient = (process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_INCLUDE_TEST_USER === 'true') && typeof window !== 'undefined';

  useEffect(() => {
    // DIAG: record that the init effect ran (timestamp + document readyState) so we can see if this effect fires in CI
    try {
      // eslint-disable-next-line no-console
      console.info('DIAG: AuthContext initEffect fired', { timestamp: Date.now(), readyState: typeof window !== 'undefined' ? document.readyState : null });
    } catch (e) {}

    // Allow dev-only test user via server-injected marker, localStorage or ?test_user=true (run before Supabase config check so tests work in offline mode)


    if (allowTestUserClient) {
      // Check for a server-injected DOM marker first (SSR marker) — this is the most deterministic
      // indication of what the server rendered for this page and should take precedence so
      // client-side polling/older cookies can't accidentally override SSR during navigation races.
      try {
        const serverMarkerRole = typeof document !== 'undefined' && document.getElementById('__test_user')
          ? document.getElementById('__test_user')?.getAttribute('data-role')
          : null;
        if (serverMarkerRole) {
          try {
            // eslint-disable-next-line no-console
            console.info('DIAG: AuthContext server-marker -> role', { role: serverMarkerRole });
          } catch (e) {}
          const mock = {
            user: {
              id: 'test-id',
              email: 'test@example.com',
              user_metadata: { full_name: 'Test User', roles: [serverMarkerRole], is_admin: serverMarkerRole === 'admin' },
              created_at: new Date().toISOString(),
            },
          } as any;
          // Commit but do not return — continue with normal flow so Supabase init still runs
          commitRole('server-marker', serverMarkerRole, mock);
        }
      } catch (e) {}

      // Check localStorage first (allows Playwright to inject test user before scripts run)
      try {
        const ls = localStorage.getItem('test_user');
        if (ls) {
          const parsed = JSON.parse(ls);
          const role = parsed?.role || 'citizen';
          // DIAG: log localStorage-derived role for CI traces
          try {
            // eslint-disable-next-line no-console
            console.info('DIAG: AuthContext localStorage -> role', { role, parsed });
          } catch (e) {}
          const mock = {
            user: {
              id: 'test-id',
              email: 'test@example.com',
              user_metadata: { full_name: 'Test User', roles: [role], is_admin: role === 'admin' },
              created_at: new Date().toISOString(),
            },
          } as any;
          commitRole('localStorage', role, mock);
           return;
         }
       } catch (e) {
         // ignore JSON errors
       }

       const params = new URLSearchParams(window.location.search);
       if (params.get('test_user') === 'true') {
         const role = params.get('role') || 'citizen';
         // DIAG: log query param-derived test user role
         try {
           // eslint-disable-next-line no-console
           console.info('DIAG: AuthContext searchParams -> role', { role, searchParams: Object.fromEntries(params) });
         } catch (e) {}
         const mock = {
           user: {
             id: 'test-id',
             email: 'test@example.com',
             user_metadata: { full_name: 'Test User', roles: [role], is_admin: role === 'admin' },
             created_at: new Date().toISOString(),
           },
         } as any;
        commitRole('searchParams', role, mock);
        return;
       }

       // Also support cookie-based test_user for Playwright (cookie-first workflow)
       try {
         const cookieMatch = document.cookie && document.cookie.match(/(?:^|;)\s*test_user=([^;]+)/);
         if (cookieMatch) {
           try {
             const parsed = JSON.parse(decodeURIComponent(cookieMatch[1]));
             const role = parsed?.role || 'citizen';
             // DIAG: log cookie-derived role for CI traces
             try {
               // eslint-disable-next-line no-console
               console.info('DIAG: AuthContext cookie -> role', { role, cookieRaw: cookieMatch[1] });
             } catch (e) {}
             const mock = {
               user: {
                 id: 'test-id',
                 email: 'test@example.com',
                 user_metadata: { full_name: 'Test User', roles: [role], is_admin: role === 'admin' },
                 created_at: new Date().toISOString(),
               },
             } as any;
            commitRole('cookie', role, mock);
            return;
           } catch (e) {
             // ignore parse errors
           }
         }
       } catch (e) {
         // ignore cookie access errors (very rare)
       }
     }

    // Re-dispatch test_user_changed on init when a test user is present so clients
    // that mounted after the E2E harness dispatched the event still get notified.
    if (allowTestUserClient && typeof window !== 'undefined') {
      try {
        let roleToDispatch: string | null = null;
        try {
          // Prefer the server-injected DOM marker if present
          const serverMarkerRole = document.getElementById('__test_user')?.getAttribute('data-role') || null;
          if (serverMarkerRole) {
            roleToDispatch = serverMarkerRole;
          }
        } catch (e) {}
        try {
          const ls = localStorage.getItem('test_user');
          if (!roleToDispatch && ls) {
            roleToDispatch = JSON.parse(ls)?.role || null;
          }
        } catch (e) {}
        try {
          const cookieMatch = document.cookie && document.cookie.match(/(?:^|;)\s*test_user=([^;]+)/);
          if (!roleToDispatch && cookieMatch) {
            try {
              roleToDispatch = JSON.parse(decodeURIComponent(cookieMatch[1]))?.role || null;
            } catch (e) {}
          }
        } catch (e) {}

        // Provide a small API the test harness can call directly in-page (more deterministic
        // than cross-context events during navigations). This is test-only and gated.
        try {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - attaching test helper
          window.__e2e_notifyTestUser = (r: string | null) => {
            try {
              window.dispatchEvent(new CustomEvent('test_user_changed', { detail: { role: r } }));
            } catch (e) {}
          };
        } catch (e) {}

        // Dispatch on next tick so listeners are guaranteed to be attached
        setTimeout(() => {
          try {
            window.dispatchEvent(new CustomEvent('test_user_changed', { detail: { role: roleToDispatch } }));
            try { // eslint-disable-next-line no-console
              console.info('DIAG: AuthContext re-dispatch init test_user_changed', { role: roleToDispatch, timestamp: Date.now() });
            } catch (e) {}
          } catch (e) {}
        }, 0);
      } catch (e) {}
    }

    // Check if Supabase is properly configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Skip Supabase initialization if credentials are not properly configured
    if (!supabaseUrl || !supabaseKey || supabaseKey === 'your-anon-key-here' || supabaseUrl.includes('placeholder')) {
      console.warn('Supabase not configured, running in offline mode');
      setSession(null);
      setUser(null);
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      // Derive a role from session metadata if available
      const roleFromMeta = (session?.user?.user_metadata as any)?.roles?.[0] || (session?.user?.user_metadata as any)?.role;
      // DIAG: log supabase-derived role
      try {
        // eslint-disable-next-line no-console
        console.info('DIAG: AuthContext supabase.getSession -> roleFromMeta', { roleFromMeta });
      } catch (e) {}
      // Commit the role so we have a single, timestamped DIAG at the point of state mutation
      try {
        commitRole('supabase', roleFromMeta || null);
      } catch (e) {
        // If commitRole isn't available for some reason, fall back to previous behavior
        setUserRole(roleFromMeta ? (roleFromMeta === 'admin' ? 'admin' : roleFromMeta === 'supplier' ? 'supplier' : 'citizen') : null);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      const roleFromMeta = (session?.user?.user_metadata as any)?.roles?.[0] || (session?.user?.user_metadata as any)?.role;
      // DIAG: log onAuthStateChange role
      try {
        // eslint-disable-next-line no-console
        console.info('DIAG: AuthContext onAuthStateChange -> roleFromMeta', { roleFromMeta });
      } catch (e) {}
      try {
        commitRole('onAuthStateChange', roleFromMeta || null, session ? { user: session?.user } as any : undefined);
      } catch (e) {
        // fallback
        setUserRole(roleFromMeta ? (roleFromMeta === 'admin' ? 'admin' : roleFromMeta === 'supplier' ? 'supplier' : 'citizen') : null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // WATCHER: when running in test mode, poll and listen for cookie/localStorage changes so Playwright's cookie-based role switches are detected
  useEffect(() => {
    if (!allowTestUserClient || typeof window === 'undefined') return;

    let intervalId: number | undefined;
    let attempts = 0;
    const maxAttempts = 20; // ~10s of polling at 500ms

    const checkTestUser = () => {
      try {
        const ls = localStorage.getItem('test_user');
        if (ls) {
          const parsed = JSON.parse(ls);
          const role = parsed?.role || null;
          // DIAG: watcher detected localStorage-derived role
          try { // eslint-disable-next-line no-console
            console.info('DIAG: AuthContext watcher -> localStorage', { role, parsed, timestamp: Date.now() });
          } catch (e) {}
          if (role && role !== userRole) {
            const mock = {
              user: {
                id: 'test-id',
                email: 'test@example.com',
                user_metadata: { full_name: 'Test User', roles: [role], is_admin: role === 'admin' },
                created_at: new Date().toISOString(),
              },
            } as any;
            try {
              // DIAG: watcher committing new role
              // eslint-disable-next-line no-console
              console.info('DIAG: AuthContext watcher commitRole', { source: 'localStorage-watch', role, timestamp: Date.now() });
            } catch (e) {}
            commitRole('localStorage-watch', role, mock);
          }
        }
      } catch (e) {}

      try {
        const cookieMatch = document.cookie && document.cookie.match(/(?:^|;)\s*test_user=([^;]+)/);
        if (cookieMatch) {
          try {
            const parsed = JSON.parse(decodeURIComponent(cookieMatch[1]));
            const role = parsed?.role || null;
            try { // eslint-disable-next-line no-console
              console.info('DIAG: AuthContext watcher -> cookie', { role, cookieRaw: cookieMatch[1], timestamp: Date.now() });
            } catch (e) {}
            if (role && role !== userRole) {
              const mock = {
                user: {
                  id: 'test-id',
                  email: 'test@example.com',
                  user_metadata: { full_name: 'Test User', roles: [role], is_admin: role === 'admin' },
                  created_at: new Date().toISOString(),
                },
              } as any;
              try {
                // eslint-disable-next-line no-console
                console.info('DIAG: AuthContext watcher commitRole', { source: 'cookie-watch', role, timestamp: Date.now() });
              } catch (e) {}
              commitRole('cookie-watch', role, mock);
            }
          } catch (e) {}
        }
      } catch (e) {}

      // Also check for server-injected DOM marker in case SSR produced it after mount
      try {
        const serverMarker = document.getElementById('__test_user')?.getAttribute('data-role') || null;
        if (serverMarker && serverMarker !== userRole) {
          try { // eslint-disable-next-line no-console
            console.info('DIAG: AuthContext watcher -> server-marker', { role: serverMarker, timestamp: Date.now() });
          } catch (e) {}
          const mock = {
            user: {
              id: 'test-id',
              email: 'test@example.com',
              user_metadata: { full_name: 'Test User', roles: [serverMarker], is_admin: serverMarker === 'admin' },
              created_at: new Date().toISOString(),
            },
          } as any;
          try {
            // eslint-disable-next-line no-console
            console.info('DIAG: AuthContext watcher commitRole', { source: 'server-marker-watch', role: serverMarker, timestamp: Date.now() });
          } catch (e) {}
          commitRole('server-marker-watch', serverMarker, mock);
        }
      } catch (e) {}
    };

    const onFocus = () => checkTestUser();
    const onVisibility = () => { if (document.visibilityState === 'visible') checkTestUser(); };

    // Test-only event listener to deterministically detect role changes performed by the E2E harness.
    // Dispatch via: window.dispatchEvent(new CustomEvent('test_user_changed', { detail: { role: 'supplier' } }));
    const onTestUserChanged = (ev: Event) => {
      try {
        const ce = ev as CustomEvent;
        const roleFromDetail = ce?.detail?.role as string | undefined;
        if (roleFromDetail) {
          try { // eslint-disable-next-line no-console
            console.info('DIAG: AuthContext event -> role', { role: roleFromDetail, timestamp: Date.now() });
          } catch (e) {}
          if (roleFromDetail && roleFromDetail !== userRole) {
            const mock = {
              user: {
                id: 'test-id',
                email: 'test@example.com',
                user_metadata: { full_name: 'Test User', roles: [roleFromDetail], is_admin: roleFromDetail === 'admin' },
                created_at: new Date().toISOString(),
              },
            } as any;
            try { // eslint-disable-next-line no-console
              console.info('DIAG: AuthContext event commitRole', { source: 'event', role: roleFromDetail, timestamp: Date.now() });
            } catch (e) {}
            commitRole('event', roleFromDetail, mock);
            return;
          }
        }
      } catch (e) {}
      // Fallback: if no detail provided, run the existing check that reads cookie/localStorage
      try { checkTestUser(); } catch (e) {}
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('pageshow', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('test_user_changed', onTestUserChanged as EventListener);

    // Poll for a short time to catch rapid cookie changes
    intervalId = window.setInterval(() => {
      attempts += 1;
      checkTestUser();
      if (attempts >= maxAttempts && intervalId) {
        clearInterval(intervalId);
      }
    }, 500) as any;

    // Initial immediate check
    checkTestUser();

    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pageshow', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
      if (intervalId) clearInterval(intervalId);
    };
  }, [allowTestUserClient, userRole]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '',
      },
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string, role: string = 'customer') => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '',
      },
    });
    return { error };
  };

  const signOut = async () => {
    // If Supabase is not configured, just clear local state (useful for tests/dev)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const isTestApiEnabled = process.env.NEXT_PUBLIC_INCLUDE_TEST_PAGES === 'true' || process.env.CI === 'true';
    if (!supabaseUrl || !supabaseKey || supabaseKey === 'your-anon-key-here' || supabaseUrl.includes('placeholder')) {
      setSession(null);
      setUser(null);
      // Clear any client-side test user artifacts so UI updates deterministically
      try { if (typeof window !== 'undefined') localStorage.removeItem('test_user'); } catch (e) {}
      try { if (typeof window !== 'undefined') { window.dispatchEvent(new CustomEvent('test_user_changed', { detail: { role: null } })); } } catch (e) {}
      // Ensure client role state is cleared
      try { commitRole('signOut', null); } catch (e) {}

      // In dev/offline mode, also call test clear endpoint if available so server won't inject SSR marker
      if (isTestApiEnabled && typeof window !== 'undefined') {
        try {
          await fetch('/api/test/clear-test-user', { method: 'GET', credentials: 'same-origin' });
          try { console.info('DIAG: AuthContext signOut (offline): invoked /api/test/clear-test-user'); } catch (e) {}
        } catch (e) {
          try { console.warn('DIAG: AuthContext signOut (offline) failed to call /api/test/clear-test-user', e && e.message ? e.message : e); } catch (e) {}
        }
      }
      return;
    }

    await supabase.auth.signOut();

    // Call server-side test clear endpoint so the server stops injecting the SSR test_user marker.
    if (isTestApiEnabled && typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/test/clear-test-user', { method: 'GET', credentials: 'same-origin' });
        try { console.info('DIAG: AuthContext signOut: invoked /api/test/clear-test-user', { status: res.status }); } catch (e) {}

        // After clearing server-side test user, poll the ssr-probe until it reports role === null
        // This avoids a small race where the client commits null but a cookie/server-marker re-appearance
        // can immediately re-apply the previous test role (seen in CI). Poll only in test-enabled runs.
        if (isTestApiEnabled && typeof window !== 'undefined') {
          try {
            const probeApi = '/api/test/ssr-probe?cb=' + Date.now();
            const deadline = Date.now() + 500; // 500ms max
            while (Date.now() < deadline) {
              try {
                const pr = await fetch(probeApi, {
                  method: 'GET',
                  headers: {
                    'x-e2e-ssr-probe': '1',
                    'cache-control': 'no-cache',
                    'pragma': 'no-cache',
                  },
                  credentials: 'same-origin',
                });
                if (pr.ok) {
                  const body = await pr.json();
                  if (!body || body.role == null) {
                    try { console.info('DIAG: AuthContext signOut: ssr-probe shows role null'); } catch (e) {}
                    break;
                  }
                }
              } catch (e) {}
              // small backoff to yield to browser cookie application
              await new Promise((r) => setTimeout(r, 50));
            }
          } catch (e) {
            try { console.warn('DIAG: AuthContext signOut: ssr-probe polling failed', e && e.message ? e.message : e); } catch (e) {}
          }
        }

      } catch (e) {
        try { console.warn('DIAG: AuthContext signOut: failed to call /api/test/clear-test-user', e && e.message ? e.message : e); } catch (e) {}
      }
    }

    // Clear client-side test user artifacts and ensure role cleared
    try { if (typeof window !== 'undefined') localStorage.removeItem('test_user'); } catch (e) {}
    try { if (typeof window !== 'undefined') { document.cookie = 'test_user=; Max-Age=0; path=/'; } } catch (e) {}
    // Remove any server-injected SSR marker so the watcher doesn't re-apply the role
    try {
      if (typeof window !== 'undefined') {
        const marker = document.getElementById('__test_user');
        if (marker) {
          marker.remove();
          try { console.info('DIAG: AuthContext signOut: removed __test_user marker'); } catch (e) {}
        }
      }
    } catch (e) {}
    try { if (typeof window !== 'undefined') { window.dispatchEvent(new CustomEvent('test_user_changed', { detail: { role: null } })); } } catch (e) {}
    try { commitRole('signOut', null); } catch (e) {}
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/reset-password` : '',
    });
    return { error };
  };

  // The `userRole` state is already maintained above from initial data or auth metadata.

  return (
    <AuthContext.Provider
      value={{ user, session, userRole, loading, signIn, signInWithGoogle, signUp, signOut, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
