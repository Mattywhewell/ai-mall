/**
 * Sentry Configuration for Error Monitoring
 * Run: npm install @sentry/nextjs
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // Capture Replay for 10% of all sessions,
  // plus 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps
  
  environment: process.env.NODE_ENV,

  // Filter out sensitive data
  beforeSend(event, hint) {
    // Remove sensitive data from events
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }

    // Filter out specific errors
    if (event.exception) {
      const error = hint.originalException;
      if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as Error).message;
        
        // Ignore known non-critical errors
        if (
          message.includes('Network request failed') ||
          message.includes('Failed to fetch') ||
          message.includes('Timeout')
        ) {
          return null; // Don't send to Sentry
        }
      }
    }

    return event;
  },

  // Performance monitoring
  integrations: [
    // BrowserTracing and Replay have been moved to separate imports in newer versions
    // Update based on your @sentry/nextjs version
  ],
});

export default Sentry;
