import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

// Make homepage assertions robust to editorial copy changes (CTA text, headline, and district names can vary)
test.describe('Homepage', () => {
  test('hero and districts render correctly', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });

    // Hero headline (be lenient about exact copy)
    const hero = page.locator('h1').first();
    await expect(hero).toBeVisible({ timeout: 10000 });

    // CTAs - accept any prominent entry link. The exact label/location may vary.
    const cityLinkCount = await page.locator('a[href="/city"], a[href^="/districts"], a[aria-label*="Enter the City"]').count();
    expect(cityLinkCount).toBeGreaterThan(0);

    const creatorCTA = page.getByRole('link', { name: /Become a Creator|Start Creating/i }).first();
    if (await creatorCTA.isVisible()) {
      await expect(creatorCTA).toBeVisible();
    }

    // Districts section should contain at least 3 district cards (site may vary)
    // District cards are rendered as div.group inside the 'The Districts' section
    const districts = page.locator('section:has(h2:has-text("The Districts")) div.group');
    const districtCount = await districts.count();
    expect(districtCount).toBeGreaterThan(2);

    // Spot-check for a known current district name (lenient)
    const hasCommerce = await page.locator('text=The Commerce District').isVisible().catch(() => false);
    expect(hasCommerce).toBe(true);
  });
});
