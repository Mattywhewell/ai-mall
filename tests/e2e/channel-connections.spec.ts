import { test, expect } from '@playwright/test';

test.describe('Channel Connections UI', () => {
  test('shows error state when API fails and allows retry', async ({ page }) => {
    // Intercept the seller channels API to return 500
    await page.route('**/api/seller/channels', route => route.fulfill({ status: 500, body: 'server error' }));
    await page.route('**/api/seller/channels/supported', route => route.fulfill({ status: 500, body: 'server error' }));

    // Use a dev-only test page that mounts ChannelConnections directly (always dynamic)
    await page.goto('/dev-test-pages/channel-connections?test_user=true&role=supplier', { waitUntil: 'load' });

    // Expect an error alert to be visible
    await expect(page.locator('[data-testid="error-alert-channels"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry loading channels' })).toBeVisible();

    // Now mock success response and click retry
    await page.route('**/api/seller/channels', route => route.fulfill({ status: 200, body: JSON.stringify({ connections: [] }) }));
    await page.route('**/api/seller/channels/supported', route => route.fulfill({ status: 200, body: JSON.stringify({ channels: [] }) }));

    await page.getByRole('button', { name: 'Retry loading channels' }).click();
    await expect(page.getByText('No channels connected yet')).toBeVisible();
  });
});