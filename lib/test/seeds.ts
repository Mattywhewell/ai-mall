// Test-only seeded data for deterministic E2E tests. This file is safe for tests only and can be removed
// or replaced by a test server endpoint in the future.
export const seededInventory = [
  {
    id: 'i1',
    product_id: 'p1',
    product_name: 'P1',
    product_sku: 'SKU1',
    local_stock: 10,
    channel_connection_id: 'c1',
    channel_name: 'Mock',
    channel_stock: 5,
    channel_product_id: 'cp1',
    channel_sku: 'CSKU1',
    sync_enabled: true,
    last_sync: new Date().toISOString(),
    sync_status: 'synced',
    stock_threshold: 2,
  },
];

export const seededChannels = [
  {
    id: 'c1',
    channel_name: 'Mock',
  },
];
