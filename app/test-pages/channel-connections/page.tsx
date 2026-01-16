'use client';

import { ChannelConnections } from '@/components/seller/ChannelConnections';

export default function ChannelConnectionsTestPage() {
  // Guard: only available in non-production
  if (process.env.NODE_ENV === 'production') return <div>Not Found</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Channel Connections Test Page</h1>
      <ChannelConnections onUpdate={() => {}} />
    </div>
  );
}
