import { getValidCJAccessToken } from '@/lib/dropshipping/get-valid-cj-token';
import { updateCJOrderStatus } from './update-cj-order-status';
import { supabase } from '@/lib/supabaseClient';

/**
 * Periodically sync order statuses from CJdropshipping to Supabase.
 * Fetches all orders with non-final status and updates them.
 */
export async function syncCJOrderStatuses(supplierId: string) {
  // Get all orders for this supplier that are not completed/cancelled
  const { data: orders, error } = await supabase
    .from('orders')
    .select('cj_order_id, cj_order_status')
    .eq('supplier_id', supplierId)
    .not('cj_order_status', 'in', ['completed', 'cancelled']);

  if (error) throw new Error('Failed to fetch orders for sync: ' + error.message);
  if (!orders || orders.length === 0) return;

  const accessToken = await getValidCJAccessToken(supplierId);

  for (const order of orders) {
    // Example: Replace with actual CJ API endpoint for order status
    const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/getOrderStatus', {
      method: 'POST',
      headers: {
        'CJ-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ orderId: order.cj_order_id })
    });
    if (!response.ok) continue;
    const result = await response.json();
    if (result && result.data && result.data.orderStatus) {
      await updateCJOrderStatus({
        cjOrderId: order.cj_order_id,
        newStatus: result.data.orderStatus,
        extraData: result.data
      });
    }
  }
}
