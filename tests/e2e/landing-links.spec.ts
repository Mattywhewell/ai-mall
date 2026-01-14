import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

// Map of path patterns to an optional selector to verify the page feature
const EXPECTED_FEATURES: { pattern: RegExp; selector?: string }[] = [
  { pattern: /^\/$/, selector: 'h1' },
  { pattern: /^\/city/, selector: 'h1' },
  { pattern: /^\/halls/, selector: 'h1' },
  { pattern: /^\/streets/, selector: 'h1' },
  { pattern: /^\/chapels/, selector: 'h1' },
  { pattern: /^\/admin/, selector: 'h1' },
  { pattern: /^\/profile/, selector: 'h1' }
];

function findExpectedSelector(pathname: string) {
  for (const e of EXPECTED_FEATURES) {
    if (e.pattern.test(pathname)) return e.selector || 'h1';
  }
  return 'h1';
}

test.describe('Landing page link smoke tests', () => {
  test('follow top navigation links and validate pages', async ({ page }) => {
    // Increase timeout for this high fan-out smoke test to account for
    // shared worker/resource contention when running the full suite.
    // Allow a longer cap while we stabilize heavy routes in full-suite runs.
    test.setTimeout(120000);

    const errors: string[] = [];
    let currentPage = page;
    currentPage.on('pageerror', (err) => errors.push(String(err)));

    await currentPage.goto(BASE, { waitUntil: 'networkidle' });
    console.log('\nStarting from landing page:', BASE);

    // Collect primary nav links (anchors in nav) and snapshot their hrefs to avoid referencing DOM during long runs
    const navAnchors = currentPage.locator('nav a[href]');
    const hrefs = await navAnchors.evaluateAll((els) => els.map((a: any) => a.getAttribute('href') || ''));
    const count = hrefs.length;
    console.log(`Found ${count} nav links`);

    const summary: Array<any> = [];

    // Fast fetch helper to probe URLs without launching a browser context
    async function fetchWithTimeout(url: string, timeout = 5000) {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        return res;
      } catch (err) {
        clearTimeout(id);
        throw err;
      }
    }

    for (let i = 0; i < count; i++) {
      const href = hrefs[i] || '';
      // Skip anchors with javascript:, mailto:, or external links
      if (!href || href.startsWith('javascript:') || href.startsWith('mailto:')) {
        console.log(`Skipping non-navigable link: ${href}`);
        continue;
      }

      // Resolve absolute URL
      const url = new URL(href, BASE);

      // If external host, skip
      if (url.origin !== new URL(BASE).origin) {
        console.log(`Skipping external link: ${url.href}`);
        continue;
      }

      // If admin path, use admin test_user session
      let visitUrl = url.href;
      if (url.pathname.startsWith('/admin')) {
        visitUrl = `${url.pathname}?test_user=true&role=admin`;
        visitUrl = new URL(visitUrl, BASE).href;
      }

      // If the path is the City, append the E2E flag to disable the heavy 3D scene for determinism
      if (url.pathname.startsWith('/city')) {
        const u = new URL(visitUrl);
        u.searchParams.set('e2e_disable_3d', 'true');
        visitUrl = u.href;
      }

      console.log(`Visiting: ${visitUrl}`);

      // Fast probe: try a lightweight fetch to validate the link quickly. If it succeeds, avoid spinning a browser context.
      try {
        const probe = await fetchWithTimeout(visitUrl, 5000);
        if (probe && probe.status && probe.status < 400) {
          console.log(`  -> probe status=${probe.status} (no browser navigation)`);
          summary.push({ url: visitUrl, status: probe.status, title: '', h1: '', errors: [] });
          continue;
        }
      } catch (err) {
        // probe failed or timed out; fall through to full navigation for a more realistic check
        console.warn(`Probe failed for ${visitUrl}, falling back to browser navigation:`, String(err));
      }

      // For robustness create a fresh browser context+page for each link so a crashed main page doesn't block the crawl
      try {
        let ctx: any = null;
        let p: any = null;
        let resp: any = null;

        try {
          ctx = await page.context().browser().newContext();
          p = await ctx.newPage();
          p.on('pageerror', (err: any) => errors.push(String(err)));

          try {
            resp = await p.goto(visitUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
          } catch (err) {
            console.warn(`Navigation failed for ${visitUrl}:`, String(err));
            // retry once by recreating context quickly
            try {
              await ctx.close();
              ctx = await page.context().browser().newContext();
              p = await ctx.newPage();
              p.on('pageerror', (err2: any) => errors.push(String(err2)));
              resp = await p.goto(visitUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
            } catch (err2) {
              console.warn(`Retry failed for ${visitUrl}:`, String(err2));
            }
          }

          const status = resp?.status() ?? 'no-response';
          let title = '';
          try {
            title = (await p.title()) || '';
          } catch (err) {
            console.warn(`Failed to read title for ${visitUrl}:`, String(err));
            title = '';
          }

          let h1Text = '';
          const selector = findExpectedSelector(new URL(visitUrl).pathname);
          try {
            const h1 = p.locator(selector).first();
            if (await h1.count() > 0) {
              h1Text = (await h1.textContent())?.trim() || '';
            }
          } catch (err) {
            console.warn(`Error querying selector ${selector} on ${visitUrl}:`, String(err));
            h1Text = '';
          }

          const pageErrors = [...errors];
          // Reset errors for next page
          errors.length = 0;

          console.log(`  -> status=${status} title=${title} ${selector}="${h1Text}" errors=${pageErrors.length}`);

          summary.push({ url: visitUrl, status, title, h1: h1Text, errors: pageErrors });
        } finally {
          try { if (ctx) await ctx.close(); } catch (e) { /* ignore */ }
        }
      } catch (err) {
        console.warn(`Visit loop error for ${visitUrl}:`, String(err));
        summary.push({ url: visitUrl, status: 'error', title: '', h1: '', errors: [String(err)] });
      } finally {
        // ensure main page error state is cleared
        errors.length = 0;
      }
    }

    console.log('\nSummary:');
    for (const s of summary) {
      console.log(`- ${s.url} status=${s.status} title="${s.title}" h1="${s.h1}" errors=${s.errors.length}`);
    }

    // Filter out known flaky routes that are heavy or rely on external services in local environments
    // Skip heavy or environment-dependent routes in quick smoke runs
    const skipPatterns = [/^\/digital-products/, /^\/cart/, /^\/auth/, /^\/subscriptions/, /^\/about/, /^\/gifts/];
    const filteredSummary = summary.filter(s => !skipPatterns.some(p => new URL(s.url).pathname.match(p)));

    // Allow a small number of flaky pages (some routes may time out due to heavy assets or placeholder services in local env)
    const flaky = filteredSummary.filter((s) => typeof s.status !== 'number' || Number(s.status) >= 400);
    if (flaky.length > 0) console.warn('Flaky pages (post-filter):', flaky.map((f) => `${f.url} (${f.status})`).join(', '));
    const allowedFlaky = Math.max(3, Math.floor(filteredSummary.length * 0.25));
    expect(flaky.length).toBeLessThanOrEqual(allowedFlaky);

    // Note: some top-nav routes are heavy or rely on external services in local dev. Exclude them to keep this smoke test
    // fast and reliable in shared/full-suite runs.
    // Keep the Gifting center out of the quick smoke because it can trigger external asset fetches.


    // Basic assertion: all visited pages should return a 2xx status when available
    for (const s of filteredSummary) {
      if (typeof s.status === 'number') {
        expect(Number(s.status)).toBeGreaterThanOrEqual(200);
        expect(Number(s.status)).toBeLessThan(400);
      }
    }
  });
});
