'use client';

import Script from 'next/script';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}

// Helper functions for tracking events
export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, params);
  }

  // Fallback: send telemetry to server-side endpoint if GA is not available or as a backup
  try {
    if (typeof window !== 'undefined') {
      // Fire-and-forget; do not block UI
      fetch('/api/telemetry/hero-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName, params, timestamp: new Date().toISOString() }),
      }).catch(() => {});
    }
  } catch (e) {
    // no-op
  }
};

export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

export const trackPurchase = (transactionId: string, value: number, items: any[]) => {
  trackEvent('purchase', {
    transaction_id: transactionId,
    value: value,
    currency: 'USD',
    items: items,
  });
};

export const trackAddToCart = (item: any) => {
  trackEvent('add_to_cart', {
    currency: 'USD',
    value: item.price,
    items: [{
      item_id: item.id,
      item_name: item.name,
      price: item.price,
    }],
  });
};

export const trackViewItem = (item: any) => {
  trackEvent('view_item', {
    currency: 'USD',
    value: item.price,
    items: [{
      item_id: item.id,
      item_name: item.name,
      price: item.price,
    }],
  });
};
