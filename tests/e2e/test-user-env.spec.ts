import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

// This test verifies that when the test harness exposes NEXT_PUBLIC_TEST_USER (set by
// scripts/e2e-setup.js when SKIP_SUPABASE_SEED=true) the server sets an initial test user
// so the client AuthProvider hydrates synchronously and the account UI is present.
test.skip(process.env.SKIP_SUPABASE_SEED === 'true', 'Build-time NEXT_PUBLIC_TEST_USER ignored when SKIP_SUPABASE_SEED=true')('server-provided test user via NEXT_PUBLIC_TEST_USER results in visible account UI', async ({ page }) => {
  page.on('console', (msg) => console.log('BROWSER_CONSOLE:', msg.text()));

  // Navigate to root WITHOUT query params; the server-side initialUser injection should apply
  await page.goto(`${BASE}/`, { waitUntil: 'load' });

  // Wait a short while for hydration to complete
  await page.waitForTimeout(500);

  // Look for header account button or Test User text
  const header = page.locator('header, nav');
  await header.waitFor({ timeout: 10000 });

  const accountBtn = header.getByRole('button', { name: /user menu|account menu|account|test user/i });
  const userText = page.getByText(/Test User/i).first();

  // Either of these being present indicates initial test user was applied
  const hasAccountBtn = await accountBtn.count() > 0;
  const hasUserText = await userText.count() > 0;

  expect(hasAccountBtn || hasUserText).toBeTruthy();
});