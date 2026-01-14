import { test, expect } from '@playwright/test';
import { setupMocks } from './helpers/mock-fixtures';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Order Sync UI', () => {
  test('shows error state when APIs fail and allows retry', async ({ page }) => {
    // Use wildcard to match query strings
    await page.route('**/api/seller/orders*', route => route.fulfill({ status: 500, body: 'server error' }));
    await page.route('**/api/seller/channels*', route => route.fulfill({ status: 500, body: 'server error' }));

    await setupMocks(page, { session: true });
    await page.goto(`${BASE}/?test_user=true&role=supplier`, { waitUntil: 'load' });
    await page.waitForTimeout(200);
    await page.goto(`${BASE}/supplier/listing-manager?test_user=true&role=supplier&e2e_bypass_auth=true`, { waitUntil: 'load' });
    await expect(page.getByRole('heading', { name: 'Listing Manager' })).toBeVisible();

    // Ensure Orders tab is active
    await page.getByRole('button', { name: 'Order Sync' }).click();

    const ordersAlert = page.getByRole('alert').filter({ hasText: 'Failed to load orders' });
    await expect(ordersAlert).toBeVisible();
    const retryBtn = page.getByRole('button', { name: 'Retry loading orders' });
    await expect(retryBtn).toBeVisible();

    // Now provide successful responses and trigger Retry
    await page.route('**/api/seller/orders*', route => route.fulfill({ status: 200, body: JSON.stringify({ orders: [] }) }));
    await page.route('**/api/seller/channels*', route => route.fulfill({ status: 200, body: JSON.stringify({ connections: [] }) }));

    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/seller/orders') && resp.status() === 200, { timeout: 10000 }),
      retryBtn.click()
    ]);

    await expect(page.getByText('No orders found')).toBeVisible({ timeout: 10000 });
  });

  test('can trigger sync all and shows loading state', async ({ page }) => {
    await page.route('**/api/seller/orders', route => route.fulfill({ status: 200, body: JSON.stringify({ orders: [] }) }));
    await page.route('**/api/seller/channels', route => route.fulfill({ status: 200, body: JSON.stringify({ connections: [{ id: 'c1', channel_name: 'Mock' }] }) }));
    await page.route('**/api/seller/channels?active=true', route => route.fulfill({ status: 200, body: JSON.stringify({ connections: [{ id: 'c1', channel_name: 'Mock' }] }) }));
    await page.route('**/api/seller/channels/supported', route => route.fulfill({ status: 200, body: JSON.stringify({ channels: [] }) }));
    await page.route('**/api/seller/channels/stats', route => route.fulfill({ status: 200, body: JSON.stringify({ stats: {} }) }));

    // Intercept sync POST to simulate delay
    let syncCalled = false;
    await page.route('**/api/seller/orders/sync', async route => {
      syncCalled = true;
      await new Promise(r => setTimeout(r, 200));
      route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    await setupMocks(page, { session: true });
    await page.goto(`${BASE}/?test_user=true&role=supplier`, { waitUntil: 'load' });
    await page.waitForTimeout(200);
    await page.goto(`${BASE}/supplier/listing-manager?test_user=true&role=supplier&e2e_bypass_auth=true`, { waitUntil: 'load' });
    await expect(page.getByRole('heading', { name: 'Listing Manager' })).toBeVisible();

    // Ensure Orders tab is active
    await page.getByRole('button', { name: 'Order Sync' }).click();

    const syncAllBtn = page.locator('button[aria-label="Sync all orders"]');
    await expect(syncAllBtn).toBeVisible({ timeout: 10000 });
    await syncAllBtn.click();
    await expect(page.getByText('Syncing...')).toBeVisible();
    // Wait for sync to finish
    await page.waitForTimeout(300);
    expect(syncCalled).toBe(true);
  });
});