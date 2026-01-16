import { RoleGuard } from '@/components/RoleGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={["admin"]} fallbackPath="/" showMessage={true}>
      <div className="min-h-screen">
        {children}
      </div>
    </RoleGuard>
  );
}
