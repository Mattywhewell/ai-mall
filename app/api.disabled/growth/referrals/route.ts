import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Generate referral code
export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  try {
    const { user_id, user_email } = await request.json();

    // Generate unique code
    const code = `AIMALL${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const { data: referralCode, error } = await supabase
      .from('referral_codes')
      .insert({
        user_id,
        code,
        referrer_reward_type: 'credits',
        referrer_reward_amount: 500, // 500 AI credits per conversion
        referee_reward_type: 'discount',
        referee_reward_amount: 20, // $20 off first purchase
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      code: referralCode.code,
      referrer_reward: '500 AI credits per referral',
      referee_reward: '$20 off first purchase',
      share_url: `${process.env.NEXT_PUBLIC_APP_URL}/?ref=${referralCode.code}`,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get referral stats
export async function GET(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get('user_id');

  if (!user_id) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 });
  }

  try {
    // Get user's referral code
    const { data: referralCode, error: codeError } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (codeError && codeError.code !== 'PGRST116') throw codeError;

    // Get referral uses
    const { data: uses, error: usesError } = await supabase
      .from('referral_uses')
      .select('*')
      .eq('referral_code_id', referralCode?.id);

    if (usesError) throw usesError;

    return NextResponse.json({
      code: referralCode?.code,
      total_uses: referralCode?.uses_count || 0,
      conversions: referralCode?.conversions_count || 0,
      revenue_generated: referralCode?.total_revenue_generated || 0,
      pending_uses: uses?.filter(u => !u.converted).length || 0,
      share_url: `${process.env.NEXT_PUBLIC_APP_URL}/?ref=${referralCode?.code}`,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
