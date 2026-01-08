import { getSupabaseClient } from '@/lib/supabase-server';

/**
 * Generate a simple order report from Supabase.
 * @param filters - Optional filters (status, supplierId, date range)
 */
export async function generateOrderReport({
  status,
  supplierId,
  fromDate,
  toDate
}: {
  status?: string,
  supplierId?: string,
  fromDate?: string,
  toDate?: string
} = {}) {
  const supabase = getSupabaseClient();

  let query = supabase.from('orders').select('*');
  status,
  supplierId,
  fromDate,
  toDate
}: {
  status?: string,
  supplierId?: string,
  fromDate?: string,
  toDate?: string
} = {}) {
  let query = supabase.from('orders').select('*');
  if (status) query = query.eq('cj_order_status', status);
  if (supplierId) query = query.eq('supplier_id', supplierId);
  if (fromDate) query = query.gte('created_at', fromDate);
  if (toDate) query = query.lte('created_at', toDate);
  const { data, error } = await query;
  if (error) throw new Error('Failed to generate order report: ' + error.message);
  return data;
}
