import { createCJOrder } from './create-cj-order';
import { addCJOrderToCart, confirmCJOrderCart, payCJOrderBalance, confirmCJOrder } from './cj-order-automation';

/**
 * Full CJ order automation workflow
 * @param supplierId - The supplier's ID for token lookup
 * @param orderData - The order payload (see CJ API docs)
 * @param platformToken - Optional platformToken (can be empty)
 * @param useBalancePayment - If true, use balance payment flow; else, use direct confirm
 */
export async function automateCJOrderWorkflow({
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
  const createResult = await createCJOrder({ supplierId, orderData, platformToken });
  const cjOrderId = createResult?.data?.orderId;
  if (!cjOrderId) throw new Error('CJ orderId not returned');

  if (useBalancePayment) {
    // 2. Add to cart
    await addCJOrderToCart({ supplierId, cjOrderId });
    // 3. Confirm cart
    await confirmCJOrderCart({ supplierId, cjOrderId });
    // 4. Pay by balance
    await payCJOrderBalance({ supplierId, orderId: cjOrderId });
    // 5. Optionally confirm order (if required by flow)
    // await confirmCJOrder({ supplierId, orderId: cjOrderId });
  } else {
    // 2. Confirm order directly (for non-balance payment)
    await confirmCJOrder({ supplierId, orderId: cjOrderId });
  }

  return { success: true, cjOrderId };
}
