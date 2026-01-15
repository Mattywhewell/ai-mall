import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Images', () => {
  test('hero and citizen images load successfully', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });

    // Hero images
    const heroImgs = page.locator('section:has(h1) img');
    await expect(heroImgs.first()).toBeVisible({ timeout: 10000 });

    const heroCount = await heroImgs.count();
    for (let i = 0; i < heroCount; i++) {
      const el = heroImgs.nth(i);
      const loaded = await el.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
      expect(loaded).toBeTruthy();
    }

    // Citizens images
    const citizenImgs = page.locator('section:has(h2:has-text("Citizens of the City")) img');
    await expect(citizenImgs.first()).toBeVisible();
    const cCount = await citizenImgs.count();
    expect(cCount).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < cCount; i++) {
      const el = citizenImgs.nth(i);
      const loaded = await el.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
      expect(loaded, `citizen image ${i} failed to load`).toBeTruthy();
    }
  });
});
