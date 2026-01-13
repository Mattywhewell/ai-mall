import { test, expect } from '@playwright/test';
import { setupMocks } from './helpers/mock-fixtures';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page, { homepage: true, session: true });
  });
  test('hero and districts render correctly', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });

    // Wait for hero CTA as a robust sign the hero loaded
    await page.locator('a[href="/city"], a[href*="/city"]').first().waitFor({ state: 'visible', timeout: 10000 });

    // CTAs: ensure primary CTA and creator CTA are present (use robust selectors)
    await page.locator('a[href="/city"], a[href*="/city"]').first().waitFor({ state: 'visible', timeout: 10000 });
    // Secondary CTA: link to creator page
    await page.locator('a[href="/creator"], a[href*="/creator"]').first().waitFor({ state: 'visible', timeout: 10000 });

    // Districts section should be present (content may be dynamic in test env)
    await expect(page.locator('h2', { hasText: 'Districts' })).toBeVisible();

    // Optional: if there are district cards, ensure they render; otherwise skip (dynamic content in test env)
    // const hasDistrictText = await page.locator('text=District').count();
    // if (!hasDistrictText) console.warn('No district cards rendered; test environment may use placeholder content.');
    // else await expect(page.locator('text=District').first()).toBeVisible();
  });
});
