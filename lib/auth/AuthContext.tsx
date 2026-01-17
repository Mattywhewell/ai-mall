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
    if (initialUser) return initialUser.role === 'admin' ? 'admin' : initialUser.role === 'supplier' ? 'supplier' : 'customer';
    if (typeof window !== 'undefined') {
      try {
        const ls = localStorage.getItem('test_user');
        if (ls) {
          const role = JSON.parse(ls).role || 'citizen';
          return role === 'admin' ? 'admin' : role === 'supplier' ? 'supplier' : 'customer';
        }
      } catch (e) {}
    }
    return null;
  });

  useEffect(() => {
    // Allow dev-only test user via localStorage or ?test_user=true (run before Supabase config check so tests work in offline mode)
    if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
      // Check localStorage first (allows Playwright to inject test user before scripts run)
      try {
        const ls = localStorage.getItem('test_user');
        if (ls) {
          const parsed = JSON.parse(ls);
          const role = parsed?.role || 'citizen';
          const mock = {
            user: {
              id: 'test-id',
              email: 'test@example.com',
              user_metadata: { full_name: 'Test User', roles: [role], is_admin: role === 'admin' },
              created_at: new Date().toISOString(),
            },
          } as any;
          setSession(mock);
          setUser(mock.user);
          setUserRole(role === 'admin' ? 'admin' : role === 'supplier' ? 'supplier' : 'customer');
          setLoading(false);
          return;
        }
      } catch (e) {
        // ignore JSON errors
      }

      const params = new URLSearchParams(window.location.search);
      if (params.get('test_user') === 'true') {
        const role = params.get('role') || 'citizen';
        const mock = {
          user: {
            id: 'test-id',
            email: 'test@example.com',
            user_metadata: { full_name: 'Test User', roles: [role], is_admin: role === 'admin' },
            created_at: new Date().toISOString(),
          },
        } as any;
        setSession(mock);
        setUser(mock.user);
        // Derive a simple userRole for client-only checks
        setUserRole(role === 'admin' ? 'admin' : role === 'supplier' ? 'supplier' : 'customer');
        setLoading(false);
        return;
      }
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
      setUserRole(roleFromMeta ? (roleFromMeta === 'admin' ? 'admin' : roleFromMeta === 'supplier' ? 'supplier' : 'customer') : null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      const roleFromMeta = (session?.user?.user_metadata as any)?.roles?.[0] || (session?.user?.user_metadata as any)?.role;
      setUserRole(roleFromMeta ? (roleFromMeta === 'admin' ? 'admin' : roleFromMeta === 'supplier' ? 'supplier' : 'customer') : null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/reset-password` : '',
    });
    return { error };
  };

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
