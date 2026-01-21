import { test, expect } from '@playwright/test';
import { ensureNoTestUser } from './helpers';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Account icon', () => {
  test('links to /login when not authenticated', async ({ page }) => {
    // If the environment pre-injects a deterministic test user (CI fallback), skip this unauthenticated assertion
    test.skip(process.env.NEXT_PUBLIC_TEST_USER === 'true' || process.env.SKIP_SUPABASE_SEED === 'true', 'Environment pre-injects a user -> skipping unauthenticated account link test');

    // Ensure no test user injection (avoid false logged-in state)
    await ensureNoTestUser(page);

    await page.goto(BASE, { waitUntil: 'load' });

    // Wait for account link by selector (give more headroom in CI)
    const account = page.locator('a[aria-label="Account"]');
    await account.waitFor({ state: 'attached', timeout: 20000 }).catch(async (e) => {
      console.log('ACCOUNT_LINK_MISSING: page snippet:', (await page.content()).slice(0, 2000));
      throw e;
    });

    // Ensure href points to the login page (legacy tests expect /login, canonical is /auth/login)
    const href = await account.getAttribute('href');
    expect(href).toMatch(/\/auth\/login|\/login/);

    // Programmatically navigate to the link to confirm the login page is reachable
    const resolved = new URL(href!, BASE).toString();
    await page.goto(resolved, { waitUntil: 'load' });
    expect(page.url()).toContain('/login');
  });
});
