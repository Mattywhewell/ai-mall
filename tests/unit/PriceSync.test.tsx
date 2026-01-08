import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { PriceSync } from '@/components/seller/PriceSync';

describe('PriceSync', () => {
  beforeEach(() => {
    (global as any).fetch = vi.fn((url: string) => {
      if (url.includes('/channels')) return Promise.resolve({ ok: true, json: async () => ({ connections: [] }) });
      return Promise.resolve({ ok: true, json: async () => ({ prices: [] }) });
    });
  });

  test('renders empty prices and matches snapshot', async () => {
    const { container } = render(<PriceSync onUpdate={() => {}} />);
    await waitFor(() => expect(screen.getByText('No price items found')).toBeInTheDocument());
    expect(container).toMatchSnapshot();
  });
});
