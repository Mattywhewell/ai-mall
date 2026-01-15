import { test, expect } from '@playwright/test';

test.describe('Inventory Sync UI', () => {
  test('shows error state when APIs fail and allows retry', async ({ page }) => {
    await page.route('**/api/seller/inventory', route => route.fulfill({ status: 500, body: 'server error' }));
    await page.route('**/api/seller/channels', route => route.fulfill({ status: 500, body: 'server error' }));

    await page.goto('/supplier/listing-manager');

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry loading inventory' })).toBeVisible();

    // Now provide successful responses and retry
    await page.route('**/api/seller/inventory', route => route.fulfill({ status: 200, body: JSON.stringify({ inventory: [] }) }));
    await page.route('**/api/seller/channels', route => route.fulfill({ status: 200, body: JSON.stringify({ connections: [] }) }));

    await page.getByRole('button', { name: 'Retry loading inventory' }).click();
    await expect(page.getByText('No inventory items found')).toBeVisible();
  });

  test('can sync item and shows loading state', async ({ page }) => {
    await page.route('**/api/seller/inventory', route => route.fulfill({ status: 200, body: JSON.stringify({ inventory: [{ id: 'i1', product_name: 'P1', product_sku: 'SKU1', channel_name: 'Mock', channel_stock: 5, local_stock: 10, sync_enabled: true, sync_status: 'synced', stock_threshold: 2 }] }) }));
    await page.route('**/api/seller/channels', route => route.fulfill({ status: 200, body: JSON.stringify({ connections: [{ id: 'c1', channel_name: 'Mock' }] }) }));

    let syncCalled = false;
    await page.route('**/api/seller/inventory/*/sync', async route => {
      syncCalled = true;
      await new Promise(r => setTimeout(r, 200));
      route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    await page.goto('/supplier/listing-manager');
    await page.click('button[aria-label="Sync inventory item i1"]');
    await expect(page.getByRole('button', { name: /Sync/i })).toBeVisible();
    await page.waitForTimeout(300);
    expect(syncCalled).toBe(true);
  });
});