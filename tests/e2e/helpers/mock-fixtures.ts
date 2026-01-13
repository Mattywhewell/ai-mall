import { Page } from '@playwright/test';

export async function setupMocks(page: Page, opts: { hero?: boolean; homepage?: boolean; session?: boolean; ab?: boolean } = {}) {
  // Default mocks for homepage hero and AB flags
  if (opts.hero || opts.homepage || opts.ab) {
    // Mock AB flags endpoint if used
    await page.route('**/api/ab/flags*', route => route.fulfill({ status: 200, body: '{}' }));
  }

  if (opts.hero) {
    await page.route('**/api/hero*', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ hero: { headline: 'Enter the City Where Memory Takes Shape', variant: 'a' } }),
      })
    );

    // Mock telemetry endpoint (used in hero fallback test)
    await page.route('**/api/telemetry/hero-event', (route) => route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) }));
  }

  if (opts.homepage) {
    await page.route('**/api/homepage*', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ headline: 'Enter the City Where Memory Takes Shape', districts: new Array(6).fill({ title: 'District' }) }),
      })
    );
  }

  if (opts.session) {
    // Return not authenticated by default
    await page.route('**/api/session', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: null }) })
    );
  }
}
