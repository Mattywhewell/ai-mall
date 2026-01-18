export const dynamic = 'force-dynamic';

export default function SimpleDevPage() {
  console.log('[DevTestPage] simple server render');
  return <div data-dev-simple>ok</div>;
}
