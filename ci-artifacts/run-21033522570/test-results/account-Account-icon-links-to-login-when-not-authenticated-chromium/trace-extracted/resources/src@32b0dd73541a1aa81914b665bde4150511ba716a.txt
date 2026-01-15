import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Account icon', () => {
  test('links to /login when not authenticated', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });

    // Wait for account link by selector
    const account = page.locator('a[aria-label="Account"]');
    await account.waitFor({ state: 'attached', timeout: 10000 });

    // Ensure href points to /login
    const href = await account.getAttribute('href');
    expect(href).toBe('/login');

    // Programmatically navigate to the link to confirm the login page is reachable
    const resolved = new URL(href!, BASE).toString();
    await page.goto(resolved, { waitUntil: 'load' });
    expect(page.url()).toContain('/login');
  });
});
