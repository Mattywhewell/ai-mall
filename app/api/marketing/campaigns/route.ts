import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create email campaign
export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  try {
    const {
      name,
      type,
      subject,
      template,
      target_segment,
      scheduled_at,
    } = await request.json();

    const { data: campaign, error } = await supabase
      .from('email_campaigns')
      .insert({
        name,
        type,
        subject,
        template,
        target_segment,
        status: scheduled_at ? 'scheduled' : 'draft',
        scheduled_at,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      campaign_id: campaign.id,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get campaigns
export async function GET(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  try {
    let query = supabase
      .from('email_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: campaigns, error } = await query;

    if (error) throw error;

    return NextResponse.json({ campaigns: campaigns || [] });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
