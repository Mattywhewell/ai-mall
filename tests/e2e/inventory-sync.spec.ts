import { test, expect } from '@playwright/test';
import { setupMocks } from './helpers/mock-fixtures';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Inventory Sync UI', () => {
  test('shows error state when APIs fail and allows retry', async ({ page }) => {
    // Match query params too using a wildcard to ensure failures surface regardless of query string
    await page.route('**/api/seller/inventory*', route => route.fulfill({ status: 500, body: 'server error' }));
    await page.route('**/api/seller/channels*', route => route.fulfill({ status: 500, body: 'server error' }));

    await setupMocks(page, { session: true });
    await page.goto(`${BASE}/?test_user=true&role=supplier`, { waitUntil: 'load' });
    await page.waitForTimeout(200);
    await page.goto(`${BASE}/supplier/listing-manager?test_user=true&role=supplier&e2e_bypass_auth=true`, { waitUntil: 'load' });
    await expect(page.getByRole('heading', { name: 'Listing Manager' })).toBeVisible();

    // Ensure Inventory tab is active so we check the inventory component's error
    await page.getByRole('button', { name: 'Inventory Sync' }).click();

    const inventoryAlert = page.getByRole('alert').filter({ hasText: 'Failed to load inventory' });
    await expect(inventoryAlert).toBeVisible();
    const retryBtn = page.getByRole('button', { name: 'Retry loading inventory' });
    await expect(retryBtn).toBeVisible();

    // Now provide successful responses and trigger the Retry action to pick up the new data
    await page.route('**/api/seller/inventory*', route => route.fulfill({ status: 200, body: JSON.stringify({ inventory: [] }) }));
    await page.route('**/api/seller/channels*', route => route.fulfill({ status: 200, body: JSON.stringify({ connections: [] }) }));

    await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/seller/inventory') && resp.status() === 200, { timeout: 10000 }),
      retryBtn.click()
    ]);

    await expect(page.getByText('No inventory items found')).toBeVisible({ timeout: 10000 });
  });

  test('can sync item and shows loading state', async ({ page }) => {
    await page.route('**/api/seller/inventory', route => route.fulfill({ status: 200, body: JSON.stringify({ inventory: [{ id: 'i1', product_name: 'P1', product_sku: 'SKU1', channel_name: 'Mock', channel_stock: 5, local_stock: 10, sync_enabled: true, sync_status: 'synced', stock_threshold: 2 }] }) }));
    // Mock channels endpoints used across components
    await page.route('**/api/seller/channels', route => route.fulfill({ status: 200, body: JSON.stringify({ connections: [{ id: 'c1', channel_name: 'Mock' }] }) }));
    await page.route('**/api/seller/channels?active=true', route => route.fulfill({ status: 200, body: JSON.stringify({ connections: [{ id: 'c1', channel_name: 'Mock' }] }) }));
    await page.route('**/api/seller/channels/supported', route => route.fulfill({ status: 200, body: JSON.stringify({ channels: [] }) }));
    await page.route('**/api/seller/channels/stats', route => route.fulfill({ status: 200, body: JSON.stringify({ stats: {} }) }));

    let syncCalled = false;
    await page.route('**/api/seller/inventory/*/sync', async route => {
      syncCalled = true;
      await new Promise(r => setTimeout(r, 200));
      route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });

    // Debug: log network requests/responses for diagnosis
    page.on('request', (req) => console.log('REQ>', req.method(), req.url()));
    page.on('response', (res) => console.log('RESP>', res.status(), res.url()));

    await setupMocks(page, { session: true });
    await page.goto(`${BASE}/?test_user=true&role=supplier`, { waitUntil: 'load' });
    await page.waitForTimeout(200);
    await page.goto(`${BASE}/supplier/listing-manager?test_user=true&role=supplier&e2e_bypass_auth=true`, { waitUntil: 'load' });
    await expect(page.getByRole('heading', { name: 'Listing Manager' })).toBeVisible();

    // Ensure Inventory tab is active
    await page.getByRole('button', { name: 'Inventory Sync' }).click();

    // Debug: inspect inventory area to see what rendered
    const invHtml = await page.locator('text=Inventory Synchronization').first().evaluate((el) => el?.closest('div')?.innerHTML || '');
    console.log('INVENTORY_HTML_SNIPPET:', invHtml.slice(0, 1000));
    const rowCount = await page.locator('table tbody tr').count();
    console.log('INVENTORY_ROW_COUNT', rowCount);
    const tbodyHtml = await page.locator('table tbody').first().evaluate(el => el.innerHTML);
    console.log('INVENTORY_TBODY_HTML', tbodyHtml.slice(0, 2000));

    const syncItemBtn = page.locator('tr:has-text("P1")').locator('button').nth(1);
    await expect(syncItemBtn).toBeVisible({ timeout: 10000 });
    await syncItemBtn.click();
    await page.waitForResponse(resp => resp.url().includes('/api/seller/inventory') && resp.url().includes('/sync') && resp.status() === 200, { timeout: 10000 });
    expect(syncCalled).toBe(true);
  });
});