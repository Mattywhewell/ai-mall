import { test, expect } from '@playwright/test';

test.describe('Hero A/B analytics', () => {
  test('fires variant view and CTA click events (GA mock)', async ({ page }) => {
    // Capture dataLayer pushes (gtag wraps dataLayer.push in our GA script)
    await page.addInitScript(() => {
      (window as any).__gtag_calls = (window as any).__gtag_calls || [];
      (window as any).dataLayer = (window as any).dataLayer || [];
      const origPush = (window as any).dataLayer.push ? (window as any).dataLayer.push.bind((window as any).dataLayer) : function() {};
      (window as any).dataLayer.push = function() {
        try {
          // If GA pushed an arguments-like object (gtag uses dataLayer.push(arguments)),
          // normalize to an array containing the inner args for easier assertions.
          if (arguments.length === 1 && arguments[0] && typeof arguments[0] === 'object' && arguments[0].length !== undefined) {
            (window as any).__gtag_calls.push(Array.from(arguments[0]));
          } else {
            (window as any).__gtag_calls.push(Array.from(arguments));
          }
        } catch (e) {
          (window as any).__gtag_calls.push(Array.from(arguments));
        }
        return origPush.apply(this, arguments);
      };
      // Provide a gtag shim so trackEvent will call into dataLayer in test envs where GA script is not injected
      (window as any).gtag = function() {
        (window as any).dataLayer.push(arguments);
      };
    });

    // Visit variant A
    await page.goto('/');
    // Wait for hero to initialize (be lenient about selector)
    await page.waitForSelector('section:has(h1), h1', { timeout: 7000 });
    // Visit variant A
    await page.goto('/');
    // Wait for hero to initialize (be lenient about selector)
    await page.waitForSelector('section:has(h1), h1', { timeout: 7000 });
>>>>>>> test/inventory-stability

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

    // Wait for CTA event to be recorded
    await page.waitForFunction(() => (window as any).__gtag_calls && (window as any).__gtag_calls.some((c: any[]) => c[0] === 'event' && c[1] === 'hero_cta_click'), { timeout: 2000 });

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

    await page.goto('/test/hero?ab=b');
    // Dismiss onboarding overlays if present
    await page.locator('button:has-text("Dismiss")').first().click({ timeout: 2000 }).catch(() => null);
    await page.locator('button:has-text("Got it")').first().click({ timeout: 2000 }).catch(() => null);
    await page.waitForSelector('section.hero-compact');

    // Click the CTA (should cause fallback POST)
    await page.click('a[aria-label="Enter the City"]');

    expect(requests.length).toBeGreaterThanOrEqual(1);
    const bodies = requests.map(r => JSON.parse(r.postData || '{}'));
    const cta = bodies.find((b: any) => b.eventName === 'hero_cta_click');
    expect(cta).toBeTruthy();
    expect(cta.params.variant).toBe('b');
  });
});