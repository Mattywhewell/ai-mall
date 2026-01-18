export const dynamic = 'force-dynamic';

import DevChannelConnectionsClient from './DevChannelConnectionsClient';
import { Settings, AlertTriangle } from 'lucide-react';

// Lightweight dev-only page: dynamically mount a tiny client wrapper which imports
// the real ChannelConnections component client-side only (keeps SSR fast).

export default async function DevChannelConnectionsPage({ searchParams }: { searchParams?: any }) {
  // This page is intentionally unconditional for CI/dev use only.
  // Avoid synchronous access to `searchParams` (see NextJS messages).
  let sp = {};
  try {
    sp = searchParams ? await searchParams : {};
    console.log('[DevTestPage] ChannelConnections server render', { searchParams: sp });
  } catch (e) { /* continue without blocking */ }

  // Dev-only deterministic states for E2E
  if (sp?.dev_state === 'error') {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Dev Channel Connections Test Page</h1>
        <div data-dev-test>{JSON.stringify({ searchParams: sp })}</div>
        <div data-testid="error-alert-channels" className="p-4 bg-red-50 border border-red-200 rounded" role="alert" aria-live="assertive">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-medium text-red-800">Failed to load channel data. Please try again.</p>
              <p className="text-sm text-red-700 mt-2">If the problem persists, contact support or try again later.</p>
              <div className="mt-3">
                <button aria-label="Retry loading channels" className="px-3 py-2 bg-white rounded">Retry</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (sp?.dev_state === 'success') {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Dev Channel Connections Test Page</h1>
        <div data-dev-test>{JSON.stringify({ searchParams: sp })}</div>
        <div className="text-center py-8 text-gray-500" role="status" aria-live="polite">
          <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" aria-hidden="true" />
          <p>No channels connected yet</p>
          <p className="text-sm">Add your first sales channel to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dev Channel Connections Test Page</h1>
      <div data-dev-test>{JSON.stringify({ searchParams: sp })}</div>
      <div data-dev-placeholder>ok</div>

      {/* Client-only mount: this will load the ChannelConnections UI in the browser */}
      <DevChannelConnectionsClient searchParams={sp} />
    </div>
  );
}
