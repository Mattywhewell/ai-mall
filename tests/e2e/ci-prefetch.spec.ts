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
    // Use a synchronous evaluate that triggers fetches but does not await them to avoid hangs
    await page.evaluate((id) => {
      try {
        // fire-and-forget prefetch
        void fetch('/?ci_prefetch_id=' + encodeURIComponent(id)).catch(() => {});
      } catch (e) {}
      try {
        void fetch('/visual-layers/demo', { headers: { 'x-ci-prefetch-id': id } }).catch(() => {});
      } catch (e) {}

      // POST the id to a server endpoint but don't await to avoid blocking the evaluate
      try {
        fetch('/api/ci-prefetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ci_prefetch_id: id }),
        }).then(res => res.json().then(json => console.log('[CI-RTR] ci-prefetch-server-response ' + JSON.stringify(json))).catch(()=>{})).catch(()=>{});
      } catch (e) {}

      // Add an explicit console marker too
      console.log('[CI-RTR] ci-prefetch-simulated ' + id);
    }, id);

    // Give network/console a moment to be captured in the trace
    await page.waitForTimeout(2000);
  });
});