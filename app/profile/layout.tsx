// Server-rendered layout for /profile
// Injects a synchronous script when ?test_user=true so E2E tests can detect role immediately

export const dynamic = 'force-dynamic';

export default function ProfileLayout({ children, searchParams }: { children: React.ReactNode; searchParams: Record<string, any> }) {
  const isTest = searchParams?.test_user === 'true';
  const role = (searchParams?.role ?? 'citizen').toString().toLowerCase();

  return (
    <>
      {isTest ? (
        // This script runs as part of the initial HTML and sets a data attribute synchronously
        <>
          <script
            dangerouslySetInnerHTML={{ __html: `document.documentElement.setAttribute('data-test-user-role', ${JSON.stringify(role)});` }}
          />
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
