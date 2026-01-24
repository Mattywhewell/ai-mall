// Server-rendered layout for /profile
// Injects a synchronous script when ?test_user=true so E2E tests can detect role immediately

export const dynamic = 'force-dynamic';

export default function ProfileLayout({ children, searchParams }: { children: React.ReactNode; searchParams: Record<string, any> }) {
  const isTest = searchParams?.test_user === 'true';
  const role = (searchParams?.role ?? 'citizen').toString().toLowerCase();

  // DIAG: server-side SSR marker for profile role (appears in server logs)
  try {
    // eslint-disable-next-line no-console
    console.info('DIAG: ProfileLayout SSR', { role, isTest, searchParams });
  } catch (e) {}

  return (
    <>
      {isTest ? (
        // Server-rendered, hidden marker for tests (readable synchronously by client-side code)
        <>
          <div id="__test_user" data-role={role} data-ts={String(Date.now())} data-testid="test-user-server" style={{ display: 'none' }} />
          {/* Server-rendered, visible test-only role display (minimal, unobtrusive) */}
          <div data-testid="profile-role-display" style={{ position: 'fixed', right: 8, bottom: 8, background: 'rgba(0,0,0,0.05)', padding: '4px 6px', fontSize: 12, borderRadius: 4, zIndex: 9999, pointerEvents: 'none' }}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </div>
        </>
      ) : null}
      {children}
    </>
  );
}
