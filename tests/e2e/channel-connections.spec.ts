import { test, expect } from '@playwright/test';
import { setupMocks } from './helpers/mock-fixtures';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Channel Connections UI', () => {
  test('shows error state when API fails and allows retry', async ({ page }) => {
    // Intercept the seller channels API to return 500
    await page.route('**/api/seller/channels', route => route.fulfill({ status: 500, body: 'server error' }));
    await page.route('**/api/seller/channels/supported', route => route.fulfill({ status: 500, body: 'server error' }));

    // Ensure an authenticated session is present for supplier access
    await setupMocks(page, { session: true });

    // First visit home with test_user to bootstrap client-side mock session
    await page.goto(`${BASE}/?test_user=true&role=supplier`, { waitUntil: 'load' });
    const userMenu = page.getByRole('button', { name: /User menu/i });
    console.log('USER_MENU_COUNT', await userMenu.count());
    const testUserText = page.getByText('Test User');
    console.log('TEST_USER_COUNT', await testUserText.count());
    // Allow a short time for client-side bootstrapping
    await page.waitForTimeout(200);
    // Now navigate to listing manager
    await page.goto(`${BASE}/supplier/listing-manager?test_user=true&role=supplier&e2e_bypass_auth=true`, { waitUntil: 'load' });

    // Verify we are on the listing manager page and it loaded
    console.log('PAGE_URL_AFTER_GOTO', await page.url());

    // Debug: count Retry buttons and log first alert text
    const retryButtons = page.getByRole('button', { name: /Retry/i });
    console.log('RETRY_BUTTON_COUNT', await retryButtons.count());
    const alerts = page.getByRole('alert');
    console.log('ALERT_COUNT', await alerts.count());
    if ((await alerts.count()) > 0) {
      console.log('ALERT_TEXT', await (await alerts.first().innerText()));
    }

    await expect(page.getByRole('heading', { name: 'Listing Manager' })).toBeVisible();

    // Expect the channel error alert and retry button to be visible
    const channelErrorAlert = page.getByRole('alert').filter({ hasText: 'Failed to load channel data.' });
    await expect(channelErrorAlert).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry loading channels' })).toBeVisible();

    // Now mock success response and click retry
    await page.route('**/api/seller/channels', route => route.fulfill({ status: 200, body: JSON.stringify({ connections: [] }) }));
    await page.route('**/api/seller/channels/supported', route => route.fulfill({ status: 200, body: JSON.stringify({ channels: [] }) }));

    await page.getByRole('button', { name: 'Retry loading channels' }).click();
    await expect(page.getByText('No channels connected yet')).toBeVisible();
  });
});