import { test, expect } from '@playwright/test';

test.describe('Order Sync UI', () => {
  test('shows error state when APIs fail and allows retry', async ({ page }) => {
    await page.route('**/api/seller/orders', route => route.fulfill({ status: 500, body: 'server error' }));
    await page.route('**/api/seller/channels', route => route.fulfill({ status: 500, body: 'server error' }));

    await page.goto('/supplier/listing-manager');

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry loading orders' })).toBeVisible();

    // Now provide successful responses and retry
    await page.route('**/api/seller/orders', route => route.fulfill({ status: 200, body: JSON.stringify({ orders: [] }) }));
    await page.route('**/api/seller/channels', route => route.fulfill({ status: 200, body: JSON.stringify({ connections: [] }) }));

    await page.getByRole('button', { name: 'Retry loading orders' }).click();
    await expect(page.getByText('No orders found')).toBeVisible();
  });

  test('can trigger sync all and shows loading state', async ({ page }) => {
    await page.route('**/api/seller/orders', route => route.fulfill({ status: 200, body: JSON.stringify({ orders: [] }) }));
    await page.route('**/api/seller/channels', route => route.fulfill({ status: 200, body: JSON.stringify({ connections: [{ id: 'c1', channel_name: 'Mock' }] }) }));

    // Intercept sync POST to simulate delay
    let syncCalled = false;
    await page.route('**/api/seller/orders/sync', async route => {
      syncCalled = true;
      await new Promise(r => setTimeout(r, 200));
      route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    await page.goto('/supplier/listing-manager');
    await page.click('button[aria-label="Sync all orders"]');
    await expect(page.getByText('Syncing...')).toBeVisible();
    // Wait for sync to finish
    await page.waitForTimeout(300);
    expect(syncCalled).toBe(true);
  });
});