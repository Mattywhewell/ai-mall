import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { InventorySync } from '@/components/seller/InventorySync';

describe('InventorySync', () => {
  beforeEach(() => {
    (global as any).fetch = vi.fn((url: string) => {
      if (url.includes('/channels')) return Promise.resolve({ ok: true, json: async () => ({ connections: [] }) });
      return Promise.resolve({ ok: true, json: async () => ({ inventory: [] }) });
    });
  });

  test('renders empty inventory and matches snapshot', async () => {
    const { container } = render(<InventorySync onUpdate={() => {}} />);
    await waitFor(() => expect(screen.getByText('No inventory items found')).toBeInTheDocument());
    expect(container).toMatchSnapshot();
  });
});
