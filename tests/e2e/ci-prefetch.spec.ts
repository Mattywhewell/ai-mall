import { test } from '@playwright/test';

test.describe('CI prefetch simulation', () => {
  test('ci-prefetch: simulate prefetch and log id', async ({ page }) => {
    const id = 'ci-prefetch-' + Date.now();

    // Ensure console messages are captured in trace
    page.on('console', (msg) => {
      // noop - console messages will be present in trace
    });

    // Visit homepage to initialize app
    await page.goto('/');

    // Simulate a prefetch via query param and a fetch with custom header
    await page.evaluate(async (id) => {
      try {
        fetch('/?ci_prefetch_id=' + encodeURIComponent(id)).catch(() => {});
      } catch (e) {}
      try {
        fetch('/visual-layers/demo', { headers: { 'x-ci-prefetch-id': id } }).catch(() => {});
      } catch (e) {}

      // POST the id to a server endpoint so the request body is captured in traces reliably
      try {
        const res = await fetch('/api/ci-prefetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ci_prefetch_id: id }),
        });
        try {
          const json = await res.json();
          console.log('[CI-RTR] ci-prefetch-server-response ' + JSON.stringify(json));
        } catch (e) {}
      } catch (e) {}

      // Add an explicit console marker too
      console.log('[CI-RTR] ci-prefetch-simulated ' + id);
    }, id);

    // Give network/console a moment to be captured in the trace
    await page.waitForTimeout(2000);
  });
});