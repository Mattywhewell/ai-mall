import { test, expect } from '@playwright/test';

test.describe('Visual Layers demo', () => {
  test('demo loads and slider updates the canvas', async ({ page }) => {
    await page.goto('/visual-layers/demo');

<<<<<<< HEAD
    // Try to detect a canvas; if WebGL is unavailable we may render a static preview instead.
    let hasCanvas = true;
    try {
      await page.waitForSelector('canvas', { timeout: 2000 });
    } catch (e) {
      hasCanvas = false;
=======
    // Canvas should be present OR a fallback image should be shown in non-WebGL environments
    let canvas = null;
    try {
      await page.waitForSelector('canvas', { timeout: 5000 });
      canvas = await page.$('canvas');
    } catch (e) {
      canvas = null;
    }

    if (!canvas) {
      // No canvas — accept the fallback image for environments without WebGL
      await page.waitForSelector('img[alt="Runic glow preview"]', { timeout: 5000 });
      const img = await page.$('img[alt="Runic glow preview"]');
      expect(img).not.toBeNull();
      return;
>>>>>>> test/inventory-stability
    }

    if (hasCanvas) {
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
    } else {
      // Fallback: verify the static preview image is present and responsive to the UI being loaded
      await page.waitForSelector('img[alt="Runic glow preview"]', { timeout: 2000 });
      const img = await page.$('img[alt="Runic glow preview"]');
      expect(img).not.toBeNull();

      // Ensure the slider input exists and is interactive even when using the fallback
      const range = await page.$('input[type="range"]');
      expect(range).not.toBeNull();
      await range!.fill('0.95');
      // small delay to allow any potential UI feedback
      await page.waitForTimeout(200);
    }
  });
});