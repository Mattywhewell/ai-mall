import { createClient as supabaseCreateClient } from '@supabase/supabase-js';

export { supabaseCreateClient as createClient };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey
  });
}

export const supabase = supabaseCreateClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

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
