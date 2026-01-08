import { createCJOrder } from './create-cj-order';
import { addCJOrderToCart, confirmCJOrderCart, payCJOrderBalance, confirmCJOrder } from './cj-order-automation';
import { getValidCJAccessToken } from './get-valid-cj-token';

function isApiSuccess(response: any, httpStatus: number) {
  return httpStatus === 200 && (response.code === 200 || response.code === undefined);
}

async function safeApiCall(fn: () => Promise<Response>, step: string, retries = 2) {
  let lastError;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fn();
      const data = await res.json();
      if (isApiSuccess(data, res.status)) {
        console.log(`[CJ API] ${step} success`, data);
        return data;
      } else {
        console.error(`[CJ API] ${step} failed`, data);
        lastError = new Error(data.message || `CJ API ${step} failed`);
        if (data.code === 1600101 || data.code === 1600102) {
          // Token expired/invalid, refresh token logic can be triggered here if needed
        }
      }
    } catch (err) {
      lastError = err;
      console.error(`[CJ API] ${step} error`, err);
    }
    await new Promise(r => setTimeout(r, 1000 * (i + 1))); // Exponential backoff
  }
  throw lastError;
}

export async function fullAutomateCJOrder({
  supplierId,
  orderData,
  platformToken = '',
  useBalancePayment = false
}: {
  supplierId: string,
  orderData: any,
  platformToken?: string,
  useBalancePayment?: boolean
}) {
  // 1. Create order
  const cjAccessToken = await getValidCJAccessToken(supplierId);
  const createResult = await safeApiCall(
    () => fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrderV3', {
      method: 'POST',
      headers: {
        'CJ-Access-Token': cjAccessToken,
        'platformToken': platformToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    }),
    'Create Order'
  );
  const cjOrderId = createResult?.data?.orderId;
  if (!cjOrderId) throw new Error('CJ orderId not returned');

  if (useBalancePayment) {
    // 2. Add to cart
    await safeApiCall(
      () => fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/addCart', {
        method: 'POST',
        headers: {
          'CJ-Access-Token': cjAccessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cjOrderIdList: [cjOrderId] })
      }),
      'Add to Cart'
    );
    // 3. Confirm cart
    await safeApiCall(
      () => fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/addCartConfirm', {
        method: 'POST',
        headers: {
          'CJ-Access-Token': cjAccessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cjOrderIdList: [cjOrderId] })
      }),
      'Confirm Cart'
    );
    // 4. Pay by balance
    await safeApiCall(
      () => fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/pay/payBalance', {
        method: 'POST',
        headers: {
          'CJ-Access-Token': cjAccessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId: cjOrderId })
      }),
      'Pay by Balance'
    );
  } else {
    // 2. Confirm order directly (for non-balance payment)
    await safeApiCall(
      () => fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/confirmOrder', {
        method: 'PATCH',
        headers: {
          'CJ-Access-Token': cjAccessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId: cjOrderId })
      }),
      'Confirm Order'
    );
  }

  return { success: true, cjOrderId };
}
