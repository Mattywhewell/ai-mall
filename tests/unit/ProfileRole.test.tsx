import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock useAuth to return a citizen role synchronously
vi.mock('@/lib/auth/AuthContext', async () => {
  return {
    useAuth: () => ({ user: { id: 'test-id', email: 'test@example.com' }, userRole: 'citizen', loading: false, signOut: async () => {} })
  };
});

// Render the ProfilePage and assert the profile-role-display shows "Citizen"
import ProfilePage from '@/app/profile/page';

describe('Profile role display', () => {
  it('shows Citizen when userRole is citizen', () => {
    render(<ProfilePage />);
    const roleDisplay = screen.getByTestId('profile-role-display');
    expect(roleDisplay).toBeTruthy();
    expect(roleDisplay.textContent).toMatch(/Citizen/i);
  });
});
