import { createClient as supabaseCreateClient } from '@supabase/supabase-js';

export { supabaseCreateClient as createClient };

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'your-anon-key-here' || 
    process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder')) {
  console.warn('Supabase not configured, using placeholder client');
} else if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  });
}

// Lazy initialization to ensure environment variables are loaded
let _supabase: ReturnType<typeof supabaseCreateClient> | null = null;
let _supabaseAdmin: ReturnType<typeof supabaseCreateClient> | null = null;

export const supabase = (() => {
  if (!_supabase) {
    _supabase = supabaseCreateClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
    );
  }
  return _supabase;
})();

export const supabaseAdmin = () => {
  if (!_supabaseAdmin) {
    _supabaseAdmin = supabaseCreateClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
    );
  }
  return _supabaseAdmin;
};

// TypeScript types for our database schema
export interface Microstore {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  tags: string[];
  microstore_id: string;
  created_at: string;
}
