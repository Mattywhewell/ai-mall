/**
 * Automatic Product Bundling Engine
 * 
 * Generates revenue-optimizing bundles:
 * - Perfect Pairings (frequently bought together)
 * - District Bundles (themed collections)
 * - Seasonal Ritual Kits
 * - AI-Curated Collections
 * 
 * Increases AOV and creates new revenue streams
 */

import { getSupabaseClient } from '@/lib/supabase-server';
import { getOpenAI } from '../openai';

const openai = { chat: { completions: { create: (...args: any[]) => getOpenAI().chat.completions.create(...args) } }, embeddings: { create: (...args: any[]) => getOpenAI().embeddings.create(...args) } };

interface BundleCandidate {
  products: string[];
  score: number;
  reason: string;
  type: 'pairing' | 'district' | 'seasonal' | 'curated';
}

export class BundlingEngine {
  private get supabase() { return getSupabaseClient(); }

  /**
   * Find products frequently bought together
   */
  async findFrequentPairings(): Promise<BundleCandidate[]> {
    // Analyze purchase patterns
    const { data: orders } = await this.supabase
      .from('world_analytics')
      .select('user_id, entity_id, session_id')
      .eq('metric_type', 'conversion')
      .gte('recorded_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

    if (!orders) return [];

    // Group by session to find products bought together
    const sessions: Record<string, string[]> = {};
    orders.forEach(order => {
      if (!sessions[order.session_id]) {
        sessions[order.session_id] = [];
      }
      sessions[order.session_id].push(order.entity_id);
    });

    // Find product pairs
    const pairCounts: Record<string, number> = {};
    Object.values(sessions).forEach(products => {
      if (products.length < 2) return;
      
      for (let i = 0; i < products.length; i++) {
        for (let j = i + 1; j < products.length; j++) {
          const pair = [products[i], products[j]].sort().join('|');
          pairCounts[pair] = (pairCounts[pair] || 0) + 1;
        }
      }
    });

    // Convert to bundle candidates
    const candidates: BundleCandidate[] = Object.entries(pairCounts)
      .filter(([, count]) => count >= 3) // Minimum 3 co-purchases
      .map(([pair, count]) => ({
        products: pair.split('|'),
        score: count * 10,
        reason: `Purchased together ${count} times in last 90 days`,
        type: 'pairing' as const
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    return candidates;
  }

  /**
   * Create district-themed bundles
   */
  async generateDistrictBundles(): Promise<BundleCandidate[]> {
    const { data: districts } = await this.supabase
      .from('microstores')
      .select('id, name, category');

    if (!districts) return [];

    const candidates: BundleCandidate[] = [];

    for (const district of districts) {
      // Get top 3-5 products from this district
      const { data: products } = await this.supabase
        .from('products')
        .select('id, name, price, display_priority')
        .eq('microstore_id', district.id)
        .eq('active', true)
        .order('display_priority', { ascending: false })
        .limit(4);

      if (products && products.length >= 3) {
        candidates.push({
          products: products.map(p => p.id),
          score: 70,
          reason: `Curated collection from ${district.name}`,
          type: 'district'
        });
      }
    }

    return candidates;
  }

  /**
   * Generate seasonal bundles using AI
   */
  async generateSeasonalBundles(): Promise<BundleCandidate[]> {
    const season = this.getCurrentSeason();
    
    // Get all products
    const { data: products } = await this.supabase
      .from('products')
      .select('id, name, description, category, tags')
      .eq('active', true)
      .limit(100);

    if (!products) return [];

    // Use AI to find seasonal combinations
    const prompt = `Create 5 seasonal product bundles for ${season}.

Available Products:
${products.slice(0, 20).map(p => `- ${p.name} (${p.category})`).join('\n')}

For each bundle:
1. Choose 3-4 products that work well together for ${season}
2. Give it a compelling name
3. Explain why these products complement each other

Return as JSON array:
[
  {
    "name": "Bundle Name",
    "products": ["Product Name 1", "Product Name 2", "Product Name 3"],
    "reason": "Why these work together"
  }
]`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 1000
    });

    const aiBundles = JSON.parse(response.choices[0].message.content || '[]');

    // Convert to bundle candidates
    const candidates: BundleCandidate[] = [];
    for (const bundle of aiBundles) {
      const productIds = bundle.products
        .map((name: string) => products.find(p => p.name === name)?.id)
        .filter(Boolean);

      if (productIds.length >= 3) {
        candidates.push({
          products: productIds,
          score: 75,
          reason: bundle.reason,
          type: 'seasonal'
        });
      }
    }

    return candidates;
  }

  /**
   * Generate AI-curated collections
   */
  async generateCuratedCollections(): Promise<BundleCandidate[]> {
    const themes = [
      'Wellness Essentials',
      'Tech Enthusiast Pack',
      'Creative Starter Kit',
      'Mindful Living Collection',
      'Innovation Bundle'
    ];

    const candidates: BundleCandidate[] = [];

    for (const theme of themes) {
      // Get products matching theme
      const { data: products } = await this.supabase
        .from('products')
        .select('id, name, description, tags')
        .eq('active', true)
        .limit(50);

      if (!products) continue;

      // Use AI to select products for this theme
      const prompt = `Select 4 products that best fit the theme: "${theme}"

Available Products:
${products.slice(0, 15).map(p => `- ${p.name}: ${p.description?.substring(0, 100)}`).join('\n')}

Return product names as JSON array: ["Product 1", "Product 2", "Product 3", "Product 4"]`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 200
      });

      const selectedNames = JSON.parse(response.choices[0].message.content || '[]');
      const productIds = selectedNames
        .map((name: string) => products.find(p => p.name === name)?.id)
        .filter(Boolean);

      if (productIds.length >= 3) {
        candidates.push({
          products: productIds,
          score: 80,
          reason: `AI-curated ${theme}`,
          type: 'curated'
        });
      }
    }

    return candidates;
  }

  /**
   * Create bundle in database
   */
  async createBundle(candidate: BundleCandidate): Promise<string> {
    // Get product details
    const { data: products } = await this.supabase
      .from('products')
      .select('*')
      .in('id', candidate.products);

    if (!products) throw new Error('Products not found');

    const totalPrice = products.reduce((sum, p) => sum + p.price, 0);
    const discountedPrice = totalPrice * 0.85; // 15% bundle discount

    // Generate bundle name and description
    const bundleName = await this.generateBundleName(products, candidate.type);
    const bundleDescription = await this.generateBundleDescription(products, candidate.reason);

    // Create bundle
    const { data: bundle } = await this.supabase
      .from('product_bundles')
      .insert({
        name: bundleName,
        description: bundleDescription,
        product_ids: candidate.products,
        original_price: totalPrice,
        bundle_price: discountedPrice,
        discount_percentage: 15,
        bundle_type: candidate.type,
        ai_generated: true,
        active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    console.log(`✅ Created bundle: ${bundleName} ($${discountedPrice.toFixed(2)})`);
    return bundle.id;
  }

  /**
   * Generate bundle name
   */
  async generateBundleName(products: any[], type: string): Promise<string> {
    const productNames = products.map(p => p.name).join(', ');
    
    const prompt = `Create a compelling bundle name for these products:
${productNames}

Bundle type: ${type}

The name should be:
- 2-5 words
- Catchy and memorable
- Convey value
- Appeal to emotions

Return ONLY the bundle name.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 50
    });

    return response.choices[0].message.content?.trim() || `${type} Bundle`;
  }

  /**
   * Generate bundle description
   */
  async generateBundleDescription(products: any[], reason: string): Promise<string> {
    const productList = products.map(p => `- ${p.name} ($${p.price})`).join('\n');
    
    const prompt = `Write a compelling 2-3 sentence description for this product bundle.

Products:
${productList}

Why they work together: ${reason}

The description should:
- Highlight value
- Create desire
- Emphasize the discount/savings
- Be conversion-focused

Return ONLY the description.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 150
    });

    return response.choices[0].message.content?.trim() || 'Save on this curated collection.';
  }

  /**
   * Run automatic bundle generation
   */
  async runBundleGeneration(): Promise<void> {
    console.log('🎁 Starting automatic bundle generation...');

    const allCandidates: BundleCandidate[] = [
      ...await this.findFrequentPairings(),
      ...await this.generateDistrictBundles(),
      ...await this.generateSeasonalBundles(),
      ...await this.generateCuratedCollections()
    ];

    console.log(`Found ${allCandidates.length} bundle candidates`);

    // Create top bundles
    const topCandidates = allCandidates
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);

    for (const candidate of topCandidates) {
      try {
        await this.createBundle(candidate);
      } catch (error) {
        console.error('Error creating bundle:', error);
      }
    }

    console.log('✅ Bundle generation complete');
  }

  /**
   * Get current season
   */
  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Fall';
    return 'Winter';
  }
}

export const bundlingEngine = new BundlingEngine();
