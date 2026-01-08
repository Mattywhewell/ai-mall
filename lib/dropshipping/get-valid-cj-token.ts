import { getSupabaseClient } from '@/lib/supabase-server';
import { refreshCJAccessToken } from './cj-auth';
import { saveCJTokensToSupabase } from './save-cj-tokens';

/**
 * Get a valid CJdropshipping access token for a supplier, refreshing if needed.
 * Ensures refresh is only called if token is expired and at least 5 minutes since last refresh.
 */
export async function getValidCJAccessToken(supplierId: string) {
  const supabase = getSupabaseClient();

  // Fetch supplier's CJ token info
  const { data, error } = await supabase
    .from('suppliers')
    .select('cj_access_token, cj_access_token_expiry, cj_refresh_token, cj_refresh_token_expiry, cj_token_last_refresh')
    .eq('id', supplierId)
    .single();

  if (error || !data) throw new Error('Supplier not found or DB error');

  const now = new Date();
  const accessTokenExpiry = data.cj_access_token_expiry ? new Date(data.cj_access_token_expiry) : null;
  const refreshTokenExpiry = data.cj_refresh_token_expiry ? new Date(data.cj_refresh_token_expiry) : null;
  const lastRefresh = data.cj_token_last_refresh ? new Date(data.cj_token_last_refresh) : null;

  // If access token is valid, return it
  if (data.cj_access_token && accessTokenExpiry && accessTokenExpiry > now) {
    return data.cj_access_token;
  }

  // If refresh token is expired, require re-login
  if (!data.cj_refresh_token || !refreshTokenExpiry || refreshTokenExpiry <= now) {
    throw new Error('CJdropshipping refresh token expired. Please re-authenticate.');
  }

  // Enforce 5-minute refresh interval
  if (lastRefresh && (now.getTime() - lastRefresh.getTime()) < 5 * 60 * 1000) {
    throw new Error('CJdropshipping token refresh called too soon. Wait at least 5 minutes.');
  }

  // Refresh access token
  const refreshResult = await refreshCJAccessToken(data.cj_refresh_token);
  if (!refreshResult) throw new Error('Failed to refresh CJdropshipping access token');

  // Save new tokens and expiry
  const newExpiry = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString();
  const newRefreshExpiry = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString();
  await saveCJTokensToSupabase(supplierId, {
    accessToken: refreshResult.accessToken,
    accessTokenExpiryDate: newExpiry,
    refreshToken: refreshResult.refreshToken,
    refreshTokenExpiryDate: newRefreshExpiry,
    tokenLastRefresh: now.toISOString(),
  });

  return refreshResult.accessToken;
}
