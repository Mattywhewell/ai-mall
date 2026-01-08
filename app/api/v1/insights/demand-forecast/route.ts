import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

// Validate API key and track usage
async function validateApiKey(apiKey: string): Promise<any> {
  const supabase = getSupabaseClient();

  const { data: key, error } = await supabase
    .from('analytics_api_keys')
    .select('*')
    .eq('api_key', apiKey)
    .eq('is_active', true)
    .single();

  if (error || !key) {
    throw new Error('Invalid API key');
  }

  // Check rate limit
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('analytics_api_usage')
    .select('*', { count: 'exact', head: true })
    .eq('api_key_id', key.id)
    .gte('created_at', oneHourAgo);

  if (count && count >= key.rate_limit_per_hour) {
    throw new Error('Rate limit exceeded');
  }

  return key;
}

// Demand Forecast API
export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.replace('Bearer ', '');

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 401 });
    }

    const key = await validateApiKey(apiKey);

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const days = parseInt(searchParams.get('days') || '30');

    // Mock demand forecast (replace with actual AI forecast)
    const forecast = {
      category,
      forecast_days: days,
      predictions: Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        predicted_demand: Math.round(100 + Math.random() * 50),
        confidence: 0.85 + Math.random() * 0.1,
      })),
      insights: {
        trend: 'increasing',
        seasonality: 'high',
        recommended_stock: 150,
      },
    };

    const supabase = getSupabaseClient();

    // Log usage
    await supabase.from('analytics_api_usage').insert({
      api_key_id: key.id,
      user_id: key.user_id,
      endpoint: '/api/v1/insights/demand-forecast',
      method: 'GET',
      query_params: { category, days },
      status_code: 200,
      response_time_ms: Date.now() - startTime,
      credits_charged: 5,
    });

    await supabase
      .from('analytics_api_keys')
      .update({
        total_requests: supabase.rpc('increment', { x: 1 }),
        last_used_at: new Date().toISOString(),
      })
      .eq('id', key.id);

    return NextResponse.json(forecast);

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message.includes('Rate limit') ? 429 : 401 }
    );
  }
}
