import { test, expect } from '@playwright/test';

test.describe('Hero A/B analytics', () => {
  test('fires variant view and CTA click events (GA mock)', async ({ page }) => {
    // Inject a mock gtag function that records calls
    await page.addInitScript(() => {
      (window as any).gtag = function() {
        (window as any).__gtag_calls = (window as any).__gtag_calls || [];
        (window as any).__gtag_calls.push(Array.from(arguments));
      };
    });

    // Visit variant A
    await page.goto('/');
    // Wait for hero to initialize (be lenient about selector)
    await page.waitForSelector('section:has(h1), h1', { timeout: 7000 });

    // Check that hero_variant_view was sent
    const callsA = await page.evaluate(() => (window as any).__gtag_calls || []);
    const hasVariantA = callsA.some((c: any[]) => c[0] === 'event' && c[1] === 'hero_variant_view');
    expect(hasVariantA).toBeTruthy();

    // Click primary CTA via label or fallback /city link
    const cta = page.getByRole('link', { name: /Enter the City|Explore the City|Enter Alverse|Begin Your Journey/i }).first();
    if (await cta.isVisible().catch(() => false)) {
      await cta.click();
    } else {
      await page.click('a[href^="/city"]');
    }

    // Confirm CTA event recorded
    const callsAfter = await page.evaluate(() => (window as any).__gtag_calls || []);
    const hasCta = callsAfter.some((c: any[]) => c[0] === 'event' && c[1] === 'hero_cta_click');
    expect(hasCta).toBeTruthy();
  });

  test('fallback telemetry POSTs when gtag absent', async ({ page }) => {
    // Ensure no gtag
    await page.addInitScript(() => { delete (window as any).gtag; });

    const requests: any[] = [];
    await page.route('**/api/telemetry/hero-event', (route, request) => {
      requests.push({ url: request.url(), postData: request.postData() });
      route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
    });

    await page.goto('/?ab=b');
    await page.waitForSelector('section.hero-compact');

    // Click the CTA (should cause fallback POST)
    await page.click('a[aria-label="Enter the City"]');

    expect(requests.length).toBeGreaterThanOrEqual(1);
    const body = JSON.parse(requests[0].postData || '{}');
    expect(body.eventName).toBe('hero_cta_click');
    expect(body.params.variant).toBe('b');
  });
});