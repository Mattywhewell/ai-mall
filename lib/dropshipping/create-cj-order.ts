import { getValidCJAccessToken } from '@/lib/dropshipping/get-valid-cj-token';
import { saveCJOrderResponseToDB } from '@/lib/dropshipping/save-cj-order-response';

/**
 * Create an order in CJdropshipping using Create Order V3 API.
 * @param supplierId - The supplier's ID for token lookup
 * @param orderData - The order payload (see CJ API docs)
 * @param platformToken - Optional platformToken (can be empty)
 */
export async function createCJOrder({
  supplierId,
  orderData,
  platformToken = ''
}: {
  supplierId: string,
  orderData: any,
  platformToken?: string
}) {
  // Get a valid CJ-Access-Token
  const accessToken = await getValidCJAccessToken(supplierId);

  const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrderV3', {
    method: 'POST',
    headers: {
      'CJ-Access-Token': accessToken,
      'platformToken': platformToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(orderData)
  });

  if (!response.ok) {
    throw new Error('Failed to create CJdropshipping order');
  }
  const result = await response.json();
  // Save order response to Supabase
  await saveCJOrderResponseToDB(supplierId, result);
  return result;
}
