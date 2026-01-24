import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

// Only run when test API is explicitly enabled (mirrors server gating)
test.skip(!(process.env.NEXT_PUBLIC_INCLUDE_TEST_PAGES === 'true' || process.env.CI === 'true'), 'test-only endpoints not enabled');

test('server clears test_user SSR marker via /api/test/clear-test-user', async ({ page }) => {
  // 1) Set test user via server endpoint (response sets cookie)
  await page.goto(`${BASE}/api/test/set-test-user?role=citizen`, { waitUntil: 'domcontentloaded' });

  // 2) Navigate to a page and assert SSR marker exists
  await page.goto(`${BASE}/?cb=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  const markerCount = await page.locator('#__test_user').count();
  expect(markerCount).toBeGreaterThan(0);

  // 3) Call the clear endpoint and ensure it returns OK
  const clearResp = await page.goto(`${BASE}/api/test/clear-test-user`);
  expect(clearResp?.ok()).toBeTruthy();

  // 4) Navigate again and confirm the SSR marker is gone
  await page.goto(`${BASE}/?cb=${Date.now() + 1}`, { waitUntil: 'domcontentloaded' });
  const markerAfter = await page.locator('#__test_user').count();
  expect(markerAfter).toBe(0);
});