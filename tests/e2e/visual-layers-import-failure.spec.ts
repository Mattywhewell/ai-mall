import { test, expect } from '@playwright/test';

test.describe('Visual Layers import failure', () => {
  test('falls back and sends telemetry when renderer import fails', async ({ page }) => {
    // Force WebGL present by stubbing getContext so hasWebGL becomes true
    await page.addInitScript(() => {
      const proto = HTMLCanvasElement.prototype as any;
      proto.getContext = function() { return {}; };
    });

    // Intercept telemetry POSTs
    let telemetryCalled = false;
    await page.route('**/api/telemetry/hero-event', (route, request) => {
      telemetryCalled = true;
      route.fulfill({ status: 200, body: 'OK' });
    });

    // Navigate with the test hook to force import failure
    await page.goto('/visual-layers/demo?forceImportFail=true', { waitUntil: 'load' });

    // Expect fallback image to appear
    await page.waitForSelector('img[alt="Runic glow preview"]', { timeout: 5000 });
    const img = await page.$('img[alt="Runic glow preview"]');
    expect(img).not.toBeNull();

    // Ensure telemetry endpoint was called
    expect(telemetryCalled).toBe(true);
  });
});