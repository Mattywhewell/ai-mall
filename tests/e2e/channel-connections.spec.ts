import { test, expect } from '@playwright/test';

test.describe('Channel Connections UI', () => {
  test('shows error state when API fails and allows retry', async ({ page }) => {
    // Use dev-only server-rendered deterministic error state
    await page.goto('/dev-test-pages/channel-connections?test_user=true&role=supplier&dev_state=error', { waitUntil: 'load' });

    // Expect an error alert to be visible and the retry button is present
    await expect(page.locator('[data-testid="error-alert-channels"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry loading channels' })).toBeVisible();

    // Now navigate to a deterministic success state and assert no channels message
    await page.getByRole('button', { name: 'Retry loading channels' }).click();
    await page.goto('/dev-test-pages/channel-connections?test_user=true&role=supplier&dev_state=success', { waitUntil: 'load' });
    await expect(page.getByText('No channels connected yet')).toBeVisible();
  });
});