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

  // Also proactively set localStorage and dispatch a deterministic event so a client already on the page
  // can act immediately (this helps avoid watcher race conditions in CI where polling/visibility can miss updates)
  try {
    await page.evaluate((r) => {
      try {
        localStorage.setItem('test_user', JSON.stringify({ role: r }));
        window.dispatchEvent(new CustomEvent('test_user_changed', { detail: { role: r } }));
        // Try calling the in-page hook if present to guarantee in-page notification
        try { (window as any).__e2e_notifyTestUser && (window as any).__e2e_notifyTestUser(r); } catch (e) {}
      } catch (e) {}
    }, role);
    console.info('ensureTestUser: dispatched test_user_changed event (initial) for role', role);
  } catch (e) {
    console.warn('ensureTestUser: failed to dispatch initial test_user_changed event', e && e.message ? e.message : e);
  }
  // Playwright's addCookies prefers either `url` OR `domain`+`path` — not both. Use a url-only
  // cookie for origin-based set (works well for the common case) and a domain/path cookie as a
  // fallback for drivers that prefer domain-based cookies. Also attempt an alternate host (localhost
  // vs 127.0.0.1) when possible, since CI environments can vary in hostname resolution.
  // Use an owner token per-call so parallel workers don't clobber each other's runtime state
  const owner = `${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
  const cookieWithUrl = { name: 'test_user', value: JSON.stringify({ role }), url: urlObj.origin } as any;
  const ownerWithUrl = { name: 'test_user_owner', value: owner, url: urlObj.origin } as any;
  const cookieWithDomain = { name: 'test_user', value: JSON.stringify({ role }), domain: urlObj.hostname, path: '/' } as any;
  const ownerWithDomain = { name: 'test_user_owner', value: owner, domain: urlObj.hostname, path: '/' } as any;
  const alternateHost = urlObj.hostname === 'localhost' ? '127.0.0.1' : urlObj.hostname === '127.0.0.1' ? 'localhost' : null;
  const cookieWithDomainAlt = alternateHost ? { name: 'test_user', value: JSON.stringify({ role }), domain: alternateHost, path: '/' } as any : null;
  const ownerWithDomainAlt = alternateHost ? { name: 'test_user_owner', value: owner, domain: alternateHost, path: '/' } as any : null;

  // Attempt 1: set cookie using url (preferred). Verify it was set.
  let cookieSet = false;
  let serverFallbackTried = false;
  try {
    await page.context().addCookies([cookieWithUrl, ownerWithUrl]);
    let cookies = await page.context().cookies();
    let found = cookies.find(c => c.name === 'test_user');
    let ownerFound = cookies.find(c => c.name === 'test_user_owner');
    if (ownerFound) {
      console.info('ensureTestUser: owner cookie set:', ownerFound.value);
    }
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
      await page.context().addCookies([cookieWithDomain, ownerWithDomain]);
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
      await page.context().addCookies([cookieWithDomainAlt, ownerWithDomainAlt]);
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

          // Set raw JSON value (no encode) to avoid double-encoding ambiguity
          await page.evaluate((r, o) => {
            document.cookie = `test_user=${JSON.stringify({ role: r })}; path=/;`;
            document.cookie = `test_user_owner=${o}; path=/;`;
          }, role, owner);

          // Give the browser a moment to apply the cookie to the context
          await page.waitForTimeout(500);

          // Log the owner for traceability
          try {
            const finalCookies = await page.context().cookies();
            const ownerFound = finalCookies.find(c => c.name === 'test_user_owner');
            if (ownerFound) console.info('ensureTestUser: document.cookie set owner:', ownerFound.value);
          } catch (e) {}


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

          // Re-probe SSR
          const probeUrl2 = `${BASE}/?__ssr_probe=${Date.now()}`;

          // set probe header for reprobe and force fresh SSR via cache-bypass
          const probeHeader = { 'x-e2e-ssr-probe': '1', 'cache-control': 'no-cache', 'pragma': 'no-cache' };
          try {
            await page.context().setExtraHTTPHeaders(probeHeader);
            console.info('ensureTestUser: setExtraHTTPHeaders for SSR reprobe:', JSON.stringify(probeHeader));
          } catch (e) {
            console.warn('ensureTestUser: failed to set reprobe header', e && e.message ? e.message : e);
          }

          // Guard: add a route-based header injection specifically for reprobe URLs as well
          const probeRouteMatcher2 = new RegExp(`${urlObj.origin.replace(/[-\\/\^$*+?.()|[\\]{}]/g, '\\$&')}.*__ssr_probe=`);
          const probeRouteHandler2 = async (route: any) => {
            try {
              const req = route.request();
              const headers = { ...req.headers(), 'x-e2e-ssr-probe': '1', 'cache-control': 'no-cache', 'pragma': 'no-cache' };
              await route.continue({ headers });
            } catch (err) {
              try { await route.continue(); } catch (e) {}
            }
          };
          try { await page.route(probeRouteMatcher2, probeRouteHandler2); console.info('ensureTestUser: attached reprobe route handler'); } catch (e) { console.warn('ensureTestUser: failed to attach reprobe route handler', e && e.message ? e.message : e); }

          const navRequestPromise2 = page.waitForRequest((req) => req.url().startsWith(BASE) && req.url().includes('__ssr_probe='), { timeout: 7000 }).catch(() => null);
          const navResponsePromise2 = page.waitForResponse((res) => res.url().startsWith(BASE) && res.url().includes('__ssr_probe='), { timeout: 7000 }).catch(() => null);

          await page.goto(probeUrl2, { waitUntil: 'domcontentloaded', timeout: 7000 }).catch(() => null);

          // Remove the reprobe route handler and clear reprobe header
          try { await page.unroute(probeRouteMatcher2, probeRouteHandler2); console.info('ensureTestUser: removed reprobe route handler'); } catch (e) {}
          try { await page.context().setExtraHTTPHeaders({}); } catch (e) { }


          const navReq2 = await navRequestPromise2;
          if (navReq2) {
            try {
              console.info('ensureTestUser: reprobe request headers:', JSON.stringify(navReq2.headers()));
            } catch (e) {
              console.warn('ensureTestUser: failed to read reprobe request headers', e && e.message ? e.message : e);
            }
          }

          const navRes2 = await navResponsePromise2;
          if (navRes2) {
            try {
              console.info('ensureTestUser: reprobe response headers:', JSON.stringify(navRes2.headers()));
            } catch (e) {
              console.warn('ensureTestUser: failed to read reprobe response headers', e && e.message ? e.message : e);
            }
          }

          // Additionally, call the deterministic probe API and verify SSR rendered the server-set cookie/header
          try {
            const probeApiRes = await page.evaluate(async (probeApi) => {
              const r = await fetch(probeApi, { method: 'GET', headers: { 'x-e2e-ssr-probe': '1', 'cache-control': 'no-cache', 'pragma': 'no-cache' } });
              const text = await r.text();
              try {
                return { status: r.status, body: JSON.parse(text) };
              } catch (e) {
                return { status: r.status, text };
              }
            }, `${BASE}/api/test/ssr-probe?cb=${Date.now()}`);
            console.info('ensureTestUser: server-side ssr-probe API response:', JSON.stringify(probeApiRes));

            const selector2 = '[data-testid="test-user-server"][data-role="' + role + '"]';
            await page.waitForSelector(selector2, { state: 'attached', timeout: 3000 });
            try {
              // Dispatch a deterministic client event so any page already loaded will notice the change immediately
              await page.evaluate((r) => {
                try {
                  localStorage.setItem('test_user', JSON.stringify({ role: r }));
                  window.dispatchEvent(new CustomEvent('test_user_changed', { detail: { role: r } }));
                  // Also invoke the in-page hook if it exists (more deterministic in some navigation scenarios)
                  try { (window as any).__e2e_notifyTestUser && (window as any).__e2e_notifyTestUser(r); } catch (e) {}
                } catch (e) {}
              }, role);
              console.info('ensureTestUser: dispatched test_user_changed event (post-ssr-probe) for role', role);
            } catch (e) {
              console.warn('ensureTestUser: failed to dispatch post-ssr-probe test_user_changed event', e && e.message ? e.message : e);
            }
            console.info('ensureTestUser: SSR probe confirmed server role via cookie (attached):', role);
            return;
          } catch (err2) {
            // Reprobe failed — will fall through to server-set fallback below
            console.warn('ensureTestUser: server-set reprobe also failed', err2 && err2.message ? err2.message : err2);
          }

          // Server-side Set-Cookie fallback
          try {
            serverFallbackTried = true;
            const setUrl = `${BASE}/api/test/set-test-user?role=${encodeURIComponent(role)}`;
            console.info('ensureTestUser: attempting server-set-cookie fallback via', setUrl);
            await page.goto(setUrl, { waitUntil: 'networkidle', timeout: 7000 }).catch(() => null);
            await page.waitForTimeout(500);
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

      // Set a unique probe header and cache-bypass headers so traces and server logs can identify this navigation and force fresh SSR
      const probeHeader = { 'x-e2e-ssr-probe': '1', 'cache-control': 'no-cache', 'pragma': 'no-cache' };
      try {
        await page.context().setExtraHTTPHeaders(probeHeader);
        console.info('ensureTestUser: setExtraHTTPHeaders for SSR probe:', JSON.stringify(probeHeader));
      } catch (e) {
        console.warn('ensureTestUser: failed to set probe header', e && e.message ? e.message : e);
      }

      // Guard: add a route-based header injection specifically for probe URLs in case extraHTTPHeaders doesn't apply to this navigation type.
      const probeRouteMatcher = new RegExp(`${urlObj.origin.replace(/[-\\/\^$*+?.()|[\\]{}]/g, '\\\\$&')}.*__ssr_probe=`);
      const probeRouteHandler = async (route: any) => {
        try {
          const req = route.request();
          const headers = { ...req.headers(), 'x-e2e-ssr-probe': '1', 'cache-control': 'no-cache', 'pragma': 'no-cache' };
          await route.continue({ headers });
        } catch (err) {
          try { await route.continue(); } catch (e) {}
        }
      };
      try { await page.route(probeRouteMatcher, probeRouteHandler); console.info('ensureTestUser: attached probe route handler'); } catch (e) { console.warn('ensureTestUser: failed to attach probe route handler', e && e.message ? e.message : e); }

      // Capture the outgoing navigation request headers for diagnostics. Match any request with the probe query so RSC-prefetch or document navigations are caught.
      const navRequestPromise = page.waitForRequest((req) => req.url().startsWith(BASE) && req.url().includes('__ssr_probe='), { timeout: 7000 }).catch(() => null);
      const navResponsePromise = page.waitForResponse((res) => res.url().startsWith(BASE) && res.url().includes('__ssr_probe='), { timeout: 7000 }).catch(() => null);

      await page.goto(probeUrl, { waitUntil: 'domcontentloaded', timeout: 7000 }).catch(() => null);

      // Remove the probe route handler and clear the probe header so subsequent requests are unaffected
      try { await page.unroute(probeRouteMatcher, probeRouteHandler); console.info('ensureTestUser: removed probe route handler'); } catch (e) {}
      try { await page.context().setExtraHTTPHeaders({}); } catch (e) { }


      const navReq = await navRequestPromise;
      if (navReq) {
        try {
          const headers = navReq.headers();
          console.info('ensureTestUser: probe request headers:', JSON.stringify(headers));
        } catch (e) {
          console.warn('ensureTestUser: failed to read probe request headers', e && e.message ? e.message : e);
        }
      }

      const navRes = await navResponsePromise;
      if (navRes) {
        try {
          const respHeaders: any = {};
          for (const [k, v] of Object.entries(navRes.headers())) respHeaders[k] = v;
          console.info('ensureTestUser: probe response headers:', JSON.stringify(respHeaders));
        } catch (e) {
          console.warn('ensureTestUser: failed to read probe response headers', e && e.message ? e.message : e);
        }
      }

      const selector = '[data-testid="test-user-server"][data-role="' + role + '"]';
      await page.waitForSelector(selector, { timeout: 3000 });
      console.info('ensureTestUser: SSR probe confirmed server role via cookie:', role);
    } catch (err) {
      console.warn('ensureTestUser: SSR probe failed on first attempt — will try server-set fallback if available');

      // If we haven't already tried the server fallback, attempt it now and re-probe once.
      if (!serverFallbackTried && (process.env.CI || process.env.NEXT_PUBLIC_E2E_DEBUG === 'true')) {
        try {
          serverFallbackTried = true; // record we've attempted the server-side Set-Cookie fallback
          const setUrl = `${BASE}/api/test/set-test-user?role=${encodeURIComponent(role)}`;
          console.info('ensureTestUser: attempting server-set-cookie fallback (reprobe) via', setUrl);
          await page.goto(setUrl, { waitUntil: 'networkidle', timeout: 7000 }).catch(() => null);
          await page.waitForTimeout(500);

          // Log cookies after server-set attempt for diagnostics
          try {
            const postServerCookies = await page.context().cookies();
            console.info('ensureTestUser: context cookies after server-set attempt:', JSON.stringify(postServerCookies));
          } catch (e) {
            console.warn('ensureTestUser: failed to read context cookies after server-set reprobe', e && e.message ? e.message : e);
          }

          // Re-probe SSR
          const probeUrl2 = `${BASE}/?__ssr_probe=${Date.now()}`;

          // set probe header for reprobe and force fresh SSR via cache-bypass
          const probeHeader = { 'x-e2e-ssr-probe': '1', 'cache-control': 'no-cache', 'pragma': 'no-cache' };
          try {
            await page.context().setExtraHTTPHeaders(probeHeader);
            console.info('ensureTestUser: setExtraHTTPHeaders for SSR reprobe:', JSON.stringify(probeHeader));
          } catch (e) {
            console.warn('ensureTestUser: failed to set reprobe header', e && e.message ? e.message : e);
          }

          // Guard: add a route-based header injection specifically for reprobe URLs as well
          const probeRouteMatcher2 = new RegExp(`${urlObj.origin.replace(/[-\\/\^$*+?.()|[\\]{}]/g, '\\\\$&')}.*__ssr_probe=`);
          const probeRouteHandler2 = async (route: any) => {
            try {
              const req = route.request();
              const headers = { ...req.headers(), 'x-e2e-ssr-probe': '1', 'cache-control': 'no-cache', 'pragma': 'no-cache' };
              await route.continue({ headers });
            } catch (err) {
              try { await route.continue(); } catch (e) {}
            }
          };
          try { await page.route(probeRouteMatcher2, probeRouteHandler2); console.info('ensureTestUser: attached reprobe route handler'); } catch (e) { console.warn('ensureTestUser: failed to attach reprobe route handler', e && e.message ? e.message : e); }

          const navRequestPromise2 = page.waitForRequest((req) => req.url().startsWith(BASE) && req.url().includes('__ssr_probe='), { timeout: 7000 }).catch(() => null);
          const navResponsePromise2 = page.waitForResponse((res) => res.url().startsWith(BASE) && res.url().includes('__ssr_probe='), { timeout: 7000 }).catch(() => null);

          await page.goto(probeUrl2, { waitUntil: 'domcontentloaded', timeout: 7000 }).catch(() => null);

          // Remove the reprobe route handler and clear reprobe header
          try { await page.unroute(probeRouteMatcher2, probeRouteHandler2); console.info('ensureTestUser: removed reprobe route handler'); } catch (e) {}
          try { await page.context().setExtraHTTPHeaders({}); } catch (e) { }


          const navReq2 = await navRequestPromise2;
          if (navReq2) {
            try {
              console.info('ensureTestUser: reprobe request headers:', JSON.stringify(navReq2.headers()));
            } catch (e) {
              console.warn('ensureTestUser: failed to read reprobe request headers', e && e.message ? e.message : e);
            }
          }

          const navRes2 = await navResponsePromise2;
          if (navRes2) {
            try {
              console.info('ensureTestUser: reprobe response headers:', JSON.stringify(navRes2.headers()));
            } catch (e) {
              console.warn('ensureTestUser: failed to read reprobe response headers', e && e.message ? e.message : e);
            }
          }

          const selector2 = '[data-testid="test-user-server"][data-role="' + role + '"]';
          await page.waitForSelector(selector2, { state: 'attached', timeout: 3000 });
          console.info('ensureTestUser: SSR probe confirmed server role via server-set cookie (attached):', role);
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
    try {
      await page.evaluate((r) => {
        try {
          localStorage.setItem('test_user', JSON.stringify({ role: r }));
          window.dispatchEvent(new CustomEvent('test_user_changed', { detail: { role: r } }));
          try { (window as any).__e2e_notifyTestUser && (window as any).__e2e_notifyTestUser(r); } catch (e) {}
        } catch (e) {}
      }, role);
      console.info('ensureTestUser: dispatched test_user_changed event (cookieSet/no-probe) for role', role);
    } catch (e) {
      console.warn('ensureTestUser: failed to dispatch test_user_changed event (cookieSet/no-probe)', e && e.message ? e.message : e);
    }
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

  // Helper: probe the server-rendered page to ensure it does NOT include the SSR marker
  async function probeServerForNoTestUser(attemptLabel: string) {
    try {
      const probeUrl = `${BASE}/?no_test_user=true&cb=${Date.now()}`;
      await page.goto(probeUrl, { waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => null);
      // If server still injected a test user, the DOM will include #__test_user
      const serverMarkerCount = await page.locator('#__test_user').count().catch(() => 0);
      console.info(`ensureNoTestUser: probe (${attemptLabel}) serverMarkerCount=${serverMarkerCount}`);
      return serverMarkerCount === 0;
    } catch (e) {
      console.warn('ensureNoTestUser: probe failed', e && e.message ? e.message : e);
      return false;
    }
  }

  try {
    // Diagnostic: list cookies present before clearing so traces show what server may see
    try {
      const before = await page.context().cookies().catch(() => []);
      console.info('ensureNoTestUser: cookies before clear:', JSON.stringify(before || []));
    } catch (e) {
      console.warn('ensureNoTestUser: failed to list cookies before clear', e && e.message ? e.message : e);
    }

    // Clear cookies from the context to remove any test_user cookie
    await page.context().clearCookies();

    try {
      const after = await page.context().cookies().catch(() => []);
      console.info('ensureNoTestUser: cookies after clear:', JSON.stringify(after || []));
    } catch (e) {
      console.warn('ensureNoTestUser: failed to list cookies after clear', e && e.message ? e.message : e);
    }

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

  // Now probe the server to ensure it stopped injecting the test user. Retry once if necessary.
  let ok = await probeServerForNoTestUser('initial');
  if (!ok) {
    console.warn('ensureNoTestUser: server still injected __test_user after initial clear — retrying');
    try {
      await page.context().clearCookies();
      await page.evaluate(() => { document.cookie = 'test_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'; });
      console.info('ensureNoTestUser: cleared cookies (retry)');
    } catch (e) {
      console.warn('ensureNoTestUser: retry clearCookies failed', e && e.message ? e.message : e);
    }

    // Additional server-side attempt: call the test clear endpoint to ensure the server stops injecting the marker
    try {
      const resp = await page.request.get(`${BASE}/api/test/clear-test-user`);
      const text = await resp.text();
      console.info('ensureNoTestUser: called /api/test/clear-test-user:', resp.status(), text && text.slice ? text.slice(0,200) : text);

      // Parse returned JSON to get owner/clearedAt for diagnostics
      let clearJson: any = null;
      try { clearJson = JSON.parse(text || '{}'); } catch (e) { clearJson = null; }
      const ownerCleared = clearJson?.owner || null;
      const clearedAt = clearJson?.clearedAt || null;

      // Poll /api/test/ssr-probe until server reports role === null (timeout ~5s, backoff 200-250ms)
      const deadline = Date.now() + 5000;
      let probeOk = false;
      while (Date.now() < deadline) {
        try {
          const p = await page.request.get(`${BASE}/api/test/ssr-probe?cb=${Date.now()}`);
          const j = await p.json().catch(() => null);
          const sawRole = typeof j === 'object' ? j?.role : undefined;
          console.info('ensureNoTestUser: ssr-probe poll:', { ownerCleared, clearedAt, sawRole, probeJson: j, status: p.status() });
          if (sawRole === null) { probeOk = true; break; }
        } catch (e) {
          // ignore transient errors
        }
        await page.waitForTimeout(250);
      }

      if (probeOk) {
        console.info('ensureNoTestUser: ssr-probe confirmed cleared state');
        ok = true;
      } else {
        console.warn('ensureNoTestUser: ssr-probe did not report cleared role within timeout; falling back to page probe');
        ok = await probeServerForNoTestUser('retry');
      }
    } catch (e) {
      console.warn('ensureNoTestUser: failed to call /api/test/clear-test-user', e && e.message ? e.message : e);
      ok = await probeServerForNoTestUser('retry');
    }
  }

  if (!ok) {
    // final diagnostic dump to help CI debugging
    try {
      const snippet = (await page.content()).slice(0, 2000);
      console.error('ensureNoTestUser: server still injecting __test_user after retry; will report back to caller. Page snippet:', snippet);
    } catch (e) {
      console.error('ensureNoTestUser: failed to capture page content for diagnostics', e && e.message ? e.message : e);
    }
    // Return false to let callers decide whether to skip the test (server-level injection likely)
    return false;
  }

  // If we get here, server did not render a test user marker and it is safe for tests that expect unauthenticated UI
  return true;
}

// NEW: wait for profile to be ready (SSR marker + header or role display)
export async function waitForProfileReady(page: Page, role: string, timeout = 20000) {
  // Wait for server-rendered marker first (fast path)
  try {
    await page.waitForSelector(`#__test_user[data-role="${role}"]`, { timeout: Math.min(4000, timeout) });
  } catch (e) {
    // ignore
  }

  const start = Date.now();
  const deadline = start + timeout;
  while (Date.now() < deadline) {
    // Prefer profile-role-display, then H1, then any Profile link
    const roleDisplay = await page.locator('[data-testid="profile-role-display"]').count().catch(() => 0);
    if (roleDisplay > 0) return;
    const h1 = await page.locator('h1').count().catch(() => 0);
    if (h1 > 0) return;
    const profileLink = await page.getByRole('link', { name: /Account|Profile/i }).count().catch(() => 0);
    if (profileLink > 0) return;
    await page.waitForTimeout(500);
  }
  // final attempt: let the test code handle failure (we return without throwing)
}

// NEW: wait for seeded row text to appear with retries
export async function waitForSeededRow(page: Page, text: string, timeout = 20000) {
  const start = Date.now();
  const deadline = start + timeout;
  while (Date.now() < deadline) {
    const found = await page.locator(`text=${text}`).count().catch(() => 0);
    if (found > 0) return true;
    // Try giving the page a moment and then a soft reload to pick up server-side seeds
    await page.waitForTimeout(500);
    try { await page.reload({ waitUntil: 'domcontentloaded', timeout: 5000 }); } catch (e) {}
    await page.waitForTimeout(500);
  }
  return false;
}

// NEW: wait for gtag event presence with timeout
export async function waitForGtagEvent(page: Page, eventName: string, timeout = 5000) {
  try {
    await page.waitForFunction((name) => {
      const calls = (window as any).__gtag_calls || [];
      return calls.some((c: any[]) => c[0] === 'event' && c[1] === name);
    }, eventName, { timeout });
    return true;
  } catch (e) {
    return false;
  }
}

