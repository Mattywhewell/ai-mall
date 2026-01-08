/**
 * Supplier Integration Engine
 * 
 * Automatically integrates new suppliers into AI City's living ecosystem.
 * When a supplier joins, AI Spirits learn their brand, products are placed
 * in appropriate streets, analytics begin tracking, and autonomous systems
 * start optimizing their presence.
 * 
 * This is the magic that makes supplier onboarding feel effortless.
 */


import { supabase } from '@/lib/supabaseClient';
import { getOpenAI } from '../openai';
import { websiteAnalyzer, WebsiteAnalysis } from './website-analyzer';
import { productScraper, ScrapedProduct } from './product-scraper';
import { getValidCJAccessToken } from '@/lib/dropshipping/get-valid-cj-token';
import { importCJProductsToDB } from '@/lib/dropshipping/import-cj-products-to-db';



interface Supplier {
  id: string;
  business_name: string;
  business_description?: string;
  category?: string;
  brand_voice?: string;
  target_audience?: string;
  website?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  tags?: string[];
  supplier_id: string;
}

interface BrandAnalysis {
  tone: string; // 'professional', 'playful', 'luxurious', 'minimalist', etc.
  personality: string; // Description of brand personality
  keywords: string[]; // Key brand themes
  target_demographic: string;
  value_proposition: string;
  recommendedHalls: string[]; // Which halls match this brand
  recommendedStreets: string[]; // Which streets match this brand
  aiSpiritAlignment: { // Which AI spirits should promote this brand
    hall?: string;
    street?: string;
    chapel?: string;
  };
}

interface PlacementRecommendation {
  productId: string;
  hall: string;
  street: string;
  district: string;
  confidence: number; // 0-1
  reasoning: string;
}

export class SupplierIntegrationEngine {
  /**
   * Main integration orchestrator
   * Called when a new supplier is registered
   */
  async integrateSupplier(supplierId: string): Promise<void> {
    console.log(`🚀 Starting integration for supplier ${supplierId}`);

    try {
      // Step 1: Fetch supplier data
      const supplier = await this.fetchSupplier(supplierId);
      if (!supplier) {
        throw new Error('Supplier not found');
      }

      // Step 1A: If supplier is a dropshipping partner (CJdropshipping), ensure valid access token for autolisting
      if (supplier.category && supplier.category.toLowerCase().includes('dropship')) {
        console.log('🔑 Ensuring valid CJdropshipping access token for autolisting...');
        try {
          const cjToken = await getValidCJAccessToken(supplierId);
          console.log('✅ Valid CJdropshipping token ready for supplier.');
        } catch (err) {
          console.error('❌ Failed to ensure valid CJdropshipping token:', err);
        }
      }

      // Step 1.5: Analyze website if provided (magical! ✨)
      let websiteAnalysis: WebsiteAnalysis | null = null;
      if (supplier.website) {
        console.log('🌐 Analyzing supplier website...');
        websiteAnalysis = await websiteAnalyzer.analyzeWebsite(supplier.website);
        if (websiteAnalysis) {
          console.log('✅ Website analysis complete!');
          // Store website analysis
          await this.storeWebsiteAnalysis(supplierId, websiteAnalysis);
        }
      }

      // Step 1.75: Auto-import products from website or CJdropshipping (ULTIMATE AUTOMATION! 🚀)
      let importResult = { productsImported: 0, errors: [] as string[] };
      if (supplier.category && supplier.category.toLowerCase().includes('dropship')) {
        console.log('🔍 Auto-importing products from CJdropshipping...');
        importResult = await importCJProductsToDB(supplierId);
        console.log(`📦 Imported ${importResult.productsImported} dropship products automatically!`);
      } else if (supplier.website && websiteAnalysis) {
        console.log('🔍 Auto-importing products from website...');
        importResult = await this.autoImportProducts(
          supplier.website,
          supplierId,
          websiteAnalysis
        );
        console.log(`📦 Imported ${importResult.productsImported} products automatically!`);
      }

      // Step 2: Analyze brand with AI (enhanced with website data)
      console.log('🧠 Analyzing brand...');
      const brandAnalysis = await this.analyzeBrand(supplier, websiteAnalysis);

      // Step 3: Store brand analysis
      await this.storeBrandAnalysis(supplierId, brandAnalysis);

      // Step 4: Fetch supplier's products
      const products = await this.fetchSupplierProducts(supplierId);

      if (products.length === 0) {
        console.log('⚠️ No products yet. Integration will complete when products are added.');
        return;
      }

      // Step 5: Auto-place products in appropriate locations
      console.log('📍 Placing products in city...');
      const placements = await this.recommendPlacements(products, brandAnalysis);
      await this.applyPlacements(placements);

      // Step 6: Update AI Spirits to recognize this brand
      console.log('✨ Training AI Spirits...');
      await this.trainAISpirits(supplierId, brandAnalysis);

      // Step 7: Generate initial content (descriptions, SEO, social)
      console.log('📝 Generating initial content...');
      await this.generateInitialContent(products, brandAnalysis);

      // Step 8: Create initial product bundles
      console.log('📦 Creating product bundles...');
      await this.createInitialBundles(products, brandAnalysis);

      // Step 9: Set up analytics tracking
      console.log('📊 Setting up analytics...');
      await this.setupAnalytics(supplierId, products);

      // Step 10: Add to autonomous job queues
      console.log('🤖 Scheduling autonomous optimization...');
      await this.scheduleAutonomousJobs(supplierId, products);

      // Step 11: Update world popularity scores
      console.log('🌆 Updating world state...');
      await this.updateWorldState(placements);

      // Mark integration complete
      await this.markIntegrationComplete(supplierId);

      console.log(`✅ Integration complete for ${supplier.business_name}`);
    } catch (error) {
      console.error('❌ Integration failed:', error);
      await this.markIntegrationFailed(supplierId, error);
      throw error;
    }
  }

  /**
   * Analyze supplier's brand using AI (enhanced with website data)
   */
  private async analyzeBrand(
    supplier: Supplier, 
    websiteAnalysis: WebsiteAnalysis | null = null
  ): Promise<BrandAnalysis> {
    // If we have website analysis, use it to enrich the prompt
    const websiteContext = websiteAnalysis ? `

Website Analysis (magical insights! ✨):
- Brand Tone: ${websiteAnalysis.brandTone}
- Personality: ${websiteAnalysis.brandPersonality}
- Product Style: ${websiteAnalysis.productStyle.join(', ')}
- Core Values: ${websiteAnalysis.coreValues.join(', ')}
- Visual Theme: ${websiteAnalysis.visualTheme.mood} ${websiteAnalysis.visualTheme.aesthetic}
- Target Audience: ${websiteAnalysis.targetAudience}
- Keywords: ${websiteAnalysis.contentKeywords.join(', ')}
` : '';

    const prompt = `Analyze this business brand for AI City integration:

Business Name: ${supplier.business_name}
Description: ${supplier.business_description || 'Not provided'}
Category: ${supplier.category || 'General'}
Target Audience: ${supplier.target_audience || 'General public'}
${websiteContext}

AI City has these spaces:
HALLS: Innovation Hall (tech, future), Wellness Garden (health, balance), Craft Sanctuary (handmade, artisan), Motion Plaza (fitness, sports), Light Hall (fashion, beauty)
STREETS: Neon Boulevard (urban tech), Artisan Row (handcrafted), Wellness Way (health products), Tech Corridor (gadgets), Vintage Lane (classic goods)

Analyze and return JSON:
{
  "tone": "brand voice tone",
  "personality": "2-sentence brand personality",
  "keywords": ["key", "brand", "themes"],
  "target_demographic": "who this appeals to",
  "value_proposition": "what makes them special",
  "recommendedHalls": ["hall names that match"],
  "recommendedStreets": ["street names that match"],
  "aiSpiritAlignment": {
    "hall": "which hall spirit should promote",
    "street": "which street spirit should promote"
  }
}`;

    try {
      const client = getOpenAI();
      const response = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert brand analyst. Return only valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const content = response.choices[0].message.content?.trim() || '{}';
      return JSON.parse(content);
    } catch (error) {
      console.error('Error analyzing brand:', error);
      // Fallback
      return {
        tone: 'professional',
        personality: 'A quality brand serving customers',
        keywords: [supplier.category || 'products'],
        target_demographic: 'general consumers',
        value_proposition: 'Quality products',
        recommendedHalls: ['Innovation Hall'],
        recommendedStreets: ['Neon Boulevard'],
        aiSpiritAlignment: {}
      };
    }
  }

  /**
   * Recommend optimal placements for products
   */
  private async recommendPlacements(
    products: Product[],
    brandAnalysis: BrandAnalysis
  ): Promise<PlacementRecommendation[]> {
    // Fetch available districts
    const { data: districts } = await supabase
      .from('microstores')
      .select('id, name, slug, category');

    if (!districts || districts.length === 0) {
      throw new Error('No districts available for placement');
    }

    // Use AI to match products to districts
    const placements: PlacementRecommendation[] = [];

    for (const product of products) {
      const prompt = `Match this product to the best district:

Product: ${product.name}
Description: ${product.description}
Category: ${product.category}
Brand Tone: ${brandAnalysis.tone}
Brand Keywords: ${brandAnalysis.keywords.join(', ')}

Available Districts:
${districts.map(d => `- ${d.name} (${d.category})`).join('\n')}

Return JSON with ONLY the district name:
{"district": "exact district name"}`;

      try {
        const client = getOpenAI();
        const response = await client.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 100
        });

        const content = response.choices[0].message.content?.trim() || '{}';
        const result = JSON.parse(content);
        
        const matchedDistrict = districts.find(d => d.name === result.district);
        
        if (matchedDistrict) {
          placements.push({
            productId: product.id,
            hall: brandAnalysis.recommendedHalls[0] || 'Innovation Hall',
            street: brandAnalysis.recommendedStreets[0] || 'Neon Boulevard',
            district: matchedDistrict.slug,
            confidence: 0.8,
            reasoning: `Best fit based on product category and brand alignment`
          });
        }
      } catch (error) {
        console.error(`Error placing product ${product.name}:`, error);
        // Default placement
        if (districts.length > 0) {
          placements.push({
            productId: product.id,
            hall: brandAnalysis.recommendedHalls[0] || 'Innovation Hall',
            street: brandAnalysis.recommendedStreets[0] || 'Neon Boulevard',
            district: districts[0].slug,
            confidence: 0.5,
            reasoning: 'Default placement'
          });
        }
      }
    }

    return placements;
  }

  /**
   * Apply placements to products
   */
  private async applyPlacements(placements: PlacementRecommendation[]): Promise<void> {
    for (const placement of placements) {
      // Find district ID
      const { data: district } = await supabase
        .from('microstores')
        .select('id')
        .eq('slug', placement.district)
        .single();

      if (district) {
        // Update product with microstore_id
        await supabase
          .from('products')
          .update({ microstore_id: district.id })
          .eq('id', placement.productId);

        // Log placement
        await supabase.from('world_analytics').insert({
          user_id: 'system',
          layer_type: 'product',
          entity_id: placement.productId,
          metric_type: 'placement',
          metric_value: placement.confidence,
          metadata: {
            district: placement.district,
            hall: placement.hall,
            street: placement.street,
            reasoning: placement.reasoning
          }
        });
      }
    }
  }

  /**
   * Train AI Spirits to recognize and promote this brand
   */
  private async trainAISpirits(
    supplierId: string,
    brandAnalysis: BrandAnalysis
  ): Promise<void> {
    // Update relevant AI spirits with brand knowledge
    const spiritUpdates = [
      {
        entity_type: 'hall',
        entity_name: brandAnalysis.aiSpiritAlignment.hall,
        knowledge: {
          supplier_id: supplierId,
          brand_personality: brandAnalysis.personality,
          keywords: brandAnalysis.keywords,
          tone: brandAnalysis.tone,
          learned_at: new Date().toISOString()
        }
      },
      {
        entity_type: 'street',
        entity_name: brandAnalysis.aiSpiritAlignment.street,
        knowledge: {
          supplier_id: supplierId,
          brand_personality: brandAnalysis.personality,
          keywords: brandAnalysis.keywords,
          tone: brandAnalysis.tone,
          learned_at: new Date().toISOString()
        }
      }
    ];

    for (const update of spiritUpdates) {
      if (!update.entity_name) continue;

      // Store in ai_spirits table or metadata
      await supabase.from('spirit_interactions').insert({
        spirit_id: `${update.entity_type}-${update.entity_name}`,
        user_id: supplierId,
        interaction_type: 'brand_learning',
        interaction_data: update.knowledge,
        sentiment: 'positive'
      });
    }
  }

  /**
   * Generate initial content for products
   */
  private async generateInitialContent(
    products: Product[],
    brandAnalysis: BrandAnalysis
  ): Promise<void> {
    // Queue content generation jobs for each product
    for (const product of products) {
      // This would trigger existing AI content generation
      // For now, just log the intent
      await supabase.from('world_analytics').insert({
        user_id: 'system',
        layer_type: 'product',
        entity_id: product.id,
        metric_type: 'content_generation_queued',
        metric_value: 1,
        metadata: {
          brand_tone: brandAnalysis.tone,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Create initial product bundles
   */
  private async createInitialBundles(
    products: Product[],
    brandAnalysis: BrandAnalysis
  ): Promise<void> {
    if (products.length < 3) {
      console.log('Not enough products for bundles yet');
      return;
    }

    // Create a brand collection
    const collectionName = `${products[0].name.split(' ')[0]} Collection`;
    
    await supabase.from('ai_collections').insert({
      name: collectionName,
      slug: `supplier-${products[0].supplier_id}-intro`,
      description: `Introducing ${brandAnalysis.personality}`,
      theme: 'curated',
      curator_personality: 'Welcome Curator',
      product_ids: products.slice(0, Math.min(6, products.length)).map(p => p.id),
      curation_reasoning: {
        summary: `A curated introduction to this new brand`,
        method: 'supplier_integration'
      },
      status: 'active',
      visibility: 'public'
    });
  }

  /**
   * Set up analytics tracking
   */
  private async setupAnalytics(supplierId: string, products: Product[]): Promise<void> {
    // Initialize analytics records
    for (const product of products) {
      await supabase.from('world_analytics').insert({
        user_id: 'system',
        layer_type: 'product',
        entity_id: product.id,
        metric_type: 'integration_complete',
        metric_value: 1,
        metadata: {
          supplier_id: supplierId,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Schedule autonomous optimization jobs
   */
  private async scheduleAutonomousJobs(supplierId: string, products: Product[]): Promise<void> {
    // Add to job queues (would integrate with actual job runner)
    const jobs = [
      { type: 'seo_generation', entity_id: supplierId },
      { type: 'social_content', entity_id: supplierId },
      { type: 'description_optimization', entity_ids: products.map(p => p.id) },
      { type: 'bundle_creation', entity_id: supplierId }
    ];

    for (const job of jobs) {
      await supabase.from('autonomous_jobs').insert({
        job_type: job.type,
        entity_id: job.entity_id || supplierId,
        scheduled_for: new Date().toISOString(),
        status: 'pending',
        priority: 'normal'
      });
    }
  }

  /**
   * Update world state with new supplier presence
   */
  private async updateWorldState(placements: PlacementRecommendation[]): Promise<void> {
    // Update popularity scores for affected streets/districts
    const affectedDistricts = [...new Set(placements.map(p => p.district))];
    
    for (const districtSlug of affectedDistricts) {
      // Boost district popularity slightly
      const { error: rpcError } = await supabase.rpc('update_popularity_score', {
        entity_type: 'district',
        entity_slug: districtSlug,
        boost: 2.0
      });
      
      if (rpcError && !rpcError.message?.includes('does not exist')) {
        console.log('Popularity update skipped (function not available)');
      }
    }
  }

  /**
   * Helper methods
   */
  private async fetchSupplier(supplierId: string): Promise<Supplier | null> {
    const { data } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', supplierId)
      .single();
    return data;
  }

  private async fetchSupplierProducts(supplierId: string): Promise<Product[]> {
    const { data } = await supabase
      .from('products')
      .select('id, name, description, category, price, tags, supplier_id')
      .eq('supplier_id', supplierId)
      .eq('active', true);
    return (data || []) as Product[];
  }

  private async storeBrandAnalysis(supplierId: string, analysis: BrandAnalysis): Promise<void> {
    await supabase
      .from('suppliers')
      .update({
        brand_voice: analysis.tone,
        metadata: {
          brand_analysis: analysis,
          integrated_at: new Date().toISOString()
        }
      })
      .eq('id', supplierId);
  }

  private async storeWebsiteAnalysis(supplierId: string, websiteAnalysis: WebsiteAnalysis): Promise<void> {
    await supabase
      .from('suppliers')
      .update({
        website_analysis: websiteAnalysis
      })
      .eq('id', supplierId);
  }

  /**
   * Auto-import products from supplier website (ULTIMATE FEATURE! 🚀)
   */
  private async autoImportProducts(
    websiteUrl: string,
    supplierId: string,
    websiteAnalysis: WebsiteAnalysis
  ): Promise<{ productsImported: number; errors: string[] }> {
    try {
      // Scrape products from website
      const scrapeResult = await productScraper.scrapeProducts(
        websiteUrl,
        supplierId,
        websiteAnalysis
      );

      if (!scrapeResult.success || scrapeResult.products.length === 0) {
        console.log('No products found to import');
        return { productsImported: 0, errors: scrapeResult.errors };
      }

      // Import each product into database
      let imported = 0;
      const errors: string[] = [];

      for (const scrapedProduct of scrapeResult.products) {
        try {
          // Generate enhanced description
          const description = await productScraper.generateDescription(
            scrapedProduct,
            websiteAnalysis
          );

          // Assign to optimal district
          const { districtSlug } = await productScraper.assignDistrict(
            scrapedProduct,
            websiteAnalysis
          );

          // Get district ID
          const { data: district } = await supabase
            .from('microstores')
            .select('id')
            .eq('slug', districtSlug)
            .single();

          // Normalize price
          const priceUSD = productScraper.normalizePrice(
            scrapedProduct.price,
            scrapedProduct.currency
          );

          // Create product in database
          const { error } = await supabase.from('products').insert({
            name: scrapedProduct.name,
            description: description,
            price: priceUSD,
            category: scrapedProduct.category,
            microstore_id: district?.id || null,
            supplier_id: supplierId,
            image_url: scrapedProduct.images[0] || null,
            tags: scrapedProduct.attributes ? Object.keys(scrapedProduct.attributes) : [],
            stock_quantity: scrapedProduct.inStock ? 100 : 0,
            active: true,
            metadata: {
              original_url: scrapedProduct.url,
              sku: scrapedProduct.sku,
              auto_imported: true,
              imported_at: new Date().toISOString(),
              original_images: scrapedProduct.images,
              attributes: scrapedProduct.attributes
            }
          });

          if (!error) {
            imported++;
            console.log(`✅ Imported: ${scrapedProduct.name}`);
          } else {
            errors.push(`Failed to import ${scrapedProduct.name}: ${error.message}`);
          }
        } catch (error) {
          errors.push(`Error importing ${scrapedProduct.name}: ${error}`);
        }
      }

      return { productsImported: imported, errors };
    } catch (error) {
      console.error('Auto-import error:', error);
      return { productsImported: 0, errors: [String(error)] };
    }
  }

  private async markIntegrationComplete(supplierId: string): Promise<void> {
    await supabase
      .from('suppliers')
      .update({
        integration_status: 'complete',
        integrated_at: new Date().toISOString()
      })
      .eq('id', supplierId);
  }

  private async markIntegrationFailed(supplierId: string, error: any): Promise<void> {
    await supabase
      .from('suppliers')
      .update({
        integration_status: 'failed',
        integration_error: error.message
      })
      .eq('id', supplierId);
  }
}

// Export singleton
export const supplierIntegrationEngine = new SupplierIntegrationEngine();
