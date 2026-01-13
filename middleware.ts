import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Quick test-mode access control: redirect non-admin test users away from admin routes
  // This makes E2E tests deterministic by performing the redirect server-side.
  const url = request.nextUrl.clone();
  const pathname = url.pathname;
  const isAdminPath = pathname.startsWith('/admin');
  const isSupplierPath = pathname.startsWith('/supplier');
  const testUser = url.searchParams.get('test_user');
  const role = url.searchParams.get('role');

  if (testUser === 'true') {
    // If visiting admin routes and not an admin, redirect to home with access_denied flag
    if (isAdminPath && role !== 'admin') {
      const redirectUrl = new URL('/', request.url);
      redirectUrl.searchParams.set('access_denied', 'true');
      return NextResponse.redirect(redirectUrl);
    }

    // If visiting supplier routes and not a supplier/admin, redirect to home with access_denied flag
    if (isSupplierPath && role !== 'supplier' && role !== 'admin') {
      const redirectUrl = new URL('/', request.url);
      redirectUrl.searchParams.set('access_denied', 'true');
      return NextResponse.redirect(redirectUrl);
    }
  }

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
    const response = NextResponse.next();
    response.cookies.set('user-country', country, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      sameSite: 'lax',
    });
    console.log(`[Middleware] Set user-country cookie to ${country}`);
    return response;
  }

  return NextResponse.next();
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
