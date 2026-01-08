import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data: packages, error } = await supabase
      .from('supplier_onboarding_packages')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ packages: packages || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
