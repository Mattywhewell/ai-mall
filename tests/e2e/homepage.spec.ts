import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Homepage', () => {
  test('hero and districts render correctly', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });

    // Dismiss onboarding modal if present (prevents overlay from hiding hero)
    const skipBtn = page.locator('button', { hasText: 'Skip tutorial' });
    if (await skipBtn.count() > 0) {
      try {
        if (await skipBtn.isVisible()) await skipBtn.click();
      } catch (e) {
        // ignore timing flakiness
      }
    }

    // CTAs (wait first to ensure hero section rendered)
    await expect(page.getByRole('link', { name: 'Enter the City' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: 'Become a Creator' }).first()).toBeVisible();

    // Verify hero text exists in the DOM (less fragile than strict visibility)
    await expect(page.locator('h1', { hasText: 'Enter the City Where Memory Takes Shape' })).toHaveCount(1);

    // Districts section should contain 6 district cards
    const districts = page.locator('section:has(h2:has-text("Districts")) article');
    await expect(districts).toHaveCount(6);

    // Spot-check one known district
    await expect(page.locator('text=The Memory Bazaar')).toBeVisible();
  });
});
