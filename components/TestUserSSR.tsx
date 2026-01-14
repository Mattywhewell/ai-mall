import { cookies } from 'next/headers';

export default function TestUserSSR() {
  const c = cookies();
  const testUser = c.get('test_user')?.value === 'true';
  const role = c.get('test_user_role')?.value;

  if (!testUser) return null;

  // Small, minimally intrusive visible marker that E2E tests can rely on.
  // Keep markup very small and near the top of the body so tests can quickly detect it.
  return (
    <div style={{ position: 'absolute', left: 4, top: 4, zIndex: 2147483647, fontSize: 10 }} data-e2e-test-user={role || 'true'}>
      <a href="/profile" data-e2e-link="test-user">Test User</a>
    </div>
  );
}
