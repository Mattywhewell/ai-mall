import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';
import { verifyShopifyWebhook } from '@/lib/shopifyWebhook';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const hmac = req.headers.get('x-shopify-hmac-sha256') || '';
    const topic = req.headers.get('x-shopify-topic') || '';
    const shop = req.headers.get('x-shopify-shop-domain') || '';

    const secret = process.env.SHOPIFY_API_SECRET || '';

    if (!verifyShopifyWebhook(rawBody, hmac, secret)) {
      console.warn('Shopify webhook verification failed for shop:', shop, 'topic:', topic);
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody || '{}');

    const supabase = getSupabaseClient();

    // Try to find connection matching shop domain
    const shopUrl = `https://${shop}`;
    const { data: connections } = await supabase
      .from('seller_channel_connections')
      .select('*')
      .ilike('store_url', `%${shop}%`)
      .limit(1);

    const conn = connections && connections.length > 0 ? connections[0] : null;

    if (topic.startsWith('orders/')) {
      // Audit: webhook received
      try {
        const { logAudit } = await import('@/lib/audit');
        await logAudit(conn ? conn.seller_id : null, 'webhook', 'shopify_webhook_received', { topic, shop, channel_connection_id: conn ? conn.id : null });
      } catch (auditErr) {
        console.error('Audit log failed for shopify webhook', auditErr);
      }

      // Upsert order into channel_orders
      if (!conn) {
        // No connection found, log and return 200 to acknowledge
        console.warn('No connection found for shop webhook', shop);
        return NextResponse.json({ success: true, note: 'No connection mapping' });
      }

      const channelOrderId = payload.id || payload.order_number || String(Math.random());
      const insertPayload: any = {
        seller_id: conn.seller_id,
        channel_connection_id: conn.id,
        channel_order_id: String(channelOrderId),
        channel_order_number: payload.order_number || null,
        order_data: payload,
        order_status: payload.fulfillment_status || payload.status || 'pending',
        order_total: payload.total_price ? parseFloat(String(payload.total_price)) : null,
        order_currency: payload.currency || payload.currency_code || null
      };

      await supabase.from('channel_orders').upsert(insertPayload, { onConflict: ['channel_connection_id', 'channel_order_id'] });

      // Optionally enqueue a job to process order further
      await supabase.from('job_queue').insert({ seller_id: conn.seller_id, job_type: 'process_webhook_order', payload: { channel_connection_id: conn.id, channel_order_id: channelOrderId }, scheduled_at: new Date().toISOString() });

      return NextResponse.json({ success: true });
    }

    if (topic.startsWith('inventory_levels/') || topic === 'products/update') {
      // Create inventory sync log entry for downstream processing
      if (!conn) {
        console.warn('No connection found for inventory webhook', shop);
        return NextResponse.json({ success: true, note: 'No connection mapping' });
      }

      await supabase.from('inventory_sync_log').insert({ seller_id: conn.seller_id, channel_connection_id: conn.id, product_mapping_id: null, sync_type: 'pull', quantity_before: null, quantity_after: null, sync_status: 'synced', error_message: null, created_at: new Date().toISOString(), });

      return NextResponse.json({ success: true });
    }

    // Default: acknowledge
    return NextResponse.json({ success: true, topic });
  } catch (err) {
    console.error('Shopify webhook handler error', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}