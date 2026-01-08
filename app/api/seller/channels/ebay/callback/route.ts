import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const savedState = req.cookies.get('ebay_oauth_state')?.value;
    if (!code || !state || state !== savedState) return NextResponse.json({ error: 'Invalid OAuth state' }, { status: 400 });

    const clientId = process.env.EBAY_CLIENT_ID;
    const clientSecret = process.env.EBAY_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/seller/channels/ebay/callback`;

    // Exchange code for tokens
    const tokenRes = await fetch('https://api.ebay.com/identity/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
      },
      body: `grant_type=authorization_code&code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(redirectUri)}`
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('eBay token error', tokenData);
      return NextResponse.json({ error: 'Failed to retrieve token' }, { status: 500 });
    }

    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { encryptText } = await import('@/lib/encryption');
    const accessTokenEnc = encryptText(tokenData.access_token);

    const { data, error } = await supabase.from('seller_channel_connections').insert({ seller_id: userId, channel_type: 'ebay', channel_name: 'eBay', access_token: accessTokenEnc, connection_status: 'connected', is_active: true }).select().single();

    if (error) {
      console.error('eBay upsert error', error);
      return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 });
    }

    // Audit
    try { const { logAudit } = await import('@/lib/audit'); await logAudit(userId, 'user', 'ebay_connected', { connection_id: data.id }); } catch (e) { console.error('audit error', e); }

    // Redirect to listing manager
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/supplier/listing-manager`;
    const res = NextResponse.redirect(redirectUrl);
    res.cookies.delete('ebay_oauth_state');
    return res;
  } catch (err) {
    console.error('GET /api/seller/channels/ebay/callback error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}