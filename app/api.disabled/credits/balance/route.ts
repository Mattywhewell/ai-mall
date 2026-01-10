import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase-server';

// Get user's credit balance
export async function GET(request: Request) {
  const supabase = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get('user_id');

  if (!user_id) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 });
  }

  try {
    // Get or create credits record
    let { data: credits, error } = await supabase
      .from('user_ai_credits')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (error && error.code === 'PGRST116') {
      // Create if doesn't exist
      const { data: newCredits, error: createError } = await supabase
        .from('user_ai_credits')
        .insert({ user_id, credits_balance: 0 })
        .select()
        .single();

      if (createError) throw createError;
      credits = newCredits;
    }

    return NextResponse.json({ credits });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Deduct credits
export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const { user_id, operation_type, operation_cost, operation_metadata } = await request.json();

    // Check balance
    const { data: userCredits, error: fetchError } = await supabase
      .from('user_ai_credits')
      .select('credits_balance')
      .eq('user_id', user_id)
      .single();

    if (fetchError || !userCredits || userCredits.credits_balance < operation_cost) {
      return NextResponse.json(
        { error: 'Insufficient credits', balance: userCredits?.credits_balance || 0 },
        { status: 402 }
      );
    }

    // Deduct credits
    const { error: updateError } = await supabase
      .from('user_ai_credits')
      .update({
        credits_balance: userCredits.credits_balance - operation_cost,
        credits_used: supabase.rpc('increment', { x: operation_cost }),
      })
      .eq('user_id', user_id);

    if (updateError) throw updateError;

    // Record transaction
    await supabase.from('ai_credit_transactions').insert({
      user_id,
      transaction_type: 'usage',
      credits_amount: -operation_cost,
      operation_type,
      operation_cost,
      operation_metadata,
    });

    return NextResponse.json({
      success: true,
      new_balance: userCredits.credits_balance - operation_cost,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
