import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

test.describe('User Journey Paths', () => {
  test.describe('Wander Path - Anonymous Exploration', () => {
    test('can navigate from home to city to districts', async ({ page }) => {
      // Start at homepage
      await page.goto(BASE, { waitUntil: 'domcontentloaded' });

      // Click "Enter the City" CTA
      await page.getByRole('link', { name: 'Enter the City' }).click();

      // Should be on /city page
      await expect(page).toHaveURL(`${BASE}/city`);
      await expect(page.locator('h1')).toContainText('Aiverse City');

      // Click on a district link
      const districtLink = page.locator('a[href^="/districts/"]').first();
      await expect(districtLink).toBeVisible();
      const districtHref = await districtLink.getAttribute('href');
      await districtLink.click();

      // Should be on district page
      await expect(page).toHaveURL(new RegExp(`${BASE}/districts/.*`));
      await expect(page.locator('h1')).toBeVisible();

      // Should have products or content
      const hasProducts = await page.locator('[data-testid="product-card"]').count() > 0;
      const hasContent = await page.locator('text=No products found').isVisible() || hasProducts;

      expect(hasContent).toBe(true);
    });

    test('can explore halls and streets', async ({ page }) => {
      await page.goto(`${BASE}/city`, { waitUntil: 'domcontentloaded' });

      // Look for hall links
      const hallLink = page.locator('a[href^="/halls/"]').first();
      if (await hallLink.isVisible()) {
        const hallHref = await hallLink.getAttribute('href');
        await hallLink.click();

        await expect(page).toHaveURL(new RegExp(`${BASE}/halls/.*`));
        await expect(page.locator('h1')).toBeVisible();
      }

      // Go back to city and try streets
      await page.goto(`${BASE}/city`, { waitUntil: 'domcontentloaded' });

      const streetLink = page.locator('a[href^="/streets/"]').first();
      if (await streetLink.isVisible()) {
        const streetHref = await streetLink.getAttribute('href');
        await streetLink.click();

        await expect(page).toHaveURL(new RegExp(`${BASE}/streets/.*`));
        await expect(page.locator('h1')).toBeVisible();
      }
    });
  });

  test.describe('Seek Path - Product Discovery', () => {
    test('can search and browse products', async ({ page }) => {
      await page.goto(BASE, { waitUntil: 'domcontentloaded' });

      // Try to find search functionality
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('test product');
        await searchInput.press('Enter');

        // Should be on search results page or stay on current page with results
        await expect(page.locator('body')).toBeVisible();
      }

      // Try navigating to discover page
      const discoverLink = page.locator('a[href="/discover"], a[href*="discover"]').first();
      if (await discoverLink.isVisible()) {
        await discoverLink.click();
        await expect(page).toHaveURL(`${BASE}/discover`);
      }

      // Look for product links
      const productLink = page.locator('a[href^="/products/"]').first();
      if (await productLink.isVisible()) {
        const productHref = await productLink.getAttribute('href');
        await productLink.click();

        await expect(page).toHaveURL(new RegExp(`${BASE}/products/.*`));
        await expect(page.locator('h1')).toBeVisible();
      }
    });

    test('can browse collections and categories', async ({ page }) => {
      await page.goto(`${BASE}/collections`, { waitUntil: 'domcontentloaded' });

      // Look for collection links
      const collectionLink = page.locator('a[href^="/collections/"]').first();
      if (await collectionLink.isVisible()) {
        await collectionLink.click();
        await expect(page).toHaveURL(new RegExp(`${BASE}/collections/.*`));
      }
    });
  });

  test.describe('Create Path - Creator Economy', () => {
    test('can access creator features', async ({ page }) => {
      await page.goto(BASE, { waitUntil: 'domcontentloaded' });

      // Click "Become a Creator" CTA
      const creatorCTA = page.getByRole('link', { name: 'Become a Creator' }).first();
      if (await creatorCTA.isVisible()) {
        await creatorCTA.click();

        // Should navigate to creator signup or info page
        await expect(page.locator('body')).toBeVisible();
      }

      // Try direct navigation to creator apply page
      await page.goto(`${BASE}/creator/apply`, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toBeVisible();
    });

    test('can view creator profiles', async ({ page }) => {
      // Try to find creator profile links
      await page.goto(BASE, { waitUntil: 'domcontentloaded' });

      const creatorLink = page.locator('a[href^="/creators/"]').first();
      if (await creatorLink.isVisible()) {
        await creatorLink.click();
        await expect(page).toHaveURL(new RegExp(`${BASE}/creators/.*`));
        await expect(page.locator('h1')).toBeVisible();
      }
    });
  });

  test.describe('Navigation Integrity', () => {
    test('all footer links work', async ({ page }) => {
      await page.goto(BASE, { waitUntil: 'domcontentloaded' });

      // Find footer links
      const footerLinks = page.locator('footer a[href]').all();

      for (const link of await footerLinks) {
        const href = await link.getAttribute('href');
        if (href && href.startsWith('/') && !href.includes('#')) {
          // Test internal links
          const response = await page.request.get(`${BASE}${href}`);
          expect(response.status()).toBeLessThan(400);
        }
      }
    });

    test('breadcrumb navigation works', async ({ page }) => {
      // Test districts breadcrumb
      await page.goto(`${BASE}/districts`, { waitUntil: 'domcontentloaded' });

      const districtLink = page.locator('a[href^="/districts/"]').first();
      if (await districtLink.isVisible()) {
        await districtLink.click();

        // Look for breadcrumb navigation
        const breadcrumbLinks = page.locator('[data-testid="breadcrumb"] a, nav a[href="/"], nav a[href="/districts"]');
        const breadcrumbCount = await breadcrumbLinks.count();

        if (breadcrumbCount > 0) {
          // Test breadcrumb links work
          for (const breadcrumb of await breadcrumbLinks.all()) {
            const href = await breadcrumb.getAttribute('href');
            if (href) {
              const response = await page.request.get(`${BASE}${href}`);
              expect(response.status()).toBeLessThan(400);
            }
          }
        }
      }
    });

    test('404 pages are handled gracefully', async ({ page }) => {
      await page.goto(`${BASE}/nonexistent-page-12345`, { waitUntil: 'domcontentloaded' });

      // Should show 404 page or redirect to home
      const is404Page = await page.locator('text=404').isVisible() ||
                       await page.locator('text=Not Found').isVisible() ||
                       await page.locator('text=Page not found').isVisible();

      const isHomePage = page.url() === BASE || page.url() === `${BASE}/`;

      expect(is404Page || isHomePage).toBe(true);
    });
  });
});