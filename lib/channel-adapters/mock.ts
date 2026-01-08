import { ChannelAdapter } from './types';

// Mock adapter for demo and testing
export class MockAdapter implements ChannelAdapter {
  storeName: string;

  constructor(opts: { storeName?: string } = {}) {
    this.storeName = opts.storeName || 'Mock Store';
  }

  async fetchProducts(): Promise<any[]> {
    // Return deterministic mock products
    return [
      { id: 'mock-prod-1', title: `${this.storeName} - Fancy Widget`, sku: 'MW-001', price: 19.99, inventory: 42 },
      { id: 'mock-prod-2', title: `${this.storeName} - Another Thing`, sku: 'MW-002', price: 9.5, inventory: 100 }
    ];
  }

  async fetchOrders(): Promise<any[]> {
    // Return deterministic mock orders
    return [
      { id: 'mock-order-1', order_number: 'MO-1001', created_at: new Date().toISOString(), total_price: 29.49, currency: 'USD', customer: { name: 'John Doe', email: 'john@example.com' }, line_items: [{ sku: 'MW-001', quantity: 1 }] },
      { id: 'mock-order-2', order_number: 'MO-1002', created_at: new Date().toISOString(), total_price: 9.5, currency: 'USD', customer: { name: 'Jane Smith', email: 'jane@example.com' }, line_items: [{ sku: 'MW-002', quantity: 1 }] }
    ];
  }
}
