import { getSupabaseClient } from '@/lib/supabase-server';

export async function processPendingJobs(options: { limit?: number; sellerId?: string } = {}) {
  const supabase = getSupabaseClient();
  const limit = options.limit ?? 10;
  const sellerIdOverride = options.sellerId;

  // Select pending jobs ready to run
  let q = supabase.from('job_queue').select('*').eq('status', 'pending').lte('scheduled_at', new Date().toISOString()).order('scheduled_at', { ascending: true }).limit(limit);
  if (sellerIdOverride) q = q.eq('seller_id', sellerIdOverride as string);

  const { data: jobs, error: selectError } = await q;
  if (selectError) {
    throw new Error('Failed to select jobs: ' + selectError.message);
  }

  if (!jobs || jobs.length === 0) return { processed: 0, results: [] };

  const jobIds = jobs.map((j: any) => j.id);

  // Mark as processing & set attempts
  const { data: processingRows, error: updErr } = await supabase
    .from('job_queue')
    .update({ status: 'processing', attempts: 1 })
    .in('id', jobIds)
    .select();

  if (updErr) {
    console.warn('Worker update to processing error', updErr);
  }

  let processed = 0;
  const results: any[] = [];

  for (const job of jobs) {
    const runLogInsert = { job_id: job.id, job_type: job.job_type, seller_id: job.seller_id, started_at: new Date().toISOString() };
    const { data: runLog } = await supabase.from('job_run_log').insert(runLogInsert).select().single().catch(() => ({ data: null }));

    try {
      if (job.job_type === 'orders_sync') {
        const channelId = job.payload?.channel_connection_id || null;

        const { data: connections } = channelId ? await supabase.from('seller_channel_connections').select('*').eq('id', channelId).eq('seller_id', job.seller_id) : await supabase.from('seller_channel_connections').select('*').eq('seller_id', job.seller_id);

        for (const conn of connections || []) {
          try {
            const { decryptText } = await import('@/lib/encryption');
            const accessToken = conn.access_token ? decryptText(conn.access_token) : null;

            const { createAdapter } = await import('@/lib/channel-adapters');
            const connForAdapter = accessToken ? { ...conn, access_token: accessToken } : conn;
            const adapter = createAdapter(connForAdapter as any);

            const orders = await adapter.fetchOrders();

            for (const o of orders) {
              const channelOrderId = o.id || o.name || o.order_number || String(Math.random());
              const payloadToInsert = {
                seller_id: job.seller_id,
                channel_connection_id: conn.id,
                channel_order_id: String(channelOrderId),
                channel_order_number: o.order_number || null,
                order_data: o,
                order_status: o.fulfillment_status || o.status || 'pending',
                order_total: o.current_total_price ? parseFloat(String(o.current_total_price)) : (o.total_price ? parseFloat(String(o.total_price)) : null),
                order_currency: o.currency || (o.currency_code || null)
              };

              await supabase.from('channel_orders').upsert(payloadToInsert, { onConflict: ['channel_connection_id', 'channel_order_id'] });
            }

            await supabase.from('seller_channel_connections').update({ last_order_sync: new Date().toISOString() }).eq('id', conn.id);
          } catch (adapterErr) {
            console.warn('Adapter failed for connection', conn.id, conn.channel_type, adapterErr.message || adapterErr);
            continue;
          }
        }
      } else if (job.job_type === 'inventory_sync') {
        await supabase.from('inventory_sync_log').insert({ seller_id: job.seller_id, sync_type: 'push', sync_status: 'pending', created_at: new Date().toISOString() });
      } else if (job.job_type === 'price_sync') {
        await supabase.from('price_sync_log').insert({ seller_id: job.seller_id, sync_status: 'pending', created_at: new Date().toISOString() });
      } else if (job.job_type === 'process_webhook_order') {
        // placeholder: could process the webhook order payload further
        // mark completed
      } else {
        console.warn('Unknown job type, skipping', job.job_type);
      }

      await supabase.from('job_queue').update({ status: 'completed', result: { success: true }, updated_at: new Date().toISOString() }).eq('id', job.id);
      try { const { logAudit } = await import('@/lib/audit'); await logAudit(job.seller_id, 'system', 'job_processed', { job_id: job.id, job_type: job.job_type }); } catch (e) { /* ignore */ }
      await supabase.from('job_run_log').update({ finished_at: new Date().toISOString(), status: 'completed' }).eq('id', runLog?.id || null);

      processed += 1;
      results.push({ job_id: job.id, status: 'completed' });
    } catch (procErr) {
      console.error('Error processing job', job.id, procErr);
      await supabase.from('job_queue').update({ status: 'failed', error_message: String(procErr), updated_at: new Date().toISOString() }).eq('id', job.id);
      await supabase.from('job_run_log').update({ finished_at: new Date().toISOString(), status: 'failed', error_message: String(procErr) }).eq('id', runLog?.id || null);
      try { const { logAudit } = await import('@/lib/audit'); await logAudit(job.seller_id, 'system', 'job_failed', { job_id: job.id, job_type: job.job_type, error: String(procErr) }); } catch (e) { /* ignore */ }
      results.push({ job_id: job.id, status: 'failed', error: String(procErr) });
    }
  }

  return { processed, results };
}
