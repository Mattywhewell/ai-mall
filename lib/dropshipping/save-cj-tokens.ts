import { getSupabaseClient } from '@/lib/supabase-server';

/**
 * Save or update CJdropshipping tokens and expiry dates for a supplier in Supabase.
 */
export async function saveCJTokensToSupabase(supplierId: string, {
  accessToken,
  accessTokenExpiryDate,
  refreshToken,
  refreshTokenExpiryDate,
  tokenLastRefresh
}: {
  accessToken: string;
  accessTokenExpiryDate: string;
  refreshToken: string;
  refreshTokenExpiryDate: string;
  tokenLastRefresh?: string;
}) {
  const supabase = getSupabaseClient();
  await supabase.from('suppliers').update({
    cj_access_token: accessToken,
    cj_access_token_expiry: accessTokenExpiryDate,
    cj_refresh_token: refreshToken,
    cj_refresh_token_expiry: refreshTokenExpiryDate,
    cj_token_last_refresh: tokenLastRefresh || new Date().toISOString(),
  }).eq('id', supplierId);
}
