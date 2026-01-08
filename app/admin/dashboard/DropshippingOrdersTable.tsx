import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function DropshippingOrdersTable() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('cj_order_id, cj_order_number, cj_order_status, cj_actual_payment, created_at, cj_product_info')
      .order('created_at', { ascending: false })
      .limit(10);
    if (!error && data) setOrders(data);
    setLoading(false);
  };

  if (loading) return <div>Loading dropshipping orders...</div>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {orders.map((order) => (
            <tr key={order.cj_order_id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.cj_order_id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.cj_order_status}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${order.cj_actual_payment || 0}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(order.created_at).toLocaleString()}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {(order.cj_product_info || []).map((p: any, idx: number) => (
                  <div key={idx}>{p.storeLineItemId} x{p.quantity}</div>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
