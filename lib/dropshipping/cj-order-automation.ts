import { getValidCJAccessToken } from '@/lib/dropshipping/get-valid-cj-token';

/**
 * Add a CJ order to cart (required for balance payment flows)
 */
export async function addCJOrderToCart({ supplierId, cjOrderId }: { supplierId: string, cjOrderId: string }) {
  const accessToken = await getValidCJAccessToken(supplierId);
  const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/addCart', {
    method: 'POST',
    headers: {
      'CJ-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cjOrderIdList: [cjOrderId] })
  });
  if (!response.ok) throw new Error('Failed to add CJ order to cart');
  return response.json();
}

/**
 * Confirm a CJ order in cart (required for balance payment flows)
 */
export async function confirmCJOrderCart({ supplierId, cjOrderId }: { supplierId: string, cjOrderId: string }) {
  const accessToken = await getValidCJAccessToken(supplierId);
  const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/addCartConfirm', {
    method: 'POST',
    headers: {
      'CJ-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ cjOrderIdList: [cjOrderId] })
  });
  if (!response.ok) throw new Error('Failed to confirm CJ order cart');
  return response.json();
}

/**
 * Pay for a CJ order using balance
 */
export async function payCJOrderBalance({ supplierId, orderId }: { supplierId: string, orderId: string }) {
  const accessToken = await getValidCJAccessToken(supplierId);
  const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/pay/payBalance', {
    method: 'POST',
    headers: {
      'CJ-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orderId })
  });
  if (!response.ok) throw new Error('Failed to pay CJ order by balance');
  return response.json();
}

/**
 * Confirm a CJ order (final step for non-balance payment)
 */
export async function confirmCJOrder({ supplierId, orderId }: { supplierId: string, orderId: string }) {
  const accessToken = await getValidCJAccessToken(supplierId);
  const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/confirmOrder', {
    method: 'PATCH',
    headers: {
      'CJ-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orderId })
  });
  if (!response.ok) throw new Error('Failed to confirm CJ order');
  return response.json();
}
