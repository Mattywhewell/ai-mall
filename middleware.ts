import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Debug: log request entry and key headers for tracing 403 sources
  try {
    console.log('[Middleware] Incoming request', {
      method: request.method,
      url: request.url,
      auth: request.headers.get('authorization') ? '[present]' : '[missing]',
      contentType: request.headers.get('content-type'),
      forwardedFor: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent')?.slice(0, 100)
    });
  } catch (e) {
    console.warn('[Middleware] Failed to log request headers', e);
  }

  const { pathname } = request.nextUrl;

  // If the request targets a test page and includes ?test_user, rewrite
  // to add a cache-busting param so Next.js serves it dynamically instead
  // of returning a cached prerendered HTML that might contain "Not Found".
  try {
    const url = request.nextUrl.clone();
    if (url.pathname.startsWith('/test-pages') && url.searchParams.has('test_user')) {
      if (!url.searchParams.has('_test_user_force')) {
        url.searchParams.set('_test_user_force', '1');
        console.log('[Middleware] Rewriting test-pages request to bypass prerender cache', url.toString());
        return NextResponse.rewrite(url);
      }
    }
  } catch (e) {
    console.warn('[Middleware] Failed to rewrite test-pages request', e);
  }
  
  // Block test/development routes in production
  const isProduction = process.env.NODE_ENV === 'production';
  const testRoutes = ['/test-auth', '/test-pricing'];
  
  if (isProduction && testRoutes.some(route => pathname.startsWith(route))) {
    console.log(`[Middleware] Blocking test route in production: ${pathname}`);
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
    console.log(`[Middleware] Set user-country cookie to ${country}`);
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
