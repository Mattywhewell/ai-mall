import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const clientId = process.env.TIKTOK_SHOP_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/seller/channels/tiktok_shop/callback`;
    const state = Math.random().toString(36).slice(2);
    const scopes = process.env.TIKTOK_SHOP_SCOPES || 'seller.products.read seller.orders.read';

    const url = `https://open-api.tiktokglobalshop.com/oauth/authorize?client_id=${encodeURIComponent(clientId || '')}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${encodeURIComponent(state)}`;

    const res = NextResponse.redirect(url);
    res.cookies.set('tiktok_oauth_state', state, { httpOnly: true, sameSite: 'lax' });
    return res;
  } catch (err) {
    console.error('GET /api/seller/channels/tiktok_shop/connect error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}