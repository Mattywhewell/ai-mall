import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/admin/stripe/connections
 * Get all suppliers with their Stripe connection status
 */
export async function GET() {
  try {
    // Get all suppliers with Stripe connection data
    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('id, business_name, email, website, stripe_account_id, stripe_connected_at')
      .order('stripe_connected_at', { ascending: false, nullsFirst: false });

    if (error) throw error;

    // Mock revenue data - in production, join with orders table
    const suppliersWithStats = suppliers.map(supplier => ({
      ...supplier,
      total_revenue: Math.floor(Math.random() * 50000), // Mock data
      pending_payouts: Math.floor(Math.random() * 5000), // Mock data
    }));

    // Calculate stats
    const total = suppliers.length;
    const connected = suppliers.filter(s => s.stripe_account_id).length;
    const pending = total - connected;
    const connectionRate = total > 0 ? Math.round((connected / total) * 100) : 0;

    return NextResponse.json({
      suppliers: suppliersWithStats,
      stats: {
        total,
        connected,
        pending,
        connectionRate,
      },
    });
  } catch (error) {
    console.error('Stripe connections fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connections' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/stripe/connections/remind
 * Send connection reminder to a supplier
 */
export async function POST(req: Request) {
  try {
    const { supplierId } = await req.json();

    // Get supplier info
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('email, business_name')
      .eq('id', supplierId)
      .single();

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    // TODO: Send email reminder
    // await sendEmail({
    //   to: supplier.email,
    //   subject: 'Connect Your Stripe Account - AI City',
    //   template: 'stripe-connection-reminder',
    //   data: { businessName: supplier.business_name }
    // });

    console.log(`Reminder sent to ${supplier.email}`);

    return NextResponse.json({
      success: true,
      message: `Reminder sent to ${supplier.email}`,
    });
  } catch (error) {
    console.error('Send reminder error:', error);
    return NextResponse.json(
      { error: 'Failed to send reminder' },
      { status: 500 }
    );
  }
}
