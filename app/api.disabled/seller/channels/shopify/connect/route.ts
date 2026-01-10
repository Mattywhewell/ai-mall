import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const shop = searchParams.get('shop');
    if (!shop) return NextResponse.json({ error: 'Missing shop param' }, { status: 400 });

    const clientId = process.env.SHOPIFY_API_KEY;
    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/seller/channels/shopify/callback`;
    const scopes = process.env.SHOPIFY_SCOPES || 'read_orders,read_products,write_products,read_inventory,write_inventory';

    const state = Math.random().toString(36).slice(2);

    // Build install URL
    const installUrl = `https://${shop}/admin/oauth/authorize?client_id=${encodeURIComponent(clientId || '')}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;

    // Set state cookie for CSRF validation
    const res = NextResponse.redirect(installUrl);
    res.cookies.set('shopify_oauth_state', state, { httpOnly: true, sameSite: 'lax' });
    res.cookies.set('shopify_oauth_shop', shop, { httpOnly: true, sameSite: 'lax' });
    return res;
  } catch (err) {
    console.error('GET /api/seller/channels/shopify/connect error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}