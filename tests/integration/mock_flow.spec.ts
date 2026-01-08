import { test, expect } from '@playwright/test';
import { getSupabaseClient } from '@/lib/supabase-server';
import { processPendingJobs } from '@/lib/jobs/worker';

test('mock flow end-to-end via direct worker call', async () => {
  const supabase = getSupabaseClient();

  // create a temporary user using admin API
  const email = `test+mock+${Date.now()}@example.com`;
  const password = 'DemoPass123!';
  const { data: createUserData, error: createUserErr } = await supabase.auth.admin.createUser({ email, password, email_confirm: true } as any);
  expect(createUserErr).toBeNull();
  const userId = (createUserData as any).user?.id || (createUserData as any)?.id;
  expect(userId).toBeTruthy();

  try {
    // create mock connection
    const { data: conn } = await supabase.from('seller_channel_connections').insert({ seller_id: userId, channel_type: 'mock', channel_name: 'Test Mock Store', connection_status: 'connected', is_active: true }).select().single();
    expect(conn).toBeTruthy();

    // enqueue orders_sync job
    const { data: job } = await supabase.from('job_queue').insert({ seller_id: userId, job_type: 'orders_sync', payload: {}, scheduled_at: new Date().toISOString() }).select().single();
    expect(job).toBeTruthy();

    // run worker directly
    const result = await processPendingJobs({ limit: 10, sellerId: userId });
    expect(result.processed).toBeGreaterThan(0);

    // verify orders exist
    const { data: orders } = await supabase.from('channel_orders').select('*').eq('seller_id', userId);
    expect(orders && orders.length).toBeGreaterThan(0);

  } finally {
    // cleanup
    await supabase.from('channel_orders').delete().eq('seller_id', userId);
    await supabase.from('job_run_log').delete().eq('seller_id', userId);
    await supabase.from('job_queue').delete().eq('seller_id', userId);
    await supabase.from('seller_channel_connections').delete().eq('seller_id', userId);

    try {
      await supabase.auth.admin.deleteUser(userId as string);
    } catch (err) {
      console.warn('Failed to delete test user, please remove manually', err);
    }
  }
});
