import { NextResponse } from 'next/server';

/**
 * GET /api/supplier/orders
 * Get orders for supplier
 */
export async function GET() {
  try {
    // Mock data - in production, fetch from database
    const orders = [
      {
        id: '1',
        order_number: 'ORD-2024-001',
        customer_name: 'John Doe',
        product_name: 'Smart Watch Pro',
        quantity: 2,
        total_amount: 299.98,
        status: 'pending',
        created_at: new Date().toISOString(),
        shipping_address: '123 Main St, San Francisco, CA 94102',
      },
      {
        id: '2',
        order_number: 'ORD-2024-002',
        customer_name: 'Jane Smith',
        product_name: 'Wireless Headphones',
        quantity: 1,
        total_amount: 149.99,
        status: 'processing',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        shipping_address: '456 Oak Ave, Los Angeles, CA 90001',
      },
      {
        id: '3',
        order_number: 'ORD-2024-003',
        customer_name: 'Bob Johnson',
        product_name: 'Laptop Stand',
        quantity: 3,
        total_amount: 89.97,
        status: 'shipped',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        shipping_address: '789 Pine Rd, Seattle, WA 98101',
      },
    ];

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Fetch orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
