import { test, expect } from '@playwright/test';

test.describe('Product Mappings UI', () => {
  test('shows error state when APIs fail and allows retry', async ({ page }) => {
    await page.route('**/api/seller/product-mappings', route => route.fulfill({ status: 500, body: 'server error' }));
    await page.route('**/api/seller/products', route => route.fulfill({ status: 500, body: 'server error' }));
    await page.route('**/api/seller/channels*', route => route.fulfill({ status: 500, body: 'server error' }));

    await page.goto('/test-pages/product-mappings?test_user=true&role=supplier', { waitUntil: 'load' });

    await expect(page.locator('[data-testid="error-alert-products"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry loading product mappings' })).toBeVisible();

    // Now mock successful responses and retry
    await page.route('**/api/seller/product-mappings', route => route.fulfill({ status: 200, body: JSON.stringify({ mappings: [] }) }));
    await page.route('**/api/seller/products', route => route.fulfill({ status: 200, body: JSON.stringify({ products: [] }) }));
    await page.route('**/api/seller/channels*', route => route.fulfill({ status: 200, body: JSON.stringify({ connections: [] }) }));

    await page.getByRole('button', { name: 'Retry loading product mappings' }).click();
    await expect(page.getByText('No product mappings found')).toBeVisible();
  });
});