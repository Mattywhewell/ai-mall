import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const name = url.searchParams.get('name');
    if (!name) return NextResponse.json({ error: 'Missing name parameter' }, { status: 400 });

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('ai_prompt_versions')
      .select('*')
      .eq('name', name)
      .order('version', { ascending: false });

    if (error) {
      console.error('Error fetching versions for', name, error);
      return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 });
    }

    return NextResponse.json({ versions: data });
  } catch (err) {
    console.error('Versions GET error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, promptText, model, temperature, maxTokens, changeReason, createdBy } = body;

    if (!name || !promptText || !createdBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // determine new version number
    const { data: latestVersion } = await supabase
      .from('ai_prompt_versions')
      .select('version')
      .eq('name', name)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    const newVersion = (latestVersion?.version || 0) + 1;

    const { data, error } = await supabase
      .from('ai_prompt_versions')
      .insert({
        name,
        version: newVersion,
        prompt_text: promptText,
        variables: {},
        model: model || 'gpt-4-turbo-preview',
        temperature: temperature ?? 0.7,
        max_tokens: maxTokens ?? 2000,
        is_active: false,
        is_locked: false,
        created_by: createdBy,
        change_reason: changeReason || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating prompt version:', error);
      return NextResponse.json({ error: 'Failed to create version' }, { status: 500 });
    }

    await supabase.from('audit_logs').insert({
      user_id: createdBy,
      action: `prompt_created`,
      resource_type: 'ai_prompt',
      resource_id: `${name}_v${newVersion}`,
      details: { prompt_name: name, version: newVersion },
    });

    return NextResponse.json({ version: data });
  } catch (err) {
    console.error('Versions POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
