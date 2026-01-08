import { getSupabaseClient } from '@/lib/supabase-server';

/**
 * Store CJdropshipping order response in Supabase orders table.
 * @param supplierId - The supplier's ID
 * @param orderResponse - The full response object from CJdropshipping
 */
export async function saveCJOrderResponseToDB(supplierId: string, orderResponse: any) {
  const supabase = getSupabaseClient();
  const data = orderResponse.data || {};
  const { orderId, orderNumber, orderStatus, actualPayment, productInfoList, interceptOrderReasons } = data;

  const { error } = await supabase.from('orders').insert({
    supplier_id: supplierId,
    cj_order_id: orderId,
    cj_order_number: orderNumber,
    cj_order_status: orderStatus,
    cj_actual_payment: actualPayment,
    cj_product_info: productInfoList,
    cj_intercept_reasons: interceptOrderReasons,
    cj_raw_response: orderResponse,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  if (error) throw new Error('Failed to save CJ order to DB: ' + error.message);
}
