import { Page } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

// Helper to dismiss onboarding modal/popups that sometimes appear during dev/test
export async function dismissOnboarding(page: Page) {
  const selectors = [
    'button:has-text("Skip tutorial")',
    'button[aria-label="Close"]',
    'button:has-text("Dismiss")',
    'button:has-text("Got it")'
  ];
  for (const sel of selectors) {
    try {
      await page.locator(sel).first().click({ timeout: 2000 });
    } catch (e) {
      // ignore - non-fatal
    }
  }
}

// Helper to ensure test_user is set in localStorage before any page script runs
export async function ensureTestUser(page: Page, role: string) {
  // addInitScript runs before page scripts. Pass role as an argument to avoid closure capture issues.
  await page.addInitScript((r) => { localStorage.setItem('test_user', JSON.stringify({ role: r })); }, role);

  // Try to set a cookie so that SSR (or middleware aware routes) can read the test user and render deterministically.
  const urlObj = new URL(BASE);
  // Playwright's addCookies prefers either `url` OR `domain`+`path` — not both. Use a url-only
  // cookie for origin-based set (works well for the common case) and a domain/path cookie as a
  // fallback for drivers that prefer domain-based cookies. Also attempt an alternate host (localhost
  // vs 127.0.0.1) when possible, since CI environments can vary in hostname resolution.
  const cookieWithUrl = { name: 'test_user', value: JSON.stringify({ role }), url: urlObj.origin } as any;
  const cookieWithDomain = { name: 'test_user', value: JSON.stringify({ role }), domain: urlObj.hostname, path: '/' } as any;
  const alternateHost = urlObj.hostname === 'localhost' ? '127.0.0.1' : urlObj.hostname === '127.0.0.1' ? 'localhost' : null;
  const cookieWithDomainAlt = alternateHost ? { name: 'test_user', value: JSON.stringify({ role }), domain: alternateHost, path: '/' } as any : null;

  // Attempt 1: set cookie using url (preferred). Verify it was set.
  let cookieSet = false;
  try {
    await page.context().addCookies([cookieWithUrl]);
    let cookies = await page.context().cookies();
    let found = cookies.find(c => c.name === 'test_user');
    if (found) {
      console.info('ensureTestUser: addCookies(url) succeeded');
      cookieSet = true;
    } else {
      console.warn('ensureTestUser: addCookies(url) did not set cookie; will try domain-based addCookies');
    }
  } catch (e) {
    console.warn('ensureTestUser: addCookies(url) failed with error, will try domain fallback', e && e.message ? e.message : e);
  }

  // Attempt 2: set cookie using domain/path (some drivers prefer this). Verify it was set.
  if (!cookieSet) {
    try {
      await page.context().addCookies([cookieWithDomain]);
      let cookies = await page.context().cookies();
      let found = cookies.find(c => c.name === 'test_user');
      if (found) {
        console.info('ensureTestUser: addCookies(domain) succeeded');
        cookieSet = true;
      } else {
        console.warn('ensureTestUser: addCookies(domain) did not set cookie; will try alternate domain fallback or document.cookie');
      }
    } catch (e) {
      console.warn('ensureTestUser: addCookies(domain) failed with error, will try alternate domain or document.cookie', e && e.message ? e.message : e);
    }
  }

  // Attempt 2b: try alternate host domain (localhost <-> 127.0.0.1) if applicable
  if (!cookieSet && cookieWithDomainAlt) {
    try {
      await page.context().addCookies([cookieWithDomainAlt]);
      let cookies = await page.context().cookies();
      let found = cookies.find(c => c.name === 'test_user');
      if (found) {
        console.info('ensureTestUser: addCookies(alternate domain) succeeded:', cookieWithDomainAlt.domain);
        cookieSet = true;
      } else {
        console.warn('ensureTestUser: addCookies(alternate domain) did not set cookie; will fall back to document.cookie');
      }
    } catch (e) {
      console.warn('ensureTestUser: addCookies(alternate domain) failed with error, falling back to document.cookie', e && e.message ? e.message : e);
    }
  }

  // Final fallback: navigate to the base origin and set document.cookie directly, then verify.
  if (!cookieSet) {
    try {
      console.info('ensureTestUser: performing document.cookie warmup fallback');
      await page.goto(`${BASE}/?__test_cookie_warmup=1`, { waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => null);

      await page.evaluate((r) => {
        document.cookie = `test_user=${encodeURIComponent(JSON.stringify({ role: r }))}; path=/;`;
      }, role);

      // Give the browser a moment to apply the cookie to the context
      await page.waitForTimeout(300);

      const finalCookies = await page.context().cookies();
      const finalFound = finalCookies.find(c => c.name === 'test_user');
      if (finalFound) {
        console.info('ensureTestUser: document.cookie warmup succeeded');
        cookieSet = true;
      } else {
        console.warn('ensureTestUser: document.cookie warmup did not result in a context cookie; will try server-side Set-Cookie fallback if available');
      }
    } catch (e) {
      console.warn('ensureTestUser: fallback cookie via document.cookie failed', e && e.message ? e.message : e);
    }
  }

  // Server-side Set-Cookie fallback: in CI/debug we expose a gated endpoint `/api/test/set-test-user`
  // that issues a Set-Cookie on the server response. This is the most reliable way to ensure
  // SSR sees the cookie on the immediate next request. Only use when running in CI/debug.
  let serverFallbackTried = false;
  if (!cookieSet && (process.env.CI || process.env.NEXT_PUBLIC_E2E_DEBUG === 'true')) {
    try {
      serverFallbackTried = true;
      const setUrl = `${BASE}/api/test/set-test-user?role=${encodeURIComponent(role)}`;
      console.info('ensureTestUser: attempting server-set-cookie fallback via', setUrl);
      // Use a navigation so the server response sets the cookie on the browser context
      await page.goto(setUrl, { waitUntil: 'networkidle', timeout: 7000 }).catch(() => null);

      // Give the browser a moment to apply the cookie to the context
      await page.waitForTimeout(300);
      const postServerCookies = await page.context().cookies();
      const serverFound = postServerCookies.find(c => c.name === 'test_user');
      if (serverFound) {
        console.info('ensureTestUser: server-set cookie succeeded');
        cookieSet = true;
      } else {
        console.warn('ensureTestUser: server-set cookie did not appear in context cookies');
      }
    } catch (e) {
      console.warn('ensureTestUser: server-set cookie fallback failed', e && e.message ? e.message : e);
    }
  }

  // Defensive SSR check (gated to CI or debug mode): navigate to root and verify the server-rendered
  // `data-testid="test-user-server"` marker exists and matches the expected role. This ensures
  // the SSR baseline actually sees the cookie before tests proceed.
  if (cookieSet) {
    // Print cookie details for diagnostics in CI/debug runs so we can verify domain/path/secure flags.
    try {
      const allCookies = await page.context().cookies();
      if (process.env.CI || process.env.NEXT_PUBLIC_E2E_DEBUG === 'true') {
        console.info('ensureTestUser: context cookies after set:', JSON.stringify(allCookies));
      }
    } catch (e) {
      console.warn('ensureTestUser: failed to read context cookies for diagnostics', e && e.message ? e.message : e);
    }
  }

  if (cookieSet && (process.env.CI || process.env.NEXT_PUBLIC_E2E_DEBUG === 'true')) {
    try {
      // Probe the root to force SSR read of cookies (avoid passing ?test_user so we test the cookie path)
      const probeUrl = `${BASE}/?__ssr_probe=${Date.now()}`;
      await page.goto(probeUrl, { waitUntil: 'domcontentloaded', timeout: 7000 });

      const selector = '[data-testid="test-user-server"][data-role="' + role + '"]';
      await page.waitForSelector(selector, { timeout: 3000 });
      console.info('ensureTestUser: SSR probe confirmed server role via cookie:', role);
    } catch (err) {
      console.warn('ensureTestUser: SSR probe failed on first attempt — will try server-set fallback if available');

      // If we haven't already tried the server fallback, attempt it now and re-probe once.
      if (!serverFallbackTried && (process.env.CI || process.env.NEXT_PUBLIC_E2E_DEBUG === 'true')) {
        try {
          const setUrl = `${BASE}/api/test/set-test-user?role=${encodeURIComponent(role)}`;
          console.info('ensureTestUser: attempting server-set-cookie fallback (reprobe) via', setUrl);
          await page.goto(setUrl, { waitUntil: 'networkidle', timeout: 7000 }).catch(() => null);
          await page.waitForTimeout(300);

          // Re-probe SSR
          const probeUrl2 = `${BASE}/?__ssr_probe=${Date.now()}`;
          await page.goto(probeUrl2, { waitUntil: 'domcontentloaded', timeout: 7000 });
          const selector2 = '[data-testid="test-user-server"][data-role="' + role + '"]';
          await page.waitForSelector(selector2, { timeout: 3000 });
          console.info('ensureTestUser: SSR probe confirmed server role via server-set cookie:', role);
          return;
        } catch (err2) {
          // fall-through to throw below
          console.warn('ensureTestUser: server-set reprobe also failed');
        }
      }

      // Intentionally throw so the test fails fast with a trace when SSR did not reflect the cookie.
      throw new Error(`ensureTestUser: SSR probe failed — server did not render test-user cookie for role "${role}". Last cookieSet=${cookieSet}, serverFallbackTried=${serverFallbackTried}.`);
    }
  } else if (cookieSet) {
    console.info('ensureTestUser: cookie set; SSR probe skipped (not CI/debug)');
  } else {
    console.info('ensureTestUser: no cookie could be set; relying on localStorage/query params for test user');
  }
}

// Ensure no test user is present for a request. This clears localStorage and cookies so
// pages rendered server-side with ?no_test_user=true will not see a test user injected.
export async function ensureNoTestUser(page: Page) {
  try {
    // Run before the page scripts execute to avoid hydrating with a test user
    // Clear any keys that could indicate a session (supabase or test harness)
    await page.addInitScript(() => {
      try {
        localStorage.removeItem('test_user');
        try { localStorage.clear(); } catch (e) {}
      } catch (e) {}
    });
  } catch (e) {
    // ignore
  }

  try {
    // Clear cookies from the context to remove any test_user cookie
    await page.context().clearCookies();
    console.info('ensureNoTestUser: cleared cookies');
  } catch (e) {
    // Fallback: expire test_user cookie via document.cookie on the page origin
    try {
      await page.evaluate(() => { document.cookie = 'test_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'; });
      console.info('ensureNoTestUser: expired test_user cookie via document.cookie fallback');
    } catch (err) {
      console.warn('ensureNoTestUser: failed to clear cookies', err && err.message ? err.message : err);
    }
  }
}

