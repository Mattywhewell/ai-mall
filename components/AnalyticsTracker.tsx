'use client';

import { useEffect } from 'react';
import { trackProductView } from '@/lib/analytics/tracking';

interface AnalyticsTrackerProps {
  productId: string;
  microstoreId: string;
}

export default function AnalyticsTracker({
  productId,
  microstoreId,
}: AnalyticsTrackerProps) {
  useEffect(() => {
    // Track product view when component mounts
    trackProductView(productId, microstoreId);
  }, [productId, microstoreId]);

  return null; // This component doesn't render anything
}
