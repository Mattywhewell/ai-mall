import { test, expect } from '@playwright/test';
import { setupMocks } from './helpers/mock-fixtures';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Product Mappings UI', () => {
  test('shows error state when APIs fail and allows retry', async ({ page }) => {
    // Use wildcard to match query strings
    await page.route('**/api/seller/product-mappings*', route => route.fulfill({ status: 500, body: 'server error' }));
    await page.route('**/api/seller/products*', route => route.fulfill({ status: 500, body: 'server error' }));
    await page.route('**/api/seller/channels*', route => route.fulfill({ status: 500, body: 'server error' }));
    await page.route('**/api/seller/channels/supported*', route => route.fulfill({ status: 500, body: 'server error' }));
    await page.route('**/api/seller/channels/stats*', route => route.fulfill({ status: 500, body: 'server error' }));

    await setupMocks(page, { session: true });
    await page.goto(`${BASE}/?test_user=true&role=supplier`, { waitUntil: 'load' });
    await page.waitForTimeout(200);
    await page.goto(`${BASE}/supplier/listing-manager?test_user=true&role=supplier&e2e_bypass_auth=true`, { waitUntil: 'load' });
    await expect(page.getByRole('heading', { name: 'Listing Manager' })).toBeVisible();

    // Ensure Product Mappings tab is active
    await page.getByRole('button', { name: 'Product Mappings' }).click();

    const mappingsAlert = page.getByRole('alert').filter({ hasText: 'Failed to load product mappings' });
    await expect(mappingsAlert).toBeVisible();
    const retryBtn = page.getByRole('button', { name: 'Retry loading product mappings' });
    await expect(retryBtn).toBeVisible();

    // Now mock successful responses and trigger Retry
    await page.route('**/api/seller/product-mappings*', route => route.fulfill({ status: 200, body: JSON.stringify({ mappings: [] }) }));
    await page.route('**/api/seller/products*', route => route.fulfill({ status: 200, body: JSON.stringify({ products: [] }) }));
    await page.route('**/api/seller/channels*', route => route.fulfill({ status: 200, body: JSON.stringify({ connections: [] }) }));

    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/seller/product-mappings') && resp.status() === 200, { timeout: 10000 }),
      retryBtn.click()
    ]);

    await expect(page.getByText('No product mappings found')).toBeVisible({ timeout: 10000 });
  });
});