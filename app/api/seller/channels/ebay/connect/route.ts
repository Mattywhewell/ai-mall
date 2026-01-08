import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Redirect user to eBay OAuth page. eBay uses OAuth2 with redirect flow.
    const clientId = process.env.EBAY_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/seller/channels/ebay/callback`;
    const state = Math.random().toString(36).slice(2);
    const scopes = process.env.EBAY_SCOPES || 'https://api.ebay.com/oauth/api_scope/sell.inventory';

    const url = `https://auth.ebay.com/oauth2/authorize?client_id=${encodeURIComponent(clientId || '')}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${encodeURIComponent(state)}`;

    const res = NextResponse.redirect(url);
    res.cookies.set('ebay_oauth_state', state, { httpOnly: true, sameSite: 'lax' });
    return res;
  } catch (err) {
    console.error('GET /api/seller/channels/ebay/connect error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}