import { test, expect } from '@playwright/test';
import { getSupabaseClient } from '@/lib/supabase-server';
import { processPendingJobs } from '@/lib/jobs/worker';

const originalFetch = global.fetch as any;

afterEach(() => {
  (global as any).fetch = originalFetch;
});

test('BigCommerce adapter end-to-end mocked flow', async () => {
  const supabase = getSupabaseClient();

  const email = `bc+mock+${Date.now()}@example.com`;
  const password = 'DemoPass123!';
  const { data: createUserData, error: createUserErr } = await supabase.auth.admin.createUser({ email, password, email_confirm: true } as any);
  expect(createUserErr).toBeNull();
  const userId = (createUserData as any).user?.id || (createUserData as any)?.id;
  expect(userId).toBeTruthy();

  try {
    const { data: conn } = await supabase.from('seller_channel_connections').insert({ seller_id: userId, channel_type: 'bigcommerce', channel_name: 'BC Test', store_id: 'store123', access_token: 'AT', connection_status: 'connected', is_active: true }).select().single();
    expect(conn).toBeTruthy();

    // Mock fetch to return paginated orders and products
    let called = 0;
    (global as any).fetch = vi.fn().mockImplementation(async (url: string) => {
      called++;
      if (url.includes('/orders')) {
        if (called === 1) return { ok: true, json: async () => new Array(1).fill(0).map((_, i) => ({ id: `BC-O-${i}`, total_inc_tax: 20 })) };
        return { ok: true, json: async () => [] };
      }
      if (url.includes('/catalog/products')) {
        return { ok: true, json: async () => ({ data: new Array(2).fill(0).map((_, i) => ({ id: `P-${i}` })) }) };
      }
      return { ok: true, json: async () => ({}) };
    });

    const { data: job } = await supabase.from('job_queue').insert({ seller_id: userId, job_type: 'orders_sync', payload: {}, scheduled_at: new Date().toISOString() }).select().single();
    expect(job).toBeTruthy();

    const result = await processPendingJobs({ limit: 10, sellerId: userId });
    expect(result.processed).toBeGreaterThan(0);

    const { data: orders } = await supabase.from('channel_orders').select('*').eq('seller_id', userId);
    expect(orders && orders.length).toBeGreaterThan(0);
  } finally {
    await supabase.from('channel_orders').delete().eq('seller_id', userId);
    await supabase.from('job_run_log').delete().eq('seller_id', userId);
    await supabase.from('job_queue').delete().eq('seller_id', userId);
    await supabase.from('seller_channel_connections').delete().eq('seller_id', userId);
    try { await supabase.auth.admin.deleteUser(userId as string); } catch (e) { /* ignore */ }
  }
});