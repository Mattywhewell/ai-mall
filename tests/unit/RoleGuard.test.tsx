import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the AuthContext to simulate no authenticated user
vi.mock('@/lib/auth/AuthContext', async () => {
  return {
    useAuth: () => ({ user: null, userRole: null, loading: false })
  };
});

// Mock next/router navigation hooks used by RoleGuard during tests
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: () => {} })
}));

import { AdminOnly } from '@/components/RoleGuard';

describe('RoleGuard SSR marker handling', () => {
  beforeEach(() => {
    // Ensure no stray marker
    const existing = document.getElementById('__test_user');
    if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
  });

  it('allows access when server SSR test marker is present', () => {
    const marker = document.createElement('div');
    marker.id = '__test_user';
    marker.setAttribute('data-role', 'admin');
    document.body.appendChild(marker);

    render(
      <AdminOnly>
        <div>ADMIN OK</div>
      </AdminOnly>
    );

    expect(screen.getByText('ADMIN OK')).toBeTruthy();

    // cleanup
    marker.remove();
  });
});
