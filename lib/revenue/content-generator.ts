/**
 * Autonomous Content Generation Engine
 * 
 * Automatically generates and optimizes:
 * - Product descriptions
 * - SEO metadata
 * - Social media posts
 * - Product tags
 * - Bundle descriptions
 * 
 * Uses AI to increase conversion and organic traffic
 */

import { getSupabaseClient } from '@/lib/supabase-server';
import { getOpenAI } from '../openai';

const openai = {
  chat: { completions: { create: (...args: any[]) => getOpenAI().chat.completions.create(...args) } },
  embeddings: { create: (...args: any[]) => getOpenAI().embeddings.create(...args) },
};

export class ContentGenerator {
  private get supabase() { return getSupabaseClient(); }

  /**
   * Rewrite product description based on performance data
   */
  async optimizeProductDescription(productId: string): Promise<string> {
    // Get product data
    const { data: product } = await this.supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (!product) throw new Error('Product not found');

    // Get performance data
    const { data: analytics } = await this.supabase
      .from('world_analytics')
      .select('metric_type, metric_value')
      .eq('entity_id', productId)
      .gte('recorded_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const views = analytics?.filter(a => a.metric_type === 'view').length || 0;
    const purchases = analytics?.filter(a => a.metric_type === 'conversion').length || 0;
    const conversionRate = views > 0 ? (purchases / views) * 100 : 0;

    // Generate optimized description
    const prompt = `You are an expert e-commerce copywriter. Rewrite this product description to maximize conversion.

Product: ${product.name}
Current Description: ${product.description}
Price: $${product.price}
Category: ${product.category || 'General'}
Current Conversion Rate: ${conversionRate.toFixed(2)}%

Generate a compelling product description that:
1. Highlights key benefits and features
2. Uses persuasive language and emotional triggers
3. Includes social proof or urgency where appropriate
4. Is 2-3 paragraphs, scannable, and conversion-focused
5. Matches the premium tone of an AI-native marketplace

Return ONLY the new description text.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 300
    });

    const newDescription = response.choices[0].message.content?.trim() || product.description;

    // Save new description
    await this.supabase
      .from('products')
      .update({
        description: newDescription,
        description_optimized_at: new Date().toISOString(),
        previous_description: product.description
      })
      .eq('id', productId);

    console.log(`✅ Optimized description for ${product.name}`);
    return newDescription;
  }

  /**
   * Generate SEO metadata for a product
   */
  async generateSEOMetadata(productId: string): Promise<{ title: string; description: string; keywords: string[] }> {
    const { data: product } = await this.supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (!product) throw new Error('Product not found');

    const prompt = `Generate SEO-optimized metadata for this product:

Product: ${product.name}
Description: ${product.description}
Category: ${product.category || 'General'}
Price: $${product.price}

Generate:
1. SEO Title (50-60 characters, compelling, includes primary keyword)
2. Meta Description (150-160 characters, includes CTA)
3. Keywords (10-15 relevant keywords/phrases)

Return as JSON:
{
  "title": "...",
  "description": "...",
  "keywords": ["...", "..."]
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 400
    });

    const metadata = JSON.parse(response.choices[0].message.content || '{}');

    // Save metadata
    await this.supabase
      .from('products')
      .update({
        seo_title: metadata.title,
        seo_description: metadata.description,
        seo_keywords: metadata.keywords,
        seo_updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    console.log(`✅ Generated SEO metadata for ${product.name}`);
    return metadata;
  }

  /**
   * Generate social media content for a product
   */
  async generateSocialContent(productId: string): Promise<{ posts: any[] }> {
    const { data: product } = await this.supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (!product) throw new Error('Product not found');

    const prompt = `Create 3 social media posts for this product:

Product: ${product.name}
Description: ${product.description}
Price: $${product.price}

Generate posts for:
1. Instagram (engaging, visual, with hashtags)
2. Twitter/X (concise, compelling, with link)
3. LinkedIn (professional, value-focused)

Return as JSON array:
[
  {
    "platform": "instagram",
    "content": "...",
    "hashtags": ["...", "..."]
  },
  ...
]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 600
    });

    const posts = JSON.parse(response.choices[0].message.content || '[]');

    // Save to social_content table
    for (const post of posts) {
      await this.supabase
        .from('social_content')
        .insert({
          product_id: productId,
          platform: post.platform,
          content: post.content,
          hashtags: post.hashtags || [],
          status: 'draft',
          created_at: new Date().toISOString()
        });
    }

    console.log(`✅ Generated ${posts.length} social posts for ${product.name}`);
    return { posts };
  }

  /**
   * Auto-tag products using semantic analysis
   */
  async autoTagProduct(productId: string): Promise<string[]> {
    const { data: product } = await this.supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (!product) throw new Error('Product not found');

    const prompt = `Analyze this product and generate relevant tags:

Product: ${product.name}
Description: ${product.description}
Category: ${product.category || 'General'}

Generate 8-12 relevant tags that would help:
1. Search discoverability
2. Product recommendations
3. Category organization
4. User filtering

Include both general and specific tags. Return as JSON array: ["tag1", "tag2", ...]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 200
    });

    const tags = JSON.parse(response.choices[0].message.content || '[]');

    // Save tags
    await this.supabase
      .from('products')
      .update({
        tags: tags,
        tags_updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    console.log(`✅ Auto-tagged ${product.name} with ${tags.length} tags`);
    return tags;
  }

  /**
   * Generate bundle description
   */
  async generateBundleDescription(bundleName: string, productIds: string[]): Promise<string> {
    // Get products in bundle
    const { data: products } = await this.supabase
      .from('products')
      .select('name, description, price')
      .in('id', productIds);

    if (!products) return '';

    const totalValue = products.reduce((sum, p) => sum + p.price, 0);

    const prompt = `Create a compelling bundle description:

Bundle Name: ${bundleName}
Products in Bundle:
${products.map(p => `- ${p.name} ($${p.price})`).join('\n')}

Total Value: $${totalValue}

Write a 2-3 sentence description that:
1. Highlights the value proposition
2. Explains why these products go well together
3. Creates urgency or desire
4. Is conversion-focused

Return ONLY the description text.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 200
    });

    return response.choices[0].message.content?.trim() || '';
  }

  /**
   * Run weekly content optimization
   */
  async runWeeklyContentOptimization(): Promise<void> {
    console.log('📝 Starting weekly content optimization...');

    // Get all products
    const { data: products } = await this.supabase
      .from('products')
      .select('id, name, description_optimized_at')
      .order('created_at', { ascending: false });

    if (!products) return;

    let optimized = 0;

    for (const product of products) {
      // Only optimize if not optimized in last 30 days
      const lastOptimized = product.description_optimized_at 
        ? new Date(product.description_optimized_at)
        : new Date(0);
      
      const daysSinceOptimization = (Date.now() - lastOptimized.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceOptimization > 30) {
        await this.optimizeProductDescription(product.id);
        await this.generateSEOMetadata(product.id);
        await this.autoTagProduct(product.id);
        optimized++;

        // Rate limit to avoid API overuse
        if (optimized % 10 === 0) {
          console.log(`  Optimized ${optimized} products...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    console.log(`✅ Content optimization complete: ${optimized} products updated`);
  }
}

export const contentGenerator = new ContentGenerator();
