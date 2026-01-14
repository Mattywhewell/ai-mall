'use client';

import React from 'react';
import { RoleGuard } from './RoleGuard';

export default function SupplierAuthWrapper({ children }: { children: React.ReactNode }) {
  // In non-production environments, allow tests to bypass RoleGuard by using ?e2e_bypass_auth=true
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('e2e_bypass_auth') === 'true') {
      return <>{children}</>;
    }
  }

  return (
    <RoleGuard allowedRoles={['supplier']} fallbackPath="/" showMessage={true}>
      {children}
    </RoleGuard>
  );
}
