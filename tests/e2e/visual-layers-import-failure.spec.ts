import { test, expect } from '@playwright/test';

test.describe('Visual Layers import failure', () => {
  test('falls back and sends telemetry when renderer import fails', async ({ page }) => {
    // Force WebGL present by stubbing getContext so hasWebGL becomes true
    await page.addInitScript(() => {
      const proto = HTMLCanvasElement.prototype as any;
      proto.getContext = function() { return {}; };
      // Ensure the renderer import fails deterministically by setting the global test hook before any script runs
      (window as any).__FORCE_IMPORT_FAIL = true;
    });

    // Intercept telemetry POSTs
    let telemetryCalled = false;
    await page.route('**/api/telemetry/hero-event', (route, request) => {
      telemetryCalled = true;
      route.fulfill({ status: 200, body: 'OK' });
    });

    // Navigate with the test hook set via init script (no URL param needed)
    await page.goto('/visual-layers/demo', { waitUntil: 'load' });

    // Expect fallback image to appear (allow extra time for dynamic import failure handling)
    await page.waitForSelector('img[alt="Runic glow preview"]', { timeout: 10000 });
    const img = await page.$('img[alt="Runic glow preview"]');
    expect(img).not.toBeNull();

    // Ensure telemetry endpoint was called
    expect(telemetryCalled).toBe(true);
  });
});