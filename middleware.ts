import { NextRequest, NextResponse } from 'next/server';
import { log as ndLog } from '@/lib/server-ndjson';

export function middleware(request: NextRequest) {
  // Debug: log request entry and key headers for tracing 403 sources
  try {
    // Emit a high-signal NDJSON request start event for tracing
    ndLog('info','request_start',{
      method: request.method,
      url: request.url,
      pathname: request.nextUrl.pathname,
      auth_present: !!request.headers.get('authorization'),
      contentType: request.headers.get('content-type'),
      forwardedFor: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent')?.slice(0, 100)
    });
  } catch (e) {
    ndLog('warn','middleware_log_failed',{error: String(e)});
  }

  const { pathname } = request.nextUrl;

  // If the request targets a test page and includes ?test_user, rewrite
  // to add a cache-busting param so Next.js serves it dynamically instead
  // of returning a cached prerendered HTML that might contain "Not Found".
  try {
    const url = request.nextUrl.clone();

    // Existing behavior: rewrite /test-pages requests that include ?test_user
    if (url.pathname.startsWith('/test-pages') && url.searchParams.has('test_user')) {
      if (!url.searchParams.has('_test_user_force')) {
        url.searchParams.set('_test_user_force', '1');
        ndLog('info','rewrite_test_pages',{from: request.nextUrl.toString(), to: url.toString()});
        const rewritten = NextResponse.rewrite(url);
        // Add a diagnostic header so we can confirm middleware rewrites in network traces
        rewritten.headers.set('x-test-pages-rewritten', '1');
        rewritten.headers.set('x-test-pages-original', request.nextUrl.toString());
        return rewritten;
      }
    }

    // NEW: For E2E tests we want to bypass prerender cache in a few cases:
    // 1) When ?test_user is present (previous behavior): ensure SSR sees the role
    // 2) When _test_user_force is present (tests may add it directly on target pages)
    // Both cases should rewrite once to avoid serving stale prerendered HTML that
    // doesn't reflect the test user's role.
    if (url.searchParams.has('test_user')) {
      if (!url.searchParams.has('_test_user_force')) {
        url.searchParams.set('_test_user_force', '1');
        ndLog('info','rewrite_test_user',{from: request.nextUrl.toString(), to: url.toString()});
        const rewritten = NextResponse.rewrite(url);
        rewritten.headers.set('x-test-user-rewritten', '1');
        rewritten.headers.set('x-test-user-original', request.nextUrl.toString());
        return rewritten;
      }
    }

    // If tests directly add _test_user_force to a target page (e.g., /admin/dashboard),
    // ensure we also rewrite such requests so the page is served dynamically rather than
    // returning a potentially stale prerendered copy.
    if (url.searchParams.has('_test_user_force')) {
      if (!url.searchParams.has('_test_user_rewritten')) {
        url.searchParams.set('_test_user_rewritten', '1');
        ndLog('info','rewrite_test_user_force',{from: request.nextUrl.toString(), to: url.toString()});
        const rewritten = NextResponse.rewrite(url);
        rewritten.headers.set('x-test-user-force-rewritten', '1');
        rewritten.headers.set('x-test-user-original', request.nextUrl.toString());
        return rewritten;
      }
    }
  } catch (e) {
    ndLog('warn','middleware_rewrite_failed',{error: String(e)});
  }
  
  // Block test/development routes in production
  const isProduction = process.env.NODE_ENV === 'production';
  const testRoutes = ['/test-auth', '/test-pricing'];
  
  if (isProduction && testRoutes.some(route => pathname.startsWith(route))) {
    ndLog('warn','blocking_test_route_in_production',{route: pathname});
    // Return 404 for test routes in production
    return new NextResponse(null, { status: 404 });
  }

  const response = NextResponse.next();
  
  // Detect user country from Vercel/Cloudflare geo headers
  // Falls back to US if not available
  // Note: request.geo is only available on Vercel Edge
  const country = request.headers.get('x-vercel-ip-country') ||
                  request.headers.get('cf-ipcountry') || 
                  'US';
  
  // Check if country cookie already exists
  const existingCountry = request.cookies.get('user-country')?.value;
  
  // Set or update the user-country cookie
  if (!existingCountry || existingCountry !== country) {
    response.cookies.set('user-country', country, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      sameSite: 'lax',
    });
    ndLog('info','user_country_cookie_set',{country});
  }
  
  return response;
}

// Apply middleware to all routes except static files and API routes that don't need geo
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
