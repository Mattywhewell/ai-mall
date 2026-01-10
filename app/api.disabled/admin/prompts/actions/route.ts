import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, name, version, userId } = body;
    if (!action || !name || typeof version !== 'number' || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    if (action === 'activate') {
      const { data: versionData, error: fetchError } = await supabase
        .from('ai_prompt_versions')
        .select('is_locked')
        .eq('name', name)
        .eq('version', version)
        .single();

      if (fetchError || !versionData) return NextResponse.json({ error: 'Version not found' }, { status: 404 });
      if (versionData.is_locked) return NextResponse.json({ error: 'Version locked' }, { status: 400 });

      await supabase.from('ai_prompt_versions').update({ is_active: false }).eq('name', name);
      const { error } = await supabase
        .from('ai_prompt_versions')
        .update({ is_active: true })
        .eq('name', name)
        .eq('version', version);

      if (error) return NextResponse.json({ error: 'Failed to activate' }, { status: 500 });

      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: `prompt_activated`,
        resource_type: 'ai_prompt',
        resource_id: `${name}_v${version}`,
        details: { prompt_name: name, version },
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'lock') {
      const { error } = await supabase
        .from('ai_prompt_versions')
        .update({ is_locked: true })
        .eq('name', name)
        .eq('version', version);

      if (error) return NextResponse.json({ error: 'Failed to lock' }, { status: 500 });

      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: `prompt_locked`,
        resource_type: 'ai_prompt',
        resource_id: `${name}_v${version}`,
        details: { prompt_name: name, version },
      });

      return NextResponse.json({ success: true });
    }

    if (action === 'rollback') {
      // same as activate
      await supabase.from('ai_prompt_versions').update({ is_active: false }).eq('name', name);
      const { error } = await supabase
        .from('ai_prompt_versions')
        .update({ is_active: true })
        .eq('name', name)
        .eq('version', version);

      if (error) return NextResponse.json({ error: 'Failed to rollback' }, { status: 500 });

      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: `prompt_rolled_back`,
        resource_type: 'ai_prompt',
        resource_id: `${name}_v${version}`,
        details: { prompt_name: name, version },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('Prompt action error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
