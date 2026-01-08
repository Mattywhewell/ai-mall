/**
 * Cron Job: Process Supplier Integrations (Hourly)
 * Checks for pending supplier integrations and processes them automatically
 */

import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';
import { supplierIntegrationEngine } from '@/lib/autonomous/supplier-integration-engine';

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron] Starting supplier integration processing...');

    // Find pending supplier integrations
    const { data: pendingSuppliers, error } = await supabase
      .from('suppliers')
      .select('id, business_name, integration_status')
      .in('integration_status', ['pending', 'failed'])
      .order('created_at', { ascending: true })
      .limit(5); // Process 5 at a time to avoid timeouts

    if (error) {
      console.error('Error fetching pending suppliers:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!pendingSuppliers || pendingSuppliers.length === 0) {
      console.log('No pending supplier integrations');
      return NextResponse.json({
        message: 'No pending integrations',
        processed: 0,
      });
    }

    const results = {
      total: pendingSuppliers.length,
      successful: 0,
      failed: 0,
      suppliers: [] as any[],
    };

    // Process each supplier
    for (const supplier of pendingSuppliers) {
      try {
        console.log(`Processing supplier: ${supplier.business_name}`);
        
        // Start integration in background
        supplierIntegrationEngine.integrateSupplier(supplier.id).catch(err => {
          console.error(`Background integration failed for ${supplier.id}:`, err);
        });

        results.successful++;
        results.suppliers.push({
          id: supplier.id,
          name: supplier.business_name,
          status: 'processing',
        });
      } catch (error) {
        console.error(`Failed to process supplier ${supplier.id}:`, error);
        results.failed++;
        results.suppliers.push({
          id: supplier.id,
          name: supplier.business_name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log('[Cron] Supplier integration processing complete:', results);

    return NextResponse.json({
      message: 'Supplier integrations processed',
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Failed to process supplier integrations', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
