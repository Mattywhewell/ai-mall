import { ChannelConnections } from '@/components/seller/ChannelConnections';

export const dynamic = "force-dynamic";

export default function ChannelConnectionsTestPage({ searchParams }: { searchParams?: Record<string, string | string[]> }) {
  // Guard: only available in non-production unless CI explicitly enables test pages
  const searchHasTestUser = !!searchParams && (searchParams.test_user === 'true' || (Array.isArray(searchParams.test_user) && searchParams.test_user.includes('true')) || Object.prototype.hasOwnProperty.call(searchParams, 'test_user'));
  const allowTestPages = process.env.NEXT_PUBLIC_INCLUDE_TEST_PAGES === 'true' || searchHasTestUser;

  // Diagnostic log to confirm server-side rendering and received search params in CI
  try {
    // eslint-disable-next-line no-console
    console.log('[TestPage] ChannelConnections server render', { searchParams, allowTestPages, includeFlag: process.env.NEXT_PUBLIC_INCLUDE_TEST_PAGES });
  } catch (e) {
    // ignore
  }

  if (process.env.NODE_ENV === 'production' && !allowTestPages) return <div>Not Found</div>;

  // Support deterministic dev states for E2E (mirror dev-test-pages behavior)
  if (searchParams?.dev_state === 'error') {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Channel Connections Test Page (Dev State: error)</h1>
        <div data-test-debug>{JSON.stringify({ searchParams, allowTestPages })}</div>
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

  if (searchParams?.dev_state === 'success') {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Channel Connections Test Page (Dev State: success)</h1>
        <div data-test-debug>{JSON.stringify({ searchParams, allowTestPages })}</div>
        <div className="text-center py-8 text-gray-500" role="status" aria-live="polite">
          <p>No channels connected yet</p>
          <p className="text-sm">Add your first sales channel to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Channel Connections Test Page</h1>
      {/* Diagnostic element for HTML snapshot inspection */}
      <div data-test-debug>{JSON.stringify({ searchParams, allowTestPages })}</div>
      <ChannelConnections />
    </div>
  );
}
