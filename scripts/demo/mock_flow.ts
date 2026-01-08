import fetch from 'node-fetch';
import { getSupabaseClient } from '@/lib/supabase-server';

async function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)); }

async function run() {
  const supabase = getSupabaseClient();

  console.log('Creating demo user...');
  const email = `demo+mock+${Date.now()}@example.com`;
  const password = 'SupabaseDemo123!';

  const { data: createUserData, error: createUserErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  } as any);

  if (createUserErr) {
    console.error('Failed to create demo user', createUserErr);
    return;
  }

  const userId = (createUserData as any).user?.id || (createUserData as any)?.id || null;
  if (!userId) {
    console.error('Could not determine user id from creation response', createUserData);
    return;
  }

  console.log('Demo user created:', userId, email);

  try {
    console.log('Creating mock channel connection...');
    const { data: conn } = await supabase.from('seller_channel_connections').insert({ seller_id: userId, channel_type: 'mock', channel_name: 'Demo Mock Store', connection_status: 'connected', is_active: true }).select().single();

    console.log('Mock connection created:', conn.id);

    console.log('Enqueuing orders_sync job for demo user...');
    const { data: job } = await supabase.from('job_queue').insert({ seller_id: userId, job_type: 'orders_sync', payload: {}, scheduled_at: new Date().toISOString() }).select().single();

    console.log('Job enqueued:', job.id);

    console.log('Triggering worker endpoint...');
    const workerRes = await fetch('http://localhost:3000/api/seller/jobs/worker', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ limit: 10 }) });
    const workerData = await workerRes.json();
    console.log('Worker response:', workerData);

    console.log('Waiting a few seconds for DB to be updated...');
    await sleep(3000);

    console.log('Querying channel_orders for demo user...');
    const { data: orders } = await supabase.from('channel_orders').select('*').eq('seller_id', userId).limit(50);

    console.log(`Found ${orders?.length || 0} orders for demo user`);
    if (orders && orders.length > 0) {
      console.log('Sample order:', orders[0]);
    }

    console.log('Cleaning up demo artifacts...');
    await supabase.from('channel_orders').delete().eq('seller_id', userId);
    await supabase.from('seller_channel_connections').delete().eq('seller_id', userId);
    await supabase.from('job_queue').delete().eq('seller_id', userId);

    // Delete user
    try {
      await supabase.auth.admin.deleteUser(userId as string);
    } catch (delErr) {
      console.warn('Failed to delete demo user via auth.admin.deleteUser; consider cleaning up manually', delErr);
    }

    console.log('Demo flow completed.');
  } catch (err) {
    console.error('Demo flow failed', err);
  }
}

run().catch(err => { console.error('Unexpected error', err); process.exit(1); });
