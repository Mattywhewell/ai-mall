import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { cookies, headers } from 'next/headers';
import { MainNavigation } from '@/components/MainNavigation';
import { getServerTestUser } from '@/lib/testUserServerState';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Alverse - Conscious Commerce',
  description: 'Experience a living AI city where creators, AI citizens, and conscious commerce coexist',
};

export default async function RootLayout({
  children,
  searchParams,
}: {
  children: React.ReactNode;
  // Accept searchParams so we can pass test_user through for deterministic SSR during tests
  searchParams?: { [key: string]: string | undefined };
}) {
  // If tests pass ?test_user and optionally ?role in the URL, or the environment exposes
  // NEXT_PUBLIC_TEST_USER, surface that as an initial user for the client AuthProvider.
  // Default to role 'citizen' if none is provided — this ensures deterministic SSR behavior
  // for CI runs that skip Supabase seeding (SKIP_SUPABASE_SEED=true).
  //
  // Per-request opt-out: tests that require an *unauthenticated* baseline can pass
  // ?no_test_user=true to avoid server-side test-user injection (keeps harness and tests
  // deterministic while allowing explicit unauthenticated scenarios).
  const envTestUserRaw = process.env.NEXT_PUBLIC_TEST_USER === 'true';
  const envTestRole = process.env.NEXT_PUBLIC_TEST_USER_ROLE;
  const envSkipSeed = process.env.SKIP_SUPABASE_SEED === 'true';
  // If CI is configured to skip Supabase seeding, do NOT honor a build-time
  // NEXT_PUBLIC_TEST_USER. This prevents a deterministic test user from being
  // inlined at build/start time and allows the runtime clear endpoint (and
  // per-request cookies/query params) to fully control SSR behavior.
  const envTestUser = envSkipSeed ? false : envTestUserRaw;
  if (envSkipSeed && envTestUserRaw) {
    // eslint-disable-next-line no-console
    console.info('CI: SKIP_SUPABASE_SEED=true -> ignoring NEXT_PUBLIC_TEST_USER build-time flag to avoid inlined SSR test user');
  }
  const queryTestUser = typeof searchParams !== 'undefined' && searchParams?.test_user === 'true';
  const queryRole = typeof searchParams !== 'undefined' ? searchParams?.role : undefined;
  const noTestUser = typeof searchParams !== 'undefined' && searchParams?.no_test_user === 'true';
  let initialUser = !noTestUser && (queryTestUser || envTestUser)
    ? { role: (queryRole || envTestRole || 'citizen') }
    : undefined;

  // Runtime server-side guard (module-level): if tests used the runtime API to set/clear
  // a test user, respect that explicit decision rather than env or cookie. This allows
  // /api/test/clear-test-user to be authoritative and stop the SSR injection immediately.
  try {
    const runtimeServerUser = getServerTestUser();
    if (typeof runtimeServerUser !== 'undefined') {
      if (runtimeServerUser === null) {
        // Explicitly cleared on the server
        initialUser = undefined;
      } else {
        // Server is explicitly setting a role at runtime
        initialUser = { role: runtimeServerUser };
      }
    }
  } catch (e) {
    // ignore errors reading runtime flag
  }

  // Gated SSR cookie fallback (test-only): when CI or debug flag is set, OR when an E2E
  // probe header (`x-e2e-ssr-probe`) or probe query param is present, read the `test_user`
  // cookie and use it to influence env-driven defaults so tests can control SSR
  // initialUser deterministically. **Query params still take precedence**
  // — only apply cookie-based override when the request did not already pass
  // a `?test_user=true` query param (we want explicit query-level intent to win).
  // Support for probe header/query lets local dev runs or route-injected headers force a one-off SSR evaluation.
  // Probe header detection: use an awaited call to headers() to avoid Next.js sync-dynamic-api checks
  let probeHeaderPresent: string | null = null;
  try {
    const _h = await headers();
    probeHeaderPresent = _h.get('x-e2e-ssr-probe');
  } catch (e) {
    probeHeaderPresent = null;
  }
  const isProbeQuery = typeof searchParams !== 'undefined' && (typeof searchParams.__test_cookie_probe !== 'undefined' || typeof searchParams.__ssr_probe !== 'undefined');

  if ((process.env.CI || process.env.NEXT_PUBLIC_E2E_DEBUG === 'true') || probeHeaderPresent || isProbeQuery) {
    try {
      const cookieStore = await cookies();
      const cookieVal = cookieStore.get('test_user')?.value;

      // If a trace-probe header or probe query is present, log it with cookie value so traces and server logs are unambiguous
      try {
        const probeHeaderVal = probeHeaderPresent;
        if (probeHeaderVal) {
          // eslint-disable-next-line no-console
          console.info('CI: SSR PROBE RECEIVED header:', probeHeaderVal, 'cookieVal:', cookieVal || '<none>', 'searchParams:', JSON.stringify(searchParams || {}));
        } else if (isProbeQuery) {
          // eslint-disable-next-line no-console
          console.info('CI: SSR PROBE QUERY present:', JSON.stringify(searchParams || {}), 'cookieVal:', cookieVal || '<none>');
        }
      } catch (e) {
        // ignore
      }

      // Only allow cookie to apply when the test did not explicitly pass ?test_user in the URL
      // and the per-request opt-out is not set. In CI/debug runs we want a per-request cookie to be
      // able to *override* the build-time env defaults (NEXT_PUBLIC_TEST_USER), while still letting
      // explicit query params take precedence. This allows individual tests to set the role via
      // cookie even though the global build exposes a default TEST_USER for deterministic runs.
      // Log probe header for clarity in traces
      // eslint-disable-next-line no-console
      console.info('CI: SSR PROBE HEADER:', probeHeaderPresent);

      if (cookieVal && !noTestUser && !queryTestUser) {
        try {
          let parsed: any = null;
          let decodedVal: string | null = null;
          // First try: common case where a cookie may be URL-encoded once
          try {
            decodedVal = decodeURIComponent(cookieVal);
            // eslint-disable-next-line no-console
            console.info('CI: SSR COOKIE RAW:', cookieVal);
            // eslint-disable-next-line no-console
            console.info('CI: SSR COOKIE DECODED:', decodedVal);
            parsed = JSON.parse(decodedVal);
          } catch (e) {
            // Fallback: try parsing raw value (some clients set raw JSON directly)
            try {
              // eslint-disable-next-line no-console
              console.info('CI: SSR COOKIE RAW (fallback):', cookieVal);
              parsed = JSON.parse(cookieVal);
              // eslint-disable-next-line no-console
              console.info('CI: SSR COOKIE PARSED (fallback):', parsed);
            } catch (e2) {
              parsed = null;
              // eslint-disable-next-line no-console
              console.info('CI: SSR COOKIE PARSE FAILED:', e2 && (e2.message || e2));
            }
          }

          // eslint-disable-next-line no-console
          console.info('CI: SSR COOKIE PARSED:', parsed);
          // eslint-disable-next-line no-console
          console.info('CI: SSR COOKIE ROLE:', parsed && parsed.role ? parsed.role : '<no-role>');

          if (parsed && parsed.role) {
            const prev = initialUser?.role;
            initialUser = { role: parsed.role };
            // eslint-disable-next-line no-console
            console.info('CI: SSR initialUser set from cookie (overrode:', prev || '<none>', ') ->', initialUser.role);
          }
        } catch (e) {
          // ignore JSON parse issues
          // eslint-disable-next-line no-console
          console.info('CI: SSR COOKIE HANDLER ERROR:', e && (e.message || e));
        }
      }
    } catch (e) {
      // ignore errors reading cookies
    }
  }

  // Emit a short, CI-gated diagnostic so server-side logs show whether SSR initialUser was set in CI runs
  if (process.env.CI || process.env.NEXT_PUBLIC_E2E_DEBUG === 'true') {
    // eslint-disable-next-line no-console
    console.info('CI: SSR initialUser:', initialUser ? initialUser.role : '<missing>', 'searchParams:', JSON.stringify(searchParams || {}));
  }

  return (
    <html lang="en">
      <head>
        {/* Very early error capture script to catch errors before other client scripts execute */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            window.__clientErrors = window.__clientErrors || [];
            window.addEventListener('error', function(e){
              try{
                console.error('GlobalError', e.message, e.filename, e.lineno, e.colno, e.error && e.error.stack);
                window.__clientErrors.push({type:'error', message:e.message, filename:e.filename, lineno:e.lineno, colno:e.colno, stack: e.error && e.error.stack});
              }catch(err){console.error('Error capturing error', err)}
            });
            window.addEventListener('unhandledrejection', function(e){
              try{
                console.error('UnhandledRejection', e.reason && (e.reason.stack || e.reason));
                window.__clientErrors.push({type:'unhandledrejection', reason: e.reason && (e.reason.stack || e.reason)});
              }catch(err){console.error('Error capturing rejection', err)}
            });
          })();
        `}} />
      </head>
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        {/* E2E test helper: if tests pass ?test_user and ?role, render a hidden server-side marker so both SSR and client can read the same role synchronously */}
        {initialUser ? (
          <div id="__test_user" data-role={initialUser.role} data-testid="test-user-server" style={{ display: 'none' }} />
        ) : null}

        <AuthProvider initialUser={initialUser}>
          {/* Early client-side error capture for diagnostics */}
          <script dangerouslySetInnerHTML={{ __html: `
            (function(){
              window.__clientErrors = window.__clientErrors || [];
              window.addEventListener('error', function(e){
                try{
                  console.error('GlobalError', e.message, e.filename, e.lineno, e.colno, e.error && e.error.stack);
                  window.__clientErrors.push({type:'error', message:e.message, filename:e.filename, lineno:e.lineno, colno:e.colno, stack: e.error && e.error.stack});
                }catch(err){console.error('Error capturing error', err)}
              });
              window.addEventListener('unhandledrejection', function(e){
                try{
                  console.error('UnhandledRejection', e.reason && (e.reason.stack || e.reason));
                  window.__clientErrors.push({type:'unhandledrejection', reason: e.reason && (e.reason.stack || e.reason)});
                }catch(err){console.error('Error capturing rejection', err)}
              });
            })();
          `}} />

          {/* Site-wide navigation */}
          <MainNavigation initialRole={initialUser?.role} />

          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
