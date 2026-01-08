import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '../../../lib/openai';
import { getSupabaseClient } from '@/lib/supabase-server';

// GET - Get or create user's shopping agent
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Check if agent exists
    const supabase = getSupabaseClient();
    let { data: agent, error } = await supabase
      .from('shopping_agents')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Create agent if doesn't exist
    if (!agent) {
      const newAgent = {
        user_id: userId,
        agent_name: 'Your Shopping Assistant',
        personality: 'helpful',
        style_preferences: {},
        budget_range: {},
        favorite_categories: [],
        color_preferences: [],
      };

      const { data: created, error: createError } = await supabase
        .from('shopping_agents')
        .insert([newAgent])
        .select()
        .single();

      if (createError) throw createError;
      agent = created;
    }

    // Get recent recommendations
    const { data: recommendations } = await supabase
      .from('agent_recommendations')
      .select(`
        *,
        product:creator_products (
          id,
          name,
          description,
          price,
          images,
          creator:creator_storefronts (
            brand_name,
            slug
          )
        )
      `)
      .eq('agent_id', agent.id)
      .eq('viewed', false)
      .order('recommended_at', { ascending: false })
      .limit(6);

    return NextResponse.json({ agent, recommendations: recommendations || [] });
  } catch (error) {
    console.error('Error fetching agent:', error);
    return NextResponse.json({ error: 'Failed to fetch agent' }, { status: 500 });
  }
}

// POST - Chat with AI agent
export async function POST(req: NextRequest) {
  try {
    // Debug: log incoming request
    const body = await req.json();
    const { userId, message, context } = body;
    console.log('AI Concierge POST received', { userId, hasMessage: !!message, contextKeys: context ? Object.keys(context) : null });

    if (!userId || !message) {
      console.warn('AI Concierge missing userId or message', { userId, message });
      return NextResponse.json({ error: 'User ID and message required' }, { status: 400 });
    }

    // Get or create agent
    const supabase = getSupabaseClient();
    let { data: agent } = await supabase
      .from('shopping_agents')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!agent) {
      const { data: created, error: createErr } = await supabase
        .from('shopping_agents')
        .insert([{
          user_id: userId,
          agent_name: 'Your Shopping Assistant',
          personality: 'helpful',
        }])
        .select()
        .single();
      if (createErr) {
        console.error('Error creating shopping_agent', createErr);
        throw createErr;
      }
      agent = created;
    }

    // Get conversation history
    const { data: history } = await supabase
      .from('agent_conversations')
      .select('*')
      .eq('agent_id', agent.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Build conversation context
    const conversationHistory = history?.reverse().map(h => ({
      role: h.message_type === 'user' ? 'user' : 'assistant',
      content: h.message
    })) || [];

    // Create system prompt based on agent personality and learned preferences
    const systemPrompt = `You are ${agent.agent_name}, a personal shopping assistant in AI City marketplace. \nYour personality is ${agent.personality}.\n\nUser's preferences:\n- Favorite categories: ${agent.favorite_categories.join(', ') || 'Not yet learned'}\n- Color preferences: ${agent.color_preferences.join(', ') || 'Not yet learned'}\n- Budget range: ${JSON.stringify(agent.budget_range) || 'Not specified'}\n\nBe conversational, helpful, and proactive. Ask questions to learn more about the user's style.\nSuggest products from our creator marketplace. Be enthusiastic about discoveries.\nKeep responses concise (2-3 sentences unless asked for details).`;

    // Get AI response (use configured model if present)
    let client;
    try {
      client = getOpenAI();
    } catch (err) {
      console.error('OpenAI initialization error', err);
      throw err;
    }

    const modelToUse = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    console.log('Using OpenAI model:', modelToUse);

    let completion;
    try {
      completion = await client.chat.completions.create({
        model: modelToUse,
        messages: [
          { role: 'system' as const, content: systemPrompt },
          ...conversationHistory as any,
          { role: 'user' as const, content: message }
        ],
        temperature: 0.8,
        max_tokens: 300,
      });
    } catch (err) {
      console.error('OpenAI completion error', err);
      throw err;
    }

    const aiResponse = completion.choices[0].message.content;

    // Save conversation
    await supabase.from('agent_conversations').insert([
      {
        agent_id: agent.id,
        user_id: userId,
        message_type: 'user',
        message: message,
        context: context || {},
      },
      {
        agent_id: agent.id,
        user_id: userId,
        message_type: 'agent',
        message: aiResponse,
      }
    ]);

    // Update agent activity
    await supabase
      .from('shopping_agents')
      .update({
        total_interactions: agent.total_interactions + 1,
        last_active_at: new Date().toISOString(),
      })
      .eq('id', agent.id);

    // Analyze intent and suggest products if shopping-related
    const intent = analyzeIntent(message);
    let productSuggestions: any[] = [];

    if (intent.isShoppingIntent) {
      // Search for relevant products
      const { data: products } = await supabase
        .from('creator_products')
        .select(`
          *,
          creator:creator_storefronts (
            brand_name,
            slug,
            rating
          )
        `)
        .eq('status', 'published')
        .limit(3);

      if (products && products.length > 0) {
        productSuggestions = products;

        // Create recommendations
        for (const product of products) {
          await supabase.from('agent_recommendations').insert([{
            agent_id: agent.id,
            user_id: userId,
            product_id: product.id,
            reason: `Based on your interest in ${intent.categories.join(', ')}`,
            confidence_score: 0.75,
            personalization_factors: {
              intent_match: true,
              categories: intent.categories,
            }
          }]);
        }
      }
    }

    return NextResponse.json({
      response: aiResponse,
      products: productSuggestions,
      intent: intent,
    });
  } catch (error) {
    console.error('Error in agent chat:', error);
    const debug = error && ((error as any).message || JSON.stringify(error));
    return NextResponse.json({ error: 'Failed to process chat', debug }, { status: 500 });
  }
}

// PUT - Update agent preferences
export async function PUT(req: NextRequest) {
  try {
    const { userId, preferences } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const updates: any = {};
    
    if (preferences.style_preferences) {
      updates.style_preferences = preferences.style_preferences;
    }
    if (preferences.budget_range) {
      updates.budget_range = preferences.budget_range;
    }
    if (preferences.favorite_categories) {
      updates.favorite_categories = preferences.favorite_categories;
    }
    if (preferences.color_preferences) {
      updates.color_preferences = preferences.color_preferences;
    }
    if (preferences.agent_name) {
      updates.agent_name = preferences.agent_name;
    }
    if (preferences.personality) {
      updates.personality = preferences.personality;
    }

    const { data: agent, error } = await supabase
      .from('shopping_agents')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    // Log learning event
    await supabase.from('agent_learning_events').insert([{
      agent_id: agent.id,
      event_type: 'style_quiz',
      event_data: preferences,
      learned_insight: 'User updated preferences',
      confidence_change: 0.10,
    }]);

    return NextResponse.json({ agent });
  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 });
  }
}

// Helper: Analyze user intent
function analyzeIntent(message: string): {
  isShoppingIntent: boolean;
  categories: string[];
  priceRange?: string;
  urgency?: string;
} {
  const lowerMessage = message.toLowerCase();
  
  const shoppingKeywords = ['looking for', 'need', 'want', 'buy', 'shop', 'find', 'search', 'show me', 'recommend'];
  const isShoppingIntent = shoppingKeywords.some(keyword => lowerMessage.includes(keyword));

  const categoryMap: Record<string, string[]> = {
    fashion: ['clothes', 'dress', 'shirt', 'pants', 'shoes', 'outfit', 'fashion'],
    jewelry: ['necklace', 'ring', 'bracelet', 'earrings', 'jewelry'],
    home: ['home', 'decor', 'furniture', 'candle', 'pillow'],
    beauty: ['skincare', 'makeup', 'beauty', 'cosmetic'],
    tech: ['tech', 'gadget', 'electronic'],
    art: ['art', 'painting', 'print', 'poster'],
  };

  const categories: string[] = [];
  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      categories.push(category);
    }
  }

  return {
    isShoppingIntent,
    categories,
  };
}
