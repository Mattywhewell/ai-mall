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
      await expect(nav.getByText(/Home|Explore|AI Products|Events|Subscriptions/i)).toBeVisible();

      // Should not show supplier or admin navigation
      await expect(nav.getByText(/Dashboard|Products|Orders|Analytics/i)).not.toBeVisible();
    });

    test('supplier role shows supplier navigation', async ({ page }) => {
      await page.goto(`${BASE}/?test_user=true&role=supplier`, { waitUntil: 'load' });

      // Wait for navigation to load
      await page.waitForLoadState('networkidle');

      // Check for supplier-specific navigation items
      const nav = page.locator('nav, header nav, [role="navigation"]');
      await expect(nav.getByText(/Dashboard|Products|Orders|Analytics/i)).toBeVisible();

      // Should not show admin navigation
      await expect(nav.getByText(/Users|Revenue|AI Systems/i)).not.toBeVisible();
    });

    test('admin role shows admin navigation', async ({ page }) => {
      await page.goto(`${BASE}/?test_user=true&role=admin`, { waitUntil: 'load' });

      // Wait for navigation to load
      await page.waitForLoadState('networkidle');

      // Check for admin-specific navigation items
      const nav = page.locator('nav, header nav, [role="navigation"]');
      await expect(nav.getByText(/Dashboard|Users|Revenue|AI Systems/i)).toBeVisible();
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

      // Should load supplier dashboard
      await expect(page).toHaveURL(/\/supplier/);
      await expect(page.getByText(/supplier dashboard|supplier portal/i)).toBeVisible();
    });

    test('supplier cannot access admin dashboard', async ({ page }) => {
      await page.goto(`${BASE}/admin/dashboard?test_user=true&role=supplier`, { waitUntil: 'load' });

      // Should redirect or show access denied
      await expect(page).not.toHaveURL(/\/admin/);
      await expect(page.getByText(/access denied|unauthorized|permission denied/i)).toBeVisible();
    });

    test('admin can access admin dashboard', async ({ page }) => {
      await page.goto(`${BASE}/admin/dashboard?test_user=true&role=admin`, { waitUntil: 'load' });

      // Should load admin dashboard
      await expect(page).toHaveURL(/\/admin\/dashboard/);
      await expect(page.getByText(/admin dashboard|platform analytics/i)).toBeVisible();
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

      // Check for role badge
      await expect(page.getByText('Citizen')).toBeVisible();

      // Check for standard tabs
      await expect(page.getByText('Profile')).toBeVisible();
      await expect(page.getByText('Orders')).toBeVisible();
      await expect(page.getByText('Wishlist')).toBeVisible();
      await expect(page.getByText('Payment Methods')).toBeVisible();

      // Should not show role-specific tabs
      await expect(page.getByText(/Supplier Dashboard|Admin Dashboard/i)).not.toBeVisible();
    });

    test('supplier sees supplier profile tabs', async ({ page }) => {
      await page.goto(`${BASE}/profile?test_user=true&role=supplier`, { waitUntil: 'load' });

      // Check for role badge
      await expect(page.getByText('Supplier')).toBeVisible();

      // Check for supplier-specific tabs
      await expect(page.getByText('Supplier Dashboard')).toBeVisible();
      await expect(page.getByText('Analytics')).toBeVisible();
      await expect(page.getByText('Supplier Settings')).toBeVisible();

      // Check for supplier dashboard content
      await expect(page.getByText(/business info|product count|quick actions/i)).toBeVisible();
    });

    test('admin sees admin profile tabs', async ({ page }) => {
      await page.goto(`${BASE}/profile?test_user=true&role=admin`, { waitUntil: 'load' });

      // Check for role badge
      await expect(page.getByText('Admin')).toBeVisible();

      // Check for admin-specific tabs
      await expect(page.getByText('Admin Dashboard')).toBeVisible();
      await expect(page.getByText('System Health')).toBeVisible();
      await expect(page.getByText('Revenue')).toBeVisible();

      // Check for admin dashboard content
      await expect(page.getByText(/total users|total products|total orders/i)).toBeVisible();
    });
  });

  test.describe('Role Switching Behavior', () => {
    test('navigation updates when role changes', async ({ page }) => {
      // Start as citizen
      await page.goto(`${BASE}/?test_user=true&role=citizen`, { waitUntil: 'load' });
      await expect(page.locator('nav').getByText(/Home|Explore/i)).toBeVisible();

      // Switch to supplier role (simulate role change)
      await page.goto(`${BASE}/?test_user=true&role=supplier`, { waitUntil: 'load' });
      await expect(page.locator('nav').getByText(/Dashboard|Products/i)).toBeVisible();

      // Switch to admin role
      await page.goto(`${BASE}/?test_user=true&role=admin`, { waitUntil: 'load' });
      await expect(page.locator('nav').getByText(/Users|Revenue/i)).toBeVisible();
    });

    test('profile page updates when role changes', async ({ page }) => {
      // Start as citizen
      await page.goto(`${BASE}/profile?test_user=true&role=citizen`, { waitUntil: 'load' });
      await expect(page.getByText('Citizen')).toBeVisible();

      // Switch to supplier
      await page.goto(`${BASE}/profile?test_user=true&role=supplier`, { waitUntil: 'load' });
      await expect(page.getByText('Supplier')).toBeVisible();
      await expect(page.getByText('Supplier Dashboard')).toBeVisible();

      // Switch to admin
      await page.goto(`${BASE}/profile?test_user=true&role=admin`, { waitUntil: 'load' });
      await expect(page.getByText('Admin')).toBeVisible();
      await expect(page.getByText('Admin Dashboard')).toBeVisible();
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
      await expect(nav.getByText(/Home|Explore/i)).toBeVisible();
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

      // Should have no JavaScript errors
      expect(errors.length).toBe(0);

      // Should show admin content
      await expect(page.getByText(/admin dashboard|total users/i)).toBeVisible();
    });

    test('navigation transitions are smooth', async ({ page }) => {
      await page.goto(`${BASE}/?test_user=true&role=citizen`, { waitUntil: 'load' });

      // Click profile link
      await page.getByRole('link', { name: /profile|account/i }).click();

      // Should navigate smoothly
      await expect(page).toHaveURL(/\/profile/);

      // Should show citizen badge
      await expect(page.getByText('Citizen')).toBeVisible();
    });
  });
});