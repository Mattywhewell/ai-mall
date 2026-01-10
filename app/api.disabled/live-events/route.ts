import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

// GET - List live events
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'live';
    const creatorId = searchParams.get('creatorId');
    const upcoming = searchParams.get('upcoming') === 'true';

    let query = supabase
      .from('live_shopping_events')
      .select(`
        *,
        creator:creator_storefronts (
          id,
          brand_name,
          slug,
          logo_url,
          rating,
          total_sales
        )
      `);

    if (creatorId) {
      query = query.eq('creator_id', creatorId);
    } else if (status === 'live') {
      query = query.eq('status', 'live');
    } else if (upcoming) {
      query = query
        .eq('status', 'scheduled')
        .gte('scheduled_start', new Date().toISOString())
        .order('scheduled_start', { ascending: true });
    }

    const { data: events, error } = await query.limit(20);

    if (error) throw error;

    // For live events, get current viewer count
    if (status === 'live' && events) {
      for (const event of events) {
        const { count } = await supabase
          .from('event_attendees')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .is('left_at', null);

        event.viewers_current = count || 0;
      }
    }

    return NextResponse.json({ events: events || [] });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

// POST - Create new live event
export async function POST(req: NextRequest) {
  try {
    const {
      creatorId,
      title,
      description,
      coverImage,
      scheduledStart,
      scheduledEnd,
      featuredProducts,
      eventDiscountPercent,
    } = await req.json();

    if (!creatorId || !title || !scheduledStart || !scheduledEnd) {
      return NextResponse.json(
        { error: 'Creator ID, title, and schedule required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    // Verify creator exists
    const { data: creator, error: creatorError } = await supabase
      .from('creator_storefronts')
      .select('id')
      .eq('id', creatorId)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Create event
    const { data: event, error } = await supabase
      .from('live_shopping_events')
      .insert([{
        creator_id: creatorId,
        title,
        description,
        cover_image: coverImage,
        scheduled_start: scheduledStart,
        scheduled_end: scheduledEnd,
        featured_products: featuredProducts || [],
        event_discount_percent: eventDiscountPercent || 0,
        status: 'scheduled',
      }])
      .select(`
        *,
        creator:creator_storefronts (
          brand_name,
          slug,
          logo_url
        )
      `)
      .single();

    if (error) throw error;

    // Notify followers about new event
    const { data: followers } = await supabase
      .from('creator_follows')
      .select('user_id')
      .eq('creator_id', creatorId);

    if (followers && followers.length > 0) {
      const notifications = followers.map(f => ({
        user_id: f.user_id,
        notification_type: 'new_event',
        title: 'New Live Event Scheduled',
        message: `${event.creator.brand_name} is hosting "${title}"`,
        link_url: `/live/${event.id}`,
        metadata: {
          event_id: event.id,
          scheduled_start: scheduledStart,
        }
      }));

      await supabase.from('user_notifications').insert(notifications);
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}

// PUT - Update event status (go live, end, etc.)
export async function PUT(req: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { eventId, action, data } = await req.json();

    if (!eventId || !action) {
      return NextResponse.json({ error: 'Event ID and action required' }, { status: 400 });
    }

    let updates: any = {};

    switch (action) {
      case 'start':
        updates = {
          status: 'live',
          actual_start: new Date().toISOString(),
        };
        break;

      case 'end':
        updates = {
          status: 'ended',
          actual_end: new Date().toISOString(),
        };
        break;

      case 'cancel':
        updates = {
          status: 'cancelled',
        };
        break;

      case 'update_stats':
        if (data) {
          updates = {
            viewers_peak: data.viewersPeak,
            messages_count: data.messagesCount,
            sales_count: data.salesCount,
            revenue_generated: data.revenueGenerated,
          };
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { data: event, error } = await supabase
      .from('live_shopping_events')
      .update(updates)
      .eq('id', eventId)
      .select(`
        *,
        creator:creator_storefronts (
          brand_name,
          slug
        )
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
  }
}
