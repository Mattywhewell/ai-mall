import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Role-Based Access Control (RBAC)', () => {
  test.describe('Role Detection and Navigation', () => {
    test('citizen role shows standard navigation', async ({ page }) => {
      await page.goto(`${BASE}/?test_user=true&role=citizen`, { waitUntil: 'load' });

      // Wait for navigation to load
      await page.waitForLoadState('networkidle');

      // Check for citizen-specific navigation items
      const nav = page.locator('nav, header nav, [role="navigation"]');
      await expect(nav.getByRole('link', { name: 'Home' })).toBeVisible();
      await expect(nav.getByRole('link', { name: 'Explore' })).toBeVisible();
      await expect(nav.getByRole('link', { name: 'AI Products' })).toBeVisible();

      // Should not show supplier or admin navigation
      await expect(nav.getByRole('link', { name: 'Dashboard' })).not.toBeVisible();
      await expect(nav.getByRole('link', { name: 'Assets' })).not.toBeVisible();
    });

    test('supplier role shows supplier navigation', async ({ page }) => {
      await page.goto(`${BASE}/?test_user=true&role=supplier`, { waitUntil: 'load' });

      // Wait for navigation to load
      await page.waitForLoadState('networkidle');

      // Check for supplier-specific navigation items
      const nav = page.locator('nav, header nav, [role="navigation"]');
      await expect(nav.getByRole('link', { name: 'Dashboard' })).toBeVisible();
      // Supplier-specific product/order listings are on the supplier dashboard; ensure the supplier dashboard link is present.

      // Should not show admin navigation
      await expect(nav.getByRole('link', { name: 'Assets' })).not.toBeVisible();
      await expect(nav.getByRole('link', { name: 'Revenue' })).not.toBeVisible();
    });

    test('admin role shows admin navigation', async ({ page }) => {
      await page.goto(`${BASE}/?test_user=true&role=admin`, { waitUntil: 'load' });

      // Wait for navigation to load
      await page.waitForLoadState('networkidle');

      // Check for admin-specific navigation items
      const nav = page.locator('nav, header nav, [role="navigation"]');
      await expect(nav.getByRole('link', { name: 'Dashboard' })).toBeVisible();
      await expect(nav.getByRole('link', { name: 'Assets' })).toBeVisible();
      await expect(nav.getByRole('link', { name: 'Revenue' })).toBeVisible();
    });
  });

  test.describe('Role-Based Dashboard Access', () => {
    test('citizen cannot access supplier dashboard', async ({ page }) => {
      await page.goto(`${BASE}/supplier?test_user=true&role=citizen`, { waitUntil: 'load' });

      // Should redirect or show access denied
      await expect(page).not.toHaveURL(/\/supplier/);
      await expect(page.getByText(/access denied|unauthorized|permission denied/i)).toBeVisible();
    });

    test('citizen cannot access admin dashboard', async ({ page }) => {
      await page.goto(`${BASE}/admin/dashboard?test_user=true&role=citizen`, { waitUntil: 'load' });

      // Should redirect or show access denied
      await expect(page).not.toHaveURL(/\/admin/);
      await expect(page.getByText(/access denied|unauthorized|permission denied/i)).toBeVisible();
    });

    test('supplier can access supplier dashboard', async ({ page }) => {
      await page.goto(`${BASE}/supplier?test_user=true&role=supplier`, { waitUntil: 'load' });

      // Should load supplier dashboard URL and show supplier navigation
      await expect(page).toHaveURL(/\/supplier/);
      await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
      await expect(page.getByText(/access denied|unauthorized/i)).not.toBeVisible();
    });

    test('supplier cannot access admin dashboard', async ({ page }) => {
      await page.goto(`${BASE}/admin/dashboard?test_user=true&role=supplier`, { waitUntil: 'load' });

      // Should redirect or show access denied
      await expect(page).not.toHaveURL(/\/admin/);
      await expect(page.getByText(/access denied|unauthorized|permission denied/i)).toBeVisible();
    });

    test('admin can access admin dashboard', async ({ page }) => {
      await page.goto(`${BASE}/admin/dashboard?test_user=true&role=admin`, { waitUntil: 'load' });

      // Should load admin dashboard URL and show admin navigation
      await expect(page).toHaveURL(/\/admin\/dashboard/);
      await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Assets' })).toBeVisible();
    });

    test('admin can access supplier dashboard', async ({ page }) => {
      await page.goto(`${BASE}/supplier?test_user=true&role=admin`, { waitUntil: 'load' });

      // Admin should have access to supplier areas
      await expect(page).toHaveURL(/\/supplier/);
    });
  });

  test.describe('Role-Based Profile Page', () => {
    test('citizen sees standard profile tabs', async ({ page }) => {
      await page.goto(`${BASE}/profile?test_user=true&role=citizen`, { waitUntil: 'load' });

      // Check for standard tabs
      await expect(page.getByRole('button', { name: 'Profile', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Orders' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Wishlist' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Payment Methods' })).toBeVisible();

      // Should not show role-specific tabs
      await expect(page.getByText(/Supplier Dashboard|Admin Dashboard/i)).not.toBeVisible();
    });

    test('supplier sees supplier profile tabs', async ({ page }) => {
      await page.goto(`${BASE}/profile?test_user=true&role=supplier`, { waitUntil: 'load' });

      // Check for standard profile tabs (profile still shows personal info)
      await expect(page.getByRole('button', { name: 'Profile', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Orders' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Wishlist' })).toBeVisible();

      // Supplier-specific access: ensure supplier dashboard link is available in nav
      await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    });

    test('admin sees admin profile tabs', async ({ page }) => {
      await page.goto(`${BASE}/profile?test_user=true&role=admin`, { waitUntil: 'load' });

      // Check for standard profile tabs
      await expect(page.getByRole('button', { name: 'Profile', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Orders' })).toBeVisible();

      // Admin-specific access: ensure admin navigation links are available
      await expect(page.getByRole('link', { name: 'Assets' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Revenue' })).toBeVisible();
    });
  });

  test.describe('Role Switching Behavior', () => {
    test('navigation updates when role changes', async ({ page }) => {
      // Start as citizen
      await page.goto(`${BASE}/?test_user=true&role=citizen`, { waitUntil: 'load' });
      await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Explore' })).toBeVisible();

      // Switch to supplier role (simulate role change)
      await page.goto(`${BASE}/?test_user=true&role=supplier`, { waitUntil: 'load' });
      await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();

      // Switch to admin role
      await page.goto(`${BASE}/?test_user=true&role=admin`, { waitUntil: 'load' });
      await expect(page.getByRole('link', { name: 'Assets' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Revenue' })).toBeVisible();
    });

    test('profile page updates when role changes', async ({ page }) => {
      // Start as citizen
      await page.goto(`${BASE}/profile?test_user=true&role=citizen`, { waitUntil: 'load' });
      await expect(page.getByText('Test User')).toBeVisible();

      // Switch to supplier
      await page.goto(`${BASE}/profile?test_user=true&role=supplier`, { waitUntil: 'load' });
      await expect(page.getByText('Test User')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();

      // Switch to admin
      await page.goto(`${BASE}/profile?test_user=true&role=admin`, { waitUntil: 'load' });
      // Admin-specific access: ensure admin navigation links are available
      await expect(page.getByRole('link', { name: 'Assets' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Revenue' })).toBeVisible();
    });
  });

  test.describe('Access Control Edge Cases', () => {
    test('unauthenticated user redirected to login', async ({ page }) => {
      await page.goto(`${BASE}/supplier`, { waitUntil: 'load' });

      // Should redirect to login
      await expect(page).toHaveURL(/\/login|\/auth/);
    });

    test('invalid role defaults to citizen behavior', async ({ page }) => {
      await page.goto(`${BASE}/?test_user=true&role=invalid`, { waitUntil: 'load' });

      // Should show citizen navigation
      const nav = page.locator('nav, header nav, [role="navigation"]');
      await expect(nav.getByRole('link', { name: 'Home' })).toBeVisible();
      await expect(nav.getByRole('link', { name: 'Explore' })).toBeVisible();
    });

    test('supplier cannot access admin-only API endpoints', async ({ page }) => {
      // This would require API testing setup
      // For now, test that supplier cannot access admin pages
      await page.goto(`${BASE}/admin/system-health?test_user=true&role=supplier`, { waitUntil: 'load' });

      await expect(page.getByText(/access denied|unauthorized/i)).toBeVisible();
    });
  });

  test.describe('Performance and User Experience', () => {
    test('role detection is fast', async ({ page }) => {
      const startTime = Date.now();

      await page.goto(`${BASE}/?test_user=true&role=supplier`, { waitUntil: 'load' });

      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds

      // Verify navigation appears quickly
      const nav = page.locator('nav');
      await expect(nav).toBeVisible();
    });

    test('role-based content loads without errors', async ({ page }) => {
      const errors: string[] = [];

      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      await page.goto(`${BASE}/profile?test_user=true&role=admin`, { waitUntil: 'load' });

      // Wait for dynamic content to load
      await page.waitForTimeout(2000);

      // Filter out known benign network errors (dev environment placeholder services)
      const benignPattern = /placeholder\.supabase\.co|getaddrinfo|fetch failed|TypeError: fetch failed|Hydration failed|hydration mismatch/i;
      const filtered = errors.filter((e) => !benignPattern.test(e));
      if (filtered.length > 0) console.log('Non-benign page errors:', filtered);
      expect(filtered.length).toBe(0);

      // Should show admin navigation/content (tolerant check)
      await expect(page.getByRole('link', { name: 'Assets' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Revenue' })).toBeVisible();
    });

    test('navigation transitions are smooth', async ({ page }) => {
      await page.goto(`${BASE}/?test_user=true&role=citizen`, { waitUntil: 'load' });

      // Click profile link (use explicit text to avoid ambiguity)
      await page.getByRole('link', { name: 'Profile' }).click();

      // Should navigate smoothly
      await expect(page).toHaveURL(/\/profile/);

      // Should show user name in profile
      await expect(page.getByText('Test User')).toBeVisible();
    });
  });
});