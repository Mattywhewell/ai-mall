import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { OrderSync } from '@/components/seller/OrderSync';

describe('OrderSync', () => {
  beforeEach(() => {
    (global as any).fetch = vi.fn((url: string) => {
      if (url.includes('/channels')) return Promise.resolve({ ok: true, json: async () => ({ connections: [] }) });
      return Promise.resolve({ ok: true, json: async () => ({ orders: [] }) });
    });
  });

  test('renders empty orders and matches snapshot', async () => {
    const { container } = render(<OrderSync onUpdate={() => {}} />);
    await waitFor(() => expect(screen.getByText('No orders found')).toBeInTheDocument());
    expect(container).toMatchSnapshot();
  });
});
