import { getSupabaseClient } from '@/lib/supabase-server';
import { decryptText, encryptText } from '@/lib/encryption';

export async function exchangeLwaRefreshToken(refreshToken: string) {
  // Exchange LWA refresh token for access token
  const clientId = process.env.AMAZON_LWA_CLIENT_ID;
  const clientSecret = process.env.AMAZON_LWA_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Missing Amazon LWA client credentials');

  const url = 'https://api.amazon.com/auth/o2/token';
  const body = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken, client_id: clientId, client_secret: clientSecret });

  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
  const data = await res.json();
  if (!data.access_token) throw new Error('Failed to exchange LWA refresh token: ' + JSON.stringify(data));

  return { accessToken: data.access_token, expiresIn: data.expires_in || 3600, scope: data.scope };
}

export async function ensureLwaTokenForConnection(connectionId: string) {
  const supabase = getSupabaseClient();
  const { data: connection, error } = await supabase.from('seller_channel_connections').select('*').eq('id', connectionId).single();
  if (error || !connection) throw new Error('Connection not found');

  const now = new Date();
  if (connection.token_expires_at && new Date(connection.token_expires_at) > new Date(Date.now() + 60 * 1000)) {
    // token valid for more than 60s
    return connection.access_token;
  }

  if (!connection.refresh_token) throw new Error('No refresh token available for Amazon connection');

  const refreshToken = decryptText(connection.refresh_token);
  const { accessToken, expiresIn } = await exchangeLwaRefreshToken(refreshToken);
  const encryptedAccess = encryptText(accessToken);
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  const { data: updated, error: updErr } = await supabase.from('seller_channel_connections').update({ access_token: encryptedAccess, token_expires_at: expiresAt }).eq('id', connectionId).select().single();
  if (updErr) {
    throw new Error('Failed to update connection with new token: ' + updErr.message);
  }

  return accessToken;
}
