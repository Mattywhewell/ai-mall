import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Bulk upload products
export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  try {
    const { supplier_id, products } = await request.json();

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: 'Products array required' },
        { status: 400 }
      );
    }

    // Create bulk operation record
    const { data: operation, error: opError } = await supabase
      .from('bulk_operations')
      .insert({
        operation_type: 'product_upload',
        user_id: supplier_id,
        total_items: products.length,
        status: 'processing',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (opError) throw opError;

    // Process products in batches
    const batchSize = 50;
    let processed = 0;
    let failed = 0;
    const errors: any[] = [];

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      
      try {
        const { error: batchError } = await supabase
          .from('products')
          .insert(batch.map(p => ({
            ...p,
            supplier_id,
            status: 'pending_review',
          })));

        if (batchError) {
          failed += batch.length;
          errors.push({
            batch: i / batchSize + 1,
            error: batchError.message,
          });
        } else {
          processed += batch.length;
        }
      } catch (err: any) {
        failed += batch.length;
        errors.push({
          batch: i / batchSize + 1,
          error: err.message,
        });
      }

      // Update progress
      await supabase
        .from('bulk_operations')
        .update({
          processed_items: processed,
          failed_items: failed,
        })
        .eq('id', operation.id);
    }

    // Mark as completed
    await supabase
      .from('bulk_operations')
      .update({
        status: failed > 0 ? 'completed' : 'completed',
        completed_at: new Date().toISOString(),
        error_log: errors.length > 0 ? errors : null,
      })
      .eq('id', operation.id);

    return NextResponse.json({
      success: true,
      operation_id: operation.id,
      processed,
      failed,
      errors: errors.length > 0 ? errors : null,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get bulk operation status
export async function GET(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { searchParams } = new URL(request.url);
  const operation_id = searchParams.get('operation_id');
  const user_id = searchParams.get('user_id');

  try {
    let query = supabase
      .from('bulk_operations')
      .select('*')
      .order('created_at', { ascending: false });

    if (operation_id) {
      query = query.eq('id', operation_id);
    } else if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const { data: operations, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      operations: operations || [],
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
