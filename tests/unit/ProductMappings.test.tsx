import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ProductMappings } from '@/components/seller/ProductMappings';

describe('ProductMappings', () => {
  beforeEach(() => {
    (global as any).fetch = vi.fn((url: string) => {
      if (url.endsWith('/products')) return Promise.resolve({ ok: true, json: async () => ({ products: [] }) });
      if (url.includes('/channels')) return Promise.resolve({ ok: true, json: async () => ({ connections: [] }) });
      return Promise.resolve({ ok: true, json: async () => ({ mappings: [] }) });
    });
  });

  test('renders empty state and matches snapshot', async () => {
    const { container } = render(<ProductMappings onUpdate={() => {}} />);
    await waitFor(() => expect(screen.getByText('No product mappings found')).toBeInTheDocument());
    expect(container).toMatchSnapshot();
  });
});
