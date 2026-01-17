import { ChannelConnections } from '@/components/seller/ChannelConnections';

export const dynamic = 'force-dynamic';

export default function DevChannelConnectionsPage({ searchParams }: { searchParams?: Record<string, string | string[]> }) {
  // This page is intentionally unconditional for CI/dev use only.
  // It bypasses production guards so CI can reliably exercise the UI.
  try {
    console.log('[DevTestPage] ChannelConnections server render', { searchParams });
  } catch (e) {}

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dev Channel Connections Test Page</h1>
      <div data-dev-test>{JSON.stringify({ searchParams })}</div>
      <ChannelConnections onUpdate={() => {}} />
    </div>
  );
}
