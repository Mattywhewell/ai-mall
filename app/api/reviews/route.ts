import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

// Submit a product review
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const {
      product_id,
      storefront_id,
      user_id,
      rating,
      review_title,
      review_text,
      verified_purchase = false,
      images = []
    } = body;

    if (!product_id || !storefront_id || !user_id || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const supabase_client = supabase;

    // Create review
    const { data: review, error } = await supabase_client
      .from('product_reviews')
      .insert([{
        product_id,
        storefront_id,
        user_id,
        rating,
        review_title,
        review_text,
        verified_purchase,
        images,
        status: 'published'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating review:', error);
      return NextResponse.json(
        { error: 'Failed to create review' },
        { status: 500 }
      );
    }

    // Update product rating
    const { data: allReviews } = await supabase_client
      .from('product_reviews')
      .select('rating')
      .eq('product_id', product_id)
      .eq('status', 'published');

    if (allReviews) {
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      
      await supabase_client
        .from('creator_products')
        .update({
          rating: avgRating,
          review_count: allReviews.length
        })
        .eq('id', product_id);
    }

    // Create notification for creator
    await supabase_client
      .from('user_notifications')
      .insert([{
        user_id: storefront_id, // Creator will get notification
        notification_type: 'new_review',
        title: 'New Review!',
        message: `You received a ${rating}-star review`,
        link_url: `/creator/reviews`,
        priority: 'normal'
      }]);

    return NextResponse.json({
      success: true,
      review,
      message: 'Review submitted successfully!'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in reviews POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get reviews for a product
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const product_id = searchParams.get('product_id');
    const storefront_id = searchParams.get('storefront_id');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sort = searchParams.get('sort') || 'recent'; // recent, helpful, rating_high, rating_low

    if (!product_id && !storefront_id) {
      return NextResponse.json(
        { error: 'product_id or storefront_id required' },
        { status: 400 }
      );
    }

    const supabase_client = supabase;
    let query = supabase_client
      .from('product_reviews')
      .select('*', { count: 'exact' })
      .eq('status', 'published');

    if (product_id) {
      query = query.eq('product_id', product_id);
    }
    if (storefront_id) {
      query = query.eq('storefront_id', storefront_id);
    }

    // Apply sorting
    switch (sort) {
      case 'helpful':
        query = query.order('helpful_count', { ascending: false });
        break;
      case 'rating_high':
        query = query.order('rating', { ascending: false });
        break;
      case 'rating_low':
        query = query.order('rating', { ascending: true });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data: reviews, error, count } = await query
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }

    // Calculate rating distribution
    const ratingDist = [0, 0, 0, 0, 0];
    reviews?.forEach(r => ratingDist[r.rating - 1]++);

    const avgRating = reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return NextResponse.json({
      success: true,
      reviews,
      count,
      limit,
      offset,
      stats: {
        average_rating: avgRating,
        total_reviews: count,
        rating_distribution: {
          5: ratingDist[4],
          4: ratingDist[3],
          3: ratingDist[2],
          2: ratingDist[1],
          1: ratingDist[0]
        }
      }
    });

  } catch (error) {
    console.error('Error in reviews GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
