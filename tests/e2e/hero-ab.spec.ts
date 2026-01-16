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

    // Visit variant A (test-only page that renders the Hero component)
    await page.goto('/test/hero?ab=a');

    // Dismiss potential onboarding overlays that can block hero rendering
    await page.locator('button:has-text("Dismiss")').first().click({ timeout: 2000 }).catch(() => null);
    await page.locator('button:has-text("Got it")').first().click({ timeout: 2000 }).catch(() => null);

    // Wait for hero to initialize (tolerant to markup variants)
    await Promise.race([
      page.waitForSelector('section.hero-compact', { timeout: 8000 }).catch(() => null),
      page.waitForSelector('a[aria-label="Enter the City"]', { timeout: 8000 }).catch(() => null),
      page.waitForSelector('h1', { timeout: 8000 }).catch(() => null),
    ]);

    // Wait for analytics hits to be recorded
    // If none appear, capture debug info to help diagnose
    try {
      await page.waitForFunction(() => (window as any).__gtag_calls && (window as any).__gtag_calls.length > 0, { timeout: 2000 });
    } catch (e) {
      const debug = await page.evaluate(() => ({
        heroExists: !!document.querySelector('section.hero-compact'),
        classes: (document.querySelector('section.hero-compact') && (document.querySelector('section.hero-compact') as Element).className) || null,
        ls: localStorage.getItem('hero_variant'),
        hasGtag: !!(window as any).gtag,
        hasDataLayer: !!(window as any).dataLayer,
        __gtag_calls_len: (window as any).__gtag_calls ? (window as any).__gtag_calls.length : 0,
      }));
      console.log('DEBUG', debug);
    }

    // Check that hero_variant_view was sent
    const callsA = await page.evaluate(() => (window as any).__gtag_calls || []);
    const hasVariantA = callsA.some((c: any[]) => c[0] === 'event' && c[1] === 'hero_variant_view');
    expect(hasVariantA).toBeTruthy();

    // Click primary CTA
    await page.click('a[aria-label="Enter the City"]');

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