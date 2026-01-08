import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const shop = url.searchParams.get('shop');
    const state = url.searchParams.get('state');

    // Validate state cookie
    const cookies = req.cookies;
    const savedState = cookies.get('shopify_oauth_state')?.value;
    const savedShop = cookies.get('shopify_oauth_shop')?.value;
    if (!state || state !== savedState || shop !== savedShop) {
      return NextResponse.json({ error: 'Invalid OAuth state or shop mismatch' }, { status: 400 });
    }

    const clientId = process.env.SHOPIFY_API_KEY;
    const clientSecret = process.env.SHOPIFY_API_SECRET;

    if (!code || !shop || !clientId || !clientSecret) {
      return NextResponse.json({ error: 'Missing data for token exchange' }, { status: 400 });
    }

    // Exchange code for access token
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code })
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('Failed Shopify token response', tokenData);
      return NextResponse.json({ error: 'Failed to obtain access token' }, { status: 500 });
    }

    // Save connection to DB (encrypt token)
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { encryptText } = await import('@/lib/encryption');
    const accessTokenEnc = encryptText(tokenData.access_token);

    // Upsert connection for this shop
    const { data, error } = await supabase
      .from('seller_channel_connections')
      .upsert({ seller_id: userId, channel_type: 'shopify', channel_name: shop, store_url: `https://${shop}`, access_token: accessTokenEnc, connection_status: 'connected', is_active: true }, { onConflict: ['seller_id', 'channel_type', 'store_url'] })
      .select()
      .single();

    if (error) {
      console.error('Upsert shopify connection error', error);
      return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 });
    }

    // Audit: Shopify connection created
    try {
      const { logAudit } = await import('@/lib/audit');
      await logAudit(userId, 'user', 'shopify_connected', { shop, connection_id: data.id, store_url: `https://${shop}` });
    } catch (auditErr) {
      console.error('Audit log failed for shopify callback', auditErr);
    }

    // Redirect back to the listing manager UI
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/supplier/listing-manager`;
    const res = NextResponse.redirect(redirectUrl);
    // Clear oauth cookies
    res.cookies.delete('shopify_oauth_state');
    res.cookies.delete('shopify_oauth_shop');
    return res;
  } catch (err) {
    console.error('GET /api/seller/channels/shopify/callback error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}