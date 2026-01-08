import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const savedState = req.cookies.get('tiktok_oauth_state')?.value;
    if (!code || !state || state !== savedState) return NextResponse.json({ error: 'Invalid OAuth state' }, { status: 400 });

    const clientId = process.env.TIKTOK_SHOP_CLIENT_ID;
    const clientSecret = process.env.TIKTOK_SHOP_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/seller/channels/tiktok_shop/callback`;

    // Exchange code for access token - endpoint and parameters may differ; placeholder
    const tokenRes = await fetch('https://open-api.tiktokglobalshop.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri })
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('TikTok token error', tokenData);
      return NextResponse.json({ error: 'Failed to retrieve token' }, { status: 500 });
    }

    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { encryptText } = await import('@/lib/encryption');
    const accessTokenEnc = encryptText(tokenData.access_token);

    const { data, error } = await supabase.from('seller_channel_connections').insert({ seller_id: userId, channel_type: 'tiktok_shop', channel_name: 'TikTok Shop', access_token: accessTokenEnc, connection_status: 'connected', is_active: true }).select().single();

    if (error) {
      console.error('TikTok upsert error', error);
      return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 });
    }

    // Audit
    try { const { logAudit } = await import('@/lib/audit'); await logAudit(userId, 'user', 'tiktok_connected', { connection_id: data.id }); } catch (e) { console.error('audit error', e); }

    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/supplier/listing-manager`;
    const res = NextResponse.redirect(redirectUrl);
    res.cookies.delete('tiktok_oauth_state');
    return res;
  } catch (err) {
    console.error('GET /api/seller/channels/tiktok_shop/callback error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}