import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ plans: plans || [] });
  } catch (error: any) {
    console.error('Fetch plans error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
