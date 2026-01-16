import { test, expect } from '@playwright/test';

test.describe('Price Sync UI', () => {
  test('shows error state when APIs fail and allows retry', async ({ page }) => {
    await page.route('**/api/seller/prices', route => route.fulfill({ status: 500, body: 'server error' }));
    await page.route('**/api/seller/channels*', route => route.fulfill({ status: 500, body: 'server error' }));

    await page.goto('/test-pages/price-sync?test_user=true&role=supplier', { waitUntil: 'load' });

    await expect(page.locator('[data-testid="error-alert-prices"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry loading prices' })).toBeVisible();

    // Now provide successful responses and retry
    await page.route('**/api/seller/prices', route => route.fulfill({ status: 200, body: JSON.stringify({ prices: [] }) }));
    await page.route('**/api/seller/channels*', route => route.fulfill({ status: 200, body: JSON.stringify({ connections: [] }) }));

    await page.getByRole('button', { name: 'Retry loading prices' }).click();
    await expect(page.getByText('No price items found')).toBeVisible();
  });

  test('can sync item and shows loading state', async ({ page }) => {
    await page.route('**/api/seller/prices*', route => route.fulfill({ status: 200, body: JSON.stringify({ prices: [{ id: 'p1', product_name: 'P1', product_sku: 'SKU1', channel_name: 'Mock', channel_price: 10, base_price: 9, markup_percentage: 10, sync_enabled: true, sync_status: 'synced' }] }) }));
    await page.route('**/api/seller/channels*', route => route.fulfill({ status: 200, body: JSON.stringify({ connections: [{ id: 'c1', channel_name: 'Mock' }] }) }));

    let syncCalled = false;
    await page.route('**/api/seller/prices/*/sync', async route => {
      syncCalled = true;
      await new Promise(r => setTimeout(r, 200));
      route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    await page.goto('/test-pages/price-sync?test_user=true&role=supplier', { waitUntil: 'load' });
    await expect(page.getByText('P1', { exact: true })).toBeVisible();
    await expect(page.locator('button[aria-label="Sync price p1"]')).toBeVisible({ timeout: 5000 });
    await page.click('button[aria-label="Sync price p1"]');
    await expect(page.locator('button[aria-label="Sync price p1"]')).toBeDisabled();
    await expect(page.locator('button[aria-label="Sync price p1"] .animate-spin')).toBeVisible();
    await page.waitForTimeout(300);
    expect(syncCalled).toBe(true);
  });
});