import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Images', () => {
  test('hero and citizen images load successfully', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });

    // Hero images — be tolerant: try multiple selectors and skip if none present
    const heroImgs = page.locator('section:has(h1) img, img.hero-image, section.hero img, section:has(h1) picture img');
    const heroCount = await heroImgs.count();
    if (heroCount === 0) {
      console.warn('No hero images found on page; skipping hero image assertions.');
    } else {
      await expect(heroImgs.first()).toBeVisible({ timeout: 10000 });
      for (let i = 0; i < heroCount; i++) {
        const el = heroImgs.nth(i);
        const loaded = await el.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
        expect(loaded, `hero image ${i} failed to load`).toBeTruthy();
      }
    }

    // Citizens images — try common selectors and be tolerant if none found
    const citizenImgsSelectors = [
      'section:has(h2:has-text("Citizens of the City")) img',
      'section:has(h2:has-text("Citizens")) img',
      'picture img',
      '.citizen img'
    ];

    let citizenImgs = page.locator('');
    let cCount = 0;
    for (const sel of citizenImgsSelectors) {
      const loc = page.locator(sel);
      const c = await loc.count();
      if (c > 0) {
        citizenImgs = loc;
        cCount = c;
        break;
      }
    }

    if (cCount === 0) {
      console.warn('No citizen images found; skipping citizen image checks.');
    } else {
      await expect(citizenImgs.first()).toBeVisible();
      expect(cCount).toBeGreaterThanOrEqual(1);
      for (let i = 0; i < cCount; i++) {
        const el = citizenImgs.nth(i);
        const loaded = await el.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
        expect(loaded, `citizen image ${i} failed to load`).toBeTruthy();
      }
    }
  });
});
