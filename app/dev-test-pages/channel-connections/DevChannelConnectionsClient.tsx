"use client";

import { useEffect } from 'react';
import { ChannelConnections } from '@/components/seller/ChannelConnections';

// For the dev-only test page we import the component synchronously to avoid dynamic chunk delays
export default function DevChannelConnectionsClient({ searchParams }: { searchParams?: any }) {
  const [devState, setDevState] = useState<string | null>(null);

  useEffect(() => {
    console.log('[DevTestPage] ChannelConnections client mount', { searchParams });
    // Client-side detection of dev_state to handle cases where server searchParams aren't available in CI
    try {
      const params = new URLSearchParams(window.location.search);
      const clientState = (searchParams && (searchParams.dev_state as string)) || params.get('dev_state') || (params.get('test_user') === 'true' ? 'error' : null);
      setDevState(clientState);
    } catch (e) {
      setDevState(searchParams?.dev_state || null);
    }
  }, [searchParams]);

  if (devState === 'error') {
    return (
      <div className="p-4" data-testid="error-alert-channels" role="alert">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <div>
            <p className="font-medium text-red-800">Failed to load channel data. Please try again.</p>
            <div className="mt-3">
              <button aria-label="Retry loading channels" className="px-3 py-2 bg-white rounded">Retry</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (devState === 'success') {
    return (
      <div className="p-8">
        <div className="text-center py-8 text-gray-500" role="status">
          <p>No channels connected yet</p>
        </div>
      </div>
    );
  }

  return <ChannelConnections />;
}
