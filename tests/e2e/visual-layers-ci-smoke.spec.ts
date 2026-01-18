import { test, expect } from '@playwright/test';

test('CI smoke: visual layers uses static preview when 3D is disabled', async ({ page }) => {
  // CI sets NEXT_PUBLIC_DISABLE_3D=true at build time; locally use ?forceNoWebGL=true to exercise the same code path
  const ciFlag = process.env.NEXT_PUBLIC_DISABLE_3D === 'true';
  const url = ciFlag ? '/visual-layers/demo' : '/visual-layers/demo?forceNoWebGL=true';

  await page.goto(url, { waitUntil: 'load' });

  // Expect fallback static preview image to be present
  await page.waitForSelector('img[alt="Runic glow preview"]', { timeout: 5000 });
  const img = await page.$('img[alt="Runic glow preview"]');
  expect(img).not.toBeNull();

  // Ensure there is no visible WebGL canvas (if present it should be hidden or zero-sized)
  const canvas = await page.$('canvas');
  if (canvas) {
    const visible = await canvas.isVisible().catch(() => false);
    expect(visible).toBe(false);
  }
});
