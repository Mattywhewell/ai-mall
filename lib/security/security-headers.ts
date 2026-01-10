import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function securityHeadersMiddleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security Headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.supabase.co *.stripe.com; " +
    "style-src 'self' 'unsafe-inline' *.googleapis.com; " +
    "img-src 'self' data: https: *.supabase.co *.stripe.com; " +
    "font-src 'self' *.gstatic.com; " +
    "connect-src 'self' *.supabase.co *.stripe.com *.openai.com; " +
    "frame-src *.stripe.com;"
  );

  // HTTPS Strict Transport Security (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
}