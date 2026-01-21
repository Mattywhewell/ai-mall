import { test, expect } from '@playwright/test';
import { ensureTestUser, dismissOnboarding } from './helpers';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

// Minimal smoke test to ensure CI mode with SKIP_SUPABASE_SEED works — inject deterministic test user via localStorage/cookie
test('ci smoke: app loads with injected test user and shows user menu', async ({ page }) => {
  await ensureTestUser(page, 'admin');
  await page.goto(`${BASE}/profile?test_user=true&role=admin`, { waitUntil: 'load' });
  await page.waitForLoadState('networkidle');
  await dismissOnboarding(page);

  const userMenu = page.locator('button[aria-label="User menu"]');
  const visible = await userMenu.isVisible().catch(() => false);
  expect(visible).toBe(true);
});

// Additional smoke: ensure SpatialEnvironment loads on /commons
test('ci smoke: /commons environment loads', async ({ page }) => {
  await ensureTestUser(page, 'admin');
  await page.goto(`${BASE}/commons?test_user=true&role=admin`, { waitUntil: 'load' });
  await page.waitForLoadState('networkidle');
  await dismissOnboarding(page);

  const env = page.locator('[data-testid="spatial-environment"]');
  // Be more tolerant in CI; give the environment up to 20s to initialize
  await env.waitFor({ state: 'visible', timeout: 20000 }).catch(() => null);
  const envVisible = await env.isVisible().catch(() => false);
  expect(envVisible).toBe(true);
});