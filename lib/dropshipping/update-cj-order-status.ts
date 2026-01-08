import { supabase } from '@/lib/supabaseClient';

/**
 * Update the status of a CJdropshipping order in Supabase.
 * @param cjOrderId - The CJdropshipping order ID
 * @param newStatus - The new status string
 * @param extraData - Any extra data to store (optional)
 */
export async function updateCJOrderStatus({
  cjOrderId,
  newStatus,
  extraData = {}
}: {
  cjOrderId: string,
  newStatus: string,
  extraData?: any
}) {
  const { error } = await supabase.from('orders').update({
    cj_order_status: newStatus,
    cj_status_updated_at: new Date().toISOString(),
    cj_status_extra: extraData
  }).eq('cj_order_id', cjOrderId);

  if (error) throw new Error('Failed to update CJ order status: ' + error.message);
}
