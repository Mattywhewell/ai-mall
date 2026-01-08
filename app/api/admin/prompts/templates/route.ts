import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('ai_prompt_templates')
      .select('*')
      .order('category');

    if (error) {
      console.error('Error fetching prompt templates:', error);
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    return NextResponse.json({ templates: data });
  } catch (err) {
    console.error('Templates GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
