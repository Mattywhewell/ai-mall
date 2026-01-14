import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Create a server-side supabase client. If the SERVICE_ROLE_KEY or URL are not configured
 * (common in local dev or CI without secrets), return a harmless placeholder client to
 * avoid 500s in admin routes and allow tests to run deterministically.
 */
export async function createClient() {
  const cookieStore = await cookies();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Server-side Supabase not configured, returning placeholder server client');
    // Minimal stub that supports chained query calls used by our routes
    const stub = {
      from: (table: string) => {
        const chain: any = {
          _table: table,
          // Chaining methods should return the chain so callers can do: from(...).select(...).order(...)
          select: function (..._args: any[]) { return this; },
          order: function () { return this; },
          range: function () { return this; },
          eq: function () { return this; },
          gte: function () { return this; },
          lte: function () { return this; },
          or: function () { return this; },
          limit: function () { return this; },
          // Allow awaiting the chain (e.g., const { data } = await from(...).select(...))
          then: function (resolve: any) {
            return Promise.resolve(resolve({ data: [], count: 0, error: null }));
          },
        };
        return chain;
      }
    };
    return stub as any;
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
