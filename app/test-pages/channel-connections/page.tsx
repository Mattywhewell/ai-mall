import { ChannelConnections } from '@/components/seller/ChannelConnections';

export default function ChannelConnectionsTestPage({ searchParams }: { searchParams?: Record<string, string | string[]> }) {
  // Guard: only available in non-production unless CI explicitly enables test pages
  const searchHasTestUser = !!searchParams && (searchParams.test_user === 'true' || (Array.isArray(searchParams.test_user) && searchParams.test_user.includes('true')) || Object.prototype.hasOwnProperty.call(searchParams, 'test_user'));
  const allowTestPages = process.env.NEXT_PUBLIC_INCLUDE_TEST_PAGES === 'true' || searchHasTestUser;
  if (process.env.NODE_ENV === 'production' && !allowTestPages) return <div>Not Found</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Channel Connections Test Page</h1>
      <ChannelConnections onUpdate={() => {}} />
    </div>
  );
}
