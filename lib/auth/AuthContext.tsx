'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, role?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Allow test user via ?test_user=true (run this before Supabase checks so tests and previews can simulate users)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('test_user') === 'true') {
        console.log('AuthContext: test_user flag detected; injecting mock user (test-mode)');
        const roleParam = params.get('role');
        const roles = roleParam ? roleParam.split(',').map(r => r.trim()) : [];
        const mock = {
          user: {
            id: 'test-id',
            email: 'test@example.com',
            user_metadata: { full_name: 'Test User', roles, is_admin: roles.includes('admin') },
          },
        } as any;
        setSession(mock);
        setUser(mock.user);
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
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
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
    // If Supabase is not configured, just clear local state (useful for tests/dev)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey || supabaseKey === 'your-anon-key-here' || supabaseUrl.includes('placeholder')) {
      setSession(null);
      setUser(null);
      return;
    }

    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/auth/reset-password` : '',
    });
    return { error };
  };

  // Derive a convenient `userRole` string for consumers (will favor explicit user_metadata.role then roles[0])
  const userRole = (user && ((user as any).user_metadata?.role || (user as any).user_metadata?.roles?.[0])) || null;

  return (
    <AuthContext.Provider
      value={{ user, session, loading, userRole, signIn, signInWithGoogle, signUp, signOut, resetPassword }}
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
