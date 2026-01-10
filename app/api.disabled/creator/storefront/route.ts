import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create new storefront (after application approval)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      storefront_name,
      brand_identity,
      location_hall_id,
      location_street_id,
      storefront_tier = 'basic',
      ai_assistant_enabled = false
    } = body;

    if (!user_id || !storefront_name || !brand_identity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify user has approved application
    const { data: application } = await supabase
      .from('vendor_applications')
      .select('*')
      .eq('user_id', user_id)
      .eq('application_status', 'approved')
      .single();

    if (!application) {
      return NextResponse.json(
        { error: 'No approved application found. Please apply first.' },
        { status: 403 }
      );
    }

    // Check if storefront already exists
    const { data: existing } = await supabase
      .from('creator_storefronts')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Storefront already exists', storefront: existing },
        { status: 409 }
      );
    }

    // Generate vendor_id and slug
    const vendor_id = `vendor_${user_id}_${Date.now()}`;
    const slug = storefront_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Determine pricing based on tier
    const pricing = {
      basic: { monthly: 49.00, commission: 15.00 },
      premium: { monthly: 99.00, commission: 12.00 },
      enterprise: { monthly: 199.00, commission: 10.00 }
    };

    const tier_pricing = pricing[storefront_tier as keyof typeof pricing];

    // Create storefront
    const { data: storefront, error } = await supabase
      .from('creator_storefronts')
      .insert([{
        vendor_id,
        user_id,
        storefront_name,
        slug,
        brand_identity,
        location_hall_id,
        location_street_id,
        storefront_tier,
        ai_assistant_enabled,
        ai_assistant_personality: ai_assistant_enabled ? {
          tone: 'friendly',
          expertise_level: 'expert',
          response_style: 'helpful'
        } : null,
        status: 'active',
        featured: false,
        verified: false
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating storefront:', error);
      return NextResponse.json(
        { error: 'Failed to create storefront' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      storefront,
      pricing: tier_pricing,
      message: `Storefront created! Monthly fee: $${tier_pricing.monthly}, Commission: ${tier_pricing.commission}%`
    }, { status: 201 });

  } catch (error) {
    console.error('Error in storefront POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get storefront by user_id or vendor_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const vendor_id = searchParams.get('vendor_id');
    const slug = searchParams.get('slug');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    let query = supabase.from('creator_storefronts').select('*');

    if (user_id) {
      query = query.eq('user_id', user_id);
    } else if (vendor_id) {
      query = query.eq('vendor_id', vendor_id);
    } else if (slug) {
      query = query.eq('slug', slug);
    } else {
      // Get all active storefronts
      query = query.eq('status', 'active').order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching storefront:', error);
      return NextResponse.json(
        { error: 'Failed to fetch storefront' },
        { status: 500 }
      );
    }

    if ((user_id || vendor_id || slug) && !data) {
      return NextResponse.json(
        { error: 'Storefront not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: (user_id || vendor_id || slug) ? data?.[0] : data
    });

  } catch (error) {
    console.error('Error in storefront GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update storefront
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { vendor_id, ...updates } = body;

    if (!vendor_id) {
      return NextResponse.json(
        { error: 'vendor_id required' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: storefront, error } = await supabase
      .from('creator_storefronts')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('vendor_id', vendor_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating storefront:', error);
      return NextResponse.json(
        { error: 'Failed to update storefront' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      storefront,
      message: 'Storefront updated successfully'
    });

  } catch (error) {
    console.error('Error in storefront PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
