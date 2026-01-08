import { NextResponse } from 'next/server';
import { supplierIntegrationEngine } from '@/lib/autonomous/supplier-integration-engine';
import { getSupabaseClient } from '@/lib/supabase-server';

/**
 * POST /api/integration/supplier/[supplierId]
 * Trigger manual integration for a supplier
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    const { supplierId } = await params;

    // Check if supplier exists
    const { data: supplier, error } = await supabase
      .from('suppliers')
      .select('id, business_name, integration_status')
      .eq('id', supplierId)
      .single();

    if (error || !supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    // Check if already integrated
    if (supplier.integration_status === 'complete') {
      return NextResponse.json({
        message: 'Supplier already integrated',
        status: 'complete'
      });
    }

    // Mark as in progress
    await supabase
      .from('suppliers')
      .update({ integration_status: 'in_progress' })
      .eq('id', supplierId);

    // Trigger integration (async)
    supplierIntegrationEngine.integrateSupplier(supplierId).catch(error => {
      console.error('Integration failed:', error);
    });

    return NextResponse.json({
      success: true,
      message: `Integration started for ${supplier.business_name}`,
      supplierId
    });
  } catch (error: any) {
    console.error('Error triggering integration:', error);
    return NextResponse.json(
      { error: 'Failed to trigger integration', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/integration/supplier/[supplierId]
 * Get integration status for a supplier
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    const { supplierId } = await params;

    const { data: supplier, error } = await supabase
      .from('suppliers')
      .select('id, business_name, integration_status, integrated_at, integration_error, metadata')
      .eq('id', supplierId)
      .single();

    if (error || !supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    // Get integration jobs
    const { data: jobs } = await supabase
      .from('autonomous_jobs')
      .select('*')
      .eq('entity_id', supplierId)
      .order('created_at', { ascending: false })
      .limit(20);

    return NextResponse.json({
      supplier: {
        id: supplier.id,
        name: supplier.business_name,
        status: supplier.integration_status,
        integratedAt: supplier.integrated_at,
        error: supplier.integration_error,
        brandAnalysis: supplier.metadata?.brand_analysis
      },
      jobs: jobs || []
    });
  } catch (error: any) {
    console.error('Error fetching integration status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status', details: error.message },
      { status: 500 }
    );
  }
}
