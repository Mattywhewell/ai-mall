import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get user ID
    const userId = `anon_${Math.random().toString(36).substring(7)}`;

    // Fetch street data
    const { data: street, error: streetError } = await supabase
      .from('streets')
      .select('*')
      .eq('slug', slug)
      .single();

    if (streetError || !street) {
      return NextResponse.json(
        { error: 'Street not found' },
        { status: 404 }
      );
    }

    // Fetch parent hall if connected
    let parentHall = null;
    if (street.connects_hall_id) {
      const { data: hallData } = await supabase
        .from('halls')
        .select('*')
        .eq('id', street.connects_hall_id)
        .single();
      parentHall = hallData;
    }

    // Get existing AI spirit if available
    const { data: existingSpirit } = await supabase
      .from('ai_spirits')
      .select('*')
      .eq('entity_type', 'street')
      .eq('entity_id', street.id)
      .single();

    // Create simple static spirit data if none exists
    const spirit = existingSpirit?.spirit_data || {
      name: street.name,
      greeting: `Welcome to ${street.name}, a vibrant pathway of discovery.`,
      personality: street.personality || 'friendly',
      voice_style: 'conversational'
    };

    // Fetch districts (simplified - just get some microstores)
    const { data: districts } = await supabase
      .from('microstores')
      .select('id, name, slug, district, description, cover_image')
      .limit(6);

    // Fetch featured products
    const { data: featuredProducts } = await supabase
      .from('products')
      .select('*')
      .limit(8)
      .order('created_at', { ascending: false });

    // Simple atmospheric description based on personality
    const atmosphereMap: Record<string, string> = {
      tech: 'Sleek surfaces reflect innovation in every direction. The air hums with possibilities.',
      neon: 'Vibrant lights paint the path ahead. Energy pulses through every corner.',
      artisan: 'Craftsmanship meets creativity. Each step reveals new artistry.',
      wellness: 'Calm surrounds you. Peace flows through this serene passage.',
      vintage: 'Timeless charm whispers stories of the past. Heritage lives here.'
    };

    const atmosphericDescription = atmosphereMap[street.personality] || 
      `${street.name} welcomes you. A pathway connecting worlds.`;

    return NextResponse.json({
      street: street,
      spirit: spirit,
      atmospheric_description: atmosphericDescription,
      districts: districts || [],
      featured_products: featuredProducts || [],
      parent_hall: parentHall
    });

  } catch (error) {
    console.error('Error fetching street:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
