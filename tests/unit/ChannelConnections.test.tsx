import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ChannelConnections } from '@/components/seller/ChannelConnections';

describe('ChannelConnections', () => {
  beforeEach(() => {
    (global as any).fetch = vi.fn((url: string) => {
      if (url.includes('/supported')) return Promise.resolve({ ok: true, json: async () => ({ channels: [{ id: 'shopify', channel_type: 'shopify', channel_name: 'Shopify', description: 'Shopify storefront', requires_oauth: true, is_implemented: true }] }) });
      return Promise.resolve({ ok: true, json: async () => ({ connections: [] }) });
    });
  });

  test('renders loading then empty state and matches snapshot', async () => {
    const { container } = render(<ChannelConnections onUpdate={() => {}} />);
    // Loading state should be present
    expect(screen.getByRole('status')).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('No channels connected yet')).toBeInTheDocument());
    expect(container).toMatchSnapshot();
  });
});
