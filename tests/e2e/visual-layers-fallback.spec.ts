import { test, expect } from '@playwright/test';

test('shows static preview when WebGL is unavailable', async ({ page }) => {
  // Force no WebGL: remove constructor and make getContext return null
  await page.addInitScript(() => {
    // Force no WebGL via multiple mechanisms to be resilient across environments
    // @ts-ignore
    window.WebGLRenderingContext = undefined;
    // test hook for the renderer
    // @ts-ignore
    window.__FORCE_NO_WEBGL = true;

    const proto = HTMLCanvasElement.prototype as any;
    const origGet = proto.getContext;
    proto.getContext = function() { return null; };
    // store to restore if needed
    (window as any).__origGetContext = origGet;
  });

  await page.goto('/visual-layers/demo');

  // Expect the fallback image to appear
  await page.waitForSelector('img[alt="Runic glow preview"]', { timeout: 5000 });
  const img = await page.$('img[alt="Runic glow preview"]');
  expect(img).not.toBeNull();

  // Confirm that no visible canvas is present
  const canvas = await page.$('canvas');
  // If canvas exists it should have no webgl context; ensuring either absence or hidden
  if (canvas) {
    const data = await canvas.evaluate((c: HTMLCanvasElement) => ({ w: c.width, h: c.height }));
    expect(data.w === 0 || data.h === 0).toBeTruthy();
  }
});