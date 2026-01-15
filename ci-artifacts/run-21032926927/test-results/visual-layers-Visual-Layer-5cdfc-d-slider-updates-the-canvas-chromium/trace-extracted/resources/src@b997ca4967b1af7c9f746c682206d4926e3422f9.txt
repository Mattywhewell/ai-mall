import { test, expect } from '@playwright/test';

test.describe('Visual Layers demo', () => {
  test('demo loads and slider updates the canvas', async ({ page }) => {
    await page.goto('/visual-layers/demo');

    // Canvas should be present
    await page.waitForSelector('canvas', { timeout: 10000 });

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