import { test, expect } from '@playwright/test';

test.describe('Visual Layers demo', () => {
  test('demo loads and slider updates the canvas', async ({ page }) => {
    await page.goto('/visual-layers/demo');

    // Either a canvas (WebGL) or a static fallback image should be present
    // Wait briefly for a canvas; if absent, assert fallback image exists and skip canvas assertions
    let canvasPresent = true;
    try {
      await page.waitForSelector('canvas', { timeout: 3000 });
    } catch (e) {
      canvasPresent = false;
    }

    if (!canvasPresent) {
      // Fallback case: verify the static preview image is shown and skip canvas-specific assertions
      await page.waitForSelector('img[alt="Runic glow preview"]', { timeout: 5000 });
      const img = await page.$('img[alt="Runic glow preview"]');
      expect(img).not.toBeNull();
      // Take a screenshot for debugging / CI artifacts in case of intermittent failures
      await page.screenshot({ path: `test-results/visual-layers-fallback-${Date.now()}.png`, fullPage: false });
      return; // nothing more to assert for canvas behavior
    }

    // Capture initial canvas dataURL
    const before = await page.evaluate(() => {
      const c = document.querySelector('canvas') as HTMLCanvasElement | null;
      return c ? c.toDataURL() : null;
    });

    expect(before).not.toBeNull();

    // Change the range input and dispatch input event
    await page.evaluate(() => {
      const r = document.querySelector('input[type="range"]') as HTMLInputElement | null;
      if (!r) return;
      r.value = '0.95';
      r.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Allow shader to update
    await page.waitForTimeout(500);

    const after = await page.evaluate(() => {
      const c = document.querySelector('canvas') as HTMLCanvasElement | null;
      return c ? c.toDataURL() : null;
    });

    expect(after).not.toBeNull();
    // Expect a visual change in the canvas after changing the slider
    expect(before).not.toEqual(after);
  });
});