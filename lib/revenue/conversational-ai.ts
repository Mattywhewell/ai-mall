/**
 * Conversational Commerce AI
 * 
 * Enhances AI spirits to actively sell products:
 * - Product recommendations
 * - Bundle upsells
 * - Answering questions
 * - Guiding purchase decisions
 * - Creating urgency
 */

import { getSupabaseClient } from '@/lib/supabase-server';
import { getOpenAI } from '../openai';

const openai = { chat: { completions: { create: (...args: any[]) => getOpenAI().chat.completions.create(...args) } }, embeddings: { create: (...args: any[]) => getOpenAI().embeddings.create(...args) } };

interface ConversationContext {
  userId: string;
  location: 'hall' | 'street' | 'chapel' | 'district';
  entityId: string;
  userIntent?: 'browsing' | 'searching' | 'deciding' | 'ready_to_buy';
  cartItems?: any[];
  viewHistory?: any[];
}

export class ConversationalAI {
  private get supabase() { return getSupabaseClient(); }

  /**
   * Generate conversational product recommendation
   */
  async recommendProducts(context: ConversationContext): Promise<string> {
    // Get user's browsing history
    const { data: history } = await this.supabase
      .from('world_analytics')
      .select('entity_id')
      .eq('user_id', context.userId)
      .eq('metric_type', 'view')
      .order('recorded_at', { ascending: false })
      .limit(5);

    const viewedProductIds = history?.map(h => h.entity_id) || [];

    // Get products in current location
    const { data: products } = await this.supabase
      .from('products')
      .select('id, name, price, description')
      .eq('active', true)
      .limit(5);

    if (!products || products.length === 0) {
      return "I'd love to show you some amazing products, but this area is still being curated. Check back soon!";
    }

    const prompt = `You are a helpful, engaging AI shopping assistant in a luxury digital marketplace.

Context:
- User is in: ${context.location}
- User's intent: ${context.userIntent || 'browsing'}
- Recently viewed: ${viewedProductIds.length} products
- Cart has: ${context.cartItems?.length || 0} items

Available products to recommend:
${products.map(p => `- ${p.name} ($${p.price}): ${p.description?.substring(0, 100)}`).join('\n')}

Generate a conversational, personalized product recommendation (2-3 sentences) that:
1. Feels natural and human
2. Mentions 1-2 specific products
3. Highlights key benefits
4. Creates subtle urgency or desire
5. Feels helpful, not pushy

Return ONLY the recommendation text.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 200
    });

    return response.choices[0].message.content?.trim() || 
      "I'm here to help you discover something special. What are you looking for today?";
  }

  /**
   * Generate bundle upsell message
   */
  async upsellBundle(productId: string, userId: string): Promise<string | null> {
    // Get product details
    const { data: product } = await this.supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (!product) return null;

    // Find bundles containing this product
    const { data: bundles } = await this.supabase
      .from('product_bundles')
      .select('*')
      .contains('product_ids', [productId])
      .eq('active', true)
      .limit(1);

    if (!bundles || bundles.length === 0) return null;

    const bundle = bundles[0];
    const savings = bundle.original_price - bundle.bundle_price;

    const prompt = `You're a helpful AI assistant suggesting a bundle to a customer who's viewing: ${product.name} ($${product.price})

Bundle Available: ${bundle.name}
Bundle includes: ${bundle.product_ids.length} products
Original total: $${bundle.original_price}
Bundle price: $${bundle.bundle_price}
You save: $${savings} (${bundle.discount_percentage}% off)

Generate a compelling, conversational upsell message (2-3 sentences) that:
1. Feels natural, not salesy
2. Highlights the value and savings
3. Explains why these products work well together
4. Creates subtle urgency
5. Includes a clear CTA

Return ONLY the upsell message.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 150
    });

    return response.choices[0].message.content?.trim();
  }

  /**
   * Answer product questions
   */
  async answerQuestion(question: string, productId: string): Promise<string> {
    const { data: product } = await this.supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (!product) {
      return "I don't have information about that product right now. Can I help you find something else?";
    }

    const prompt = `You're a knowledgeable product expert. Answer this customer question:

Question: ${question}

Product Context:
- Name: ${product.name}
- Price: $${product.price}
- Description: ${product.description}
- Category: ${product.category}

Provide a helpful, accurate answer (2-3 sentences) that:
1. Directly addresses their question
2. Builds confidence in the product
3. Highlights value
4. Encourages purchase if appropriate

If you don't have enough information, say so honestly and offer to help differently.

Return ONLY the answer.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 200
    });

    return response.choices[0].message.content?.trim() || 
      "That's a great question! Let me help you find more details.";
  }

  /**
   * Guide purchase decision
   */
  async guidePurchaseDecision(userId: string, hesitationReason?: string): Promise<string> {
    const { data: cartItems } = await this.supabase
      .from('world_analytics')
      .select('entity_id')
      .eq('user_id', userId)
      .eq('metric_type', 'engagement')
      .order('recorded_at', { ascending: false })
      .limit(3);

    const prompt = `You're a supportive shopping assistant helping someone who seems hesitant to complete their purchase.

Hesitation reason: ${hesitationReason || 'general uncertainty'}
Items they're considering: ${cartItems?.length || 0} products

Generate a supportive, confidence-building message (2-3 sentences) that:
1. Addresses their hesitation empathetically
2. Provides reassurance (quality, value, satisfaction guarantee)
3. Creates gentle urgency without pressure
4. Makes checkout feel easy and safe
5. Feels like advice from a friend

Return ONLY the message.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 150
    });

    return response.choices[0].message.content?.trim() || 
      "I understand you want to make the right choice. These products are carefully curated for quality. Would you like to know more about any of them?";
  }

  /**
   * Create urgency messages
   */
  async createUrgency(productId: string): Promise<string | null> {
    // Check product performance to determine urgency type
    const { data: analytics } = await this.supabase
      .from('world_analytics')
      .select('metric_type')
      .eq('entity_id', productId)
      .gte('recorded_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const viewsToday = analytics?.filter(a => a.metric_type === 'view').length || 0;
    const purchasesToday = analytics?.filter(a => a.metric_type === 'conversion').length || 0;

    if (viewsToday < 10) return null; // Not trending enough for urgency

    const urgencyTypes = [
      `${viewsToday} people have viewed this today`,
      `${purchasesToday} sold in the last 24 hours`,
      'Trending in your district right now',
      'Limited availability - popular item',
      'Others in this Hall are viewing this'
    ];

    return urgencyTypes[Math.floor(Math.random() * urgencyTypes.length)];
  }

  /**
   * Smart checkout nudge
   */
  async generateCheckoutNudge(userId: string, cartValue: number): Promise<string> {
    const prompt = `You're a friendly AI assistant noticing someone has items in their cart but hasn't checked out.

Cart value: $${cartValue.toFixed(2)}
User behavior: Browsing but not completing purchase

Generate a gentle, non-pushy checkout reminder (1-2 sentences) that:
1. Acknowledges their selections positively
2. Makes checkout feel easy
3. Mentions any benefit (save cart, fast checkout, etc.)
4. Feels helpful, not desperate

Return ONLY the nudge message.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 100
    });

    return response.choices[0].message.content?.trim() || 
      "Ready to complete your order? Checkout is quick and secure!";
  }
}

export const conversationalAI = new ConversationalAI();
