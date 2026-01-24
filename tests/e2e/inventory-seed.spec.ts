import { test, expect } from '@playwright/test';
import { waitForSeededRow } from './helpers';

// This test is CI-only to verify the deterministic seed hook (?test_seed=inventory) used to stabilize E2E.
// It is intentionally skipped locally to avoid interfering with developer workflows.
test('CI-only: seeded inventory path renders deterministic row', async ({ page }) => {
  // Skip when not running in CI (GitHub Actions sets CI=true)
  test.skip(!process.env.CI, 'CI-only assertion for seeded inventory path');

  // Skip when seeding is intentionally disabled in CI via SKIP_SUPABASE_SEED
  test.skip(process.env.SKIP_SUPABASE_SEED === 'true', 'SKIP_SUPABASE_SEED=true -> skipping seeded inventory test');

  await page.goto('/supplier/listing-manager?test_user=true&role=supplier&test_seed=inventory', { waitUntil: 'load' });

  // Dismiss onboarding overlays if present
  try {
    await page.locator('button:has-text("Skip tutorial")').click({ timeout: 1500 });
  } catch (e) {}
  try {
    await page.locator('button[aria-label="Close"]').click({ timeout: 1500 });
  } catch (e) {}

  // `P1` is the seeded row; wait robustly for it (soft reloads & up to 20s)
  const ok = await waitForSeededRow(page, 'P1', 20000);
  if (!ok) {
    const dom = await page.content();
    console.log('SEED_MISSING: page snapshot (first 2000 chars):', dom.slice(0, 2000));
  }
  expect(ok).toBeTruthy();
  const row = page.locator('tr', { hasText: 'P1' });
  await expect(row).toBeVisible({ timeout: 5000 });

  // Ensure sync button exists and triggers the API route (we mock server-side in other tests)
  const syncBtn = row.getByRole('button', { name: /Sync/i });
  await expect(syncBtn).toBeVisible();
});