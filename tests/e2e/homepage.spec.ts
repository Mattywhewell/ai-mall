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

    // Hero headline
    const hero = page.locator('h1', { hasText: 'Enter the City Where Memory Takes Shape' });
    await expect(hero).toBeVisible({ timeout: 10000 });

    // CTAs
    await expect(page.getByRole('link', { name: 'Enter the City' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Become a Creator' }).first()).toBeVisible();

    // Districts section should contain 6 district cards
    const districts = page.locator('section:has(h2:has-text("Districts")) article');
    await expect(districts).toHaveCount(6);

    // Spot-check one known district
    await expect(page.locator('text=The Memory Bazaar')).toBeVisible();
  });
});
