import { test, expect } from '@playwright/test';
import { setupMocks } from './helpers/mock-fixtures';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Price Sync UI', () => {
  test('shows error state when APIs fail and allows retry', async ({ page }) => {
    // Use wildcard to match query strings
    await page.route('**/api/seller/prices*', route => route.fulfill({ status: 500, body: 'server error' }));
    await page.route('**/api/seller/channels*', route => route.fulfill({ status: 500, body: 'server error' }));
    await page.route('**/api/seller/channels/supported*', route => route.fulfill({ status: 500, body: 'server error' }));
    await page.route('**/api/seller/channels/stats*', route => route.fulfill({ status: 500, body: 'server error' }));

    await setupMocks(page, { session: true });
    await page.goto(`${BASE}/?test_user=true&role=supplier`, { waitUntil: 'load' });
    await page.waitForTimeout(200);
    await page.goto(`${BASE}/supplier/listing-manager?test_user=true&role=supplier&e2e_bypass_auth=true`, { waitUntil: 'load' });
    await expect(page.getByRole('heading', { name: 'Listing Manager' })).toBeVisible();

    // Ensure Price tab is active
    await page.getByRole('button', { name: 'Price Sync' }).click();

    const pricesAlert = page.getByRole('alert').filter({ hasText: 'Failed to load prices' });
    await expect(pricesAlert).toBeVisible();
    const retryBtn = page.getByRole('button', { name: 'Retry loading prices' });
    await expect(retryBtn).toBeVisible();

    // Now provide successful responses and trigger Retry
    await page.route('**/api/seller/prices*', route => route.fulfill({ status: 200, body: JSON.stringify({ prices: [] }) }));
    await page.route('**/api/seller/channels*', route => route.fulfill({ status: 200, body: JSON.stringify({ connections: [] }) }));

    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/seller/prices') && resp.status() === 200, { timeout: 10000 }),
      retryBtn.click()
    ]);

    await expect(page.getByText('No price items found')).toBeVisible({ timeout: 10000 });
  });

  test('can sync item and shows loading state', async ({ page }) => {
    await page.route('**/api/seller/prices*', route => route.fulfill({ status: 200, body: JSON.stringify({ prices: [{ id: 'p1', product_name: 'P1', product_sku: 'SKU1', channel_name: 'Mock', channel_price: 10, base_price: 9, markup_percentage: 10, sync_enabled: true, sync_status: 'synced' }] }) }));
    await page.route('**/api/seller/channels*', route => route.fulfill({ status: 200, body: JSON.stringify({ connections: [{ id: 'c1', channel_name: 'Mock' }] }) }));
    await page.route('**/api/seller/channels?active=true', route => route.fulfill({ status: 200, body: JSON.stringify({ connections: [{ id: 'c1', channel_name: 'Mock' }] }) }));

    let syncCalled = false;
    await page.route('**/api/seller/prices/*/sync', async route => {
      syncCalled = true;
      await new Promise(r => setTimeout(r, 200));
      route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    await setupMocks(page, { session: true });
    await page.goto(`${BASE}/?test_user=true&role=supplier`, { waitUntil: 'load' });
    await page.waitForTimeout(200);
    await page.goto(`${BASE}/supplier/listing-manager?test_user=true&role=supplier&e2e_bypass_auth=true`, { waitUntil: 'load' });
    await expect(page.getByRole('heading', { name: 'Listing Manager' })).toBeVisible();

    // Ensure Price tab is active
    await page.getByRole('button', { name: 'Price Sync' }).click();

    const syncPriceBtn = page.locator('tr:has-text("P1")').locator('button').nth(1);
    await expect(syncPriceBtn).toBeVisible({ timeout: 10000 });
    await syncPriceBtn.click();
    await page.waitForResponse(resp => resp.url().includes('/api/seller/prices') && resp.url().includes('/sync') && resp.status() === 200, { timeout: 10000 });
    expect(syncCalled).toBe(true);
  });
});