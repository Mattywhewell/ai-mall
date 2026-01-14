'use client';

import { useEffect, useState } from 'react';

export default function AccessDeniedBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('access_denied') === 'true') setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div role="alert" className="w-full bg-red-600 text-white py-2 text-center">
      <strong>Access denied:</strong> You are not authorized to view that page.
    </div>
  );
}
