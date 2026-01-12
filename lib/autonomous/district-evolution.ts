/**
 * District Evolution Engine
 * Districts adapt their themes, copy, and product mix based on user behavior
 */

import { supabase } from '../supabaseClient';
import { callOpenAI } from '../ai/openaiClient';
import { generateSEOMetadata } from '../ai/generateSEO';

export interface DistrictPersonality {
  tone: string;
  style: string;
  targetAudience: string;
  brandVoice: string;
  visualTheme: string;
}

export interface DistrictEvolutionPlan {
  current_state: any;
  proposed_changes: any;
  reasoning: string;
  confidence: number;
}

export class DistrictEvolution {
  /**
   * Analyze district performance and evolve its personality
   */
  static async evolveDistrict(districtSlug: string): Promise<boolean> {
    try {
      console.log(`🧬 Evolving district: ${districtSlug}`);

      // Fetch district data
      const { data: district } = await supabase
        .from('microstores')
        .select('*')
        .eq('slug', districtSlug)
        .single();

      if (!district) return false;

      // Analyze user behavior in this district
      const behavior = await this.analyzeUserBehavior(district.id);

      // Fetch current personality if exists
      const { data: currentPersonality } = await supabase
        .from('district_personalities')
        .select('*')
        .eq('microstore_id', district.id)
        .single();

      // Generate evolution plan using AI
      const evolutionPlan = await this.generateEvolutionPlan(
        district,
        behavior,
        currentPersonality
      );

      if (evolutionPlan.confidence < 0.7) {
        console.log(`⚠️  Low confidence (${evolutionPlan.confidence}), skipping evolution`);
        return false;
      }

      // Apply evolution
      await this.applyEvolution(district.id, districtSlug, evolutionPlan);

      console.log(`✓ District ${districtSlug} evolved successfully`);
      return true;
    } catch (error) {
      console.error('District evolution error:', error);
      return false;
    }
  }

  /**
   * Analyze user behavior in district
   */
  private static async analyzeUserBehavior(microstoreId: string): Promise<any> {
    const { data: analytics } = await supabase
      .from('analytics')
      .select('*')
      .eq('microstore_id', microstoreId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .order('created_at', { ascending: false })
      .limit(1000);

    if (!analytics || analytics.length === 0) {
      return {
        total_interactions: 0,
        avg_time_spent: 0,
        conversion_rate: 0,
        top_products: [],
        peak_hours: [],
        user_demographics: {},
      };
    }

    const totalViews = analytics.filter((a) => a.event_type === 'view').length;
    const totalPurchases = analytics.filter((a) => a.event_type === 'purchase').length;
    const conversionRate = totalViews > 0 ? totalPurchases / totalViews : 0;

    // Get top products
    const productCounts: Record<string, number> = {};
    analytics.forEach((a) => {
      if (a.product_id) {
        productCounts[a.product_id] = (productCounts[a.product_id] || 0) + 1;
      }
    });

    const topProducts = Object.entries(productCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id]) => id);

    return {
      total_interactions: analytics.length,
      conversion_rate: conversionRate,
      top_products: topProducts,
      views: totalViews,
      purchases: totalPurchases,
    };
  }

  /**
   * Generate evolution plan using AI
   */
  private static async generateEvolutionPlan(
    district: any,
    behavior: any,
    currentPersonality: any
  ): Promise<DistrictEvolutionPlan> {
    const systemPrompt = `You are a brand evolution AI. Analyze a district's performance and suggest how it should evolve.

Districts in an e-commerce mall adapt their personality, tone, and offerings based on user behavior.

Return JSON:
{
  "proposed_changes": {
    "description": "new description",
    "tone": "professional|casual|playful|luxury|eco-conscious|tech-forward",
    "style": "minimalist|bold|elegant|rustic|futuristic",
    "targetAudience": "description of target audience",
    "brandVoice": "how the district communicates",
    "visualTheme": "color palette and style keywords",
    "suggestedCategories": ["category1", "category2"],
    "marketingCopy": {
      "headline": "new headline",
      "subheadline": "supporting text",
      "cta": "call to action"
    }
  },
  "reasoning": "detailed explanation of why these changes will improve performance",
  "confidence": 0.0 to 1.0
}`;

    const userPrompt = `District: ${district.name}
Current Category: ${district.category}
Current Description: ${district.description}
Current Personality: ${JSON.stringify(currentPersonality || {})}

Recent Performance (30 days):
- Total Interactions: ${behavior.total_interactions}
- Views: ${behavior.views}
- Purchases: ${behavior.purchases}
- Conversion Rate: ${(behavior.conversion_rate * 100).toFixed(2)}%

Suggest how this district should evolve.`;

    try {
      const response = await callOpenAI(systemPrompt, userPrompt, 0.8);
      const plan = JSON.parse(response);
      
      return {
        current_state: { ...district, personality: currentPersonality },
        proposed_changes: plan.proposed_changes,
        reasoning: plan.reasoning,
        confidence: plan.confidence || 0.8,
      };
    } catch (error) {
      console.error('Error generating evolution plan:', error);
      return {
        current_state: district,
        proposed_changes: {},
        reasoning: 'Failed to generate plan',
        confidence: 0,
      };
    }
  }

  /**
   * Apply evolution to district
   */
  private static async applyEvolution(
    microstoreId: string,
    districtSlug: string,
    plan: DistrictEvolutionPlan
  ) {
    const changes = plan.proposed_changes;

    // Update district description
    if (changes.description) {
      await supabase
        .from('microstores')
        .update({ description: changes.description })
        .eq('id', microstoreId);
    }

    // Upsert personality
    await supabase.from('district_personalities').upsert({
      microstore_id: microstoreId,
      tone: changes.tone,
      style: changes.style,
      target_audience: changes.targetAudience,
      brand_voice: changes.brandVoice,
      visual_theme: changes.visualTheme,
      updated_at: new Date().toISOString(),
    });

    // Update marketing copy
    if (changes.marketingCopy) {
      await supabase.from('district_marketing').upsert({
        microstore_id: microstoreId,
        headline: changes.marketingCopy.headline,
        subheadline: changes.marketingCopy.subheadline,
        cta: changes.marketingCopy.cta,
        updated_at: new Date().toISOString(),
      });
    }

    // Generate new SEO metadata for district
    const seo = await generateSEOMetadata(
      districtSlug,
      changes.description || '',
      `E-commerce district with ${changes.tone} tone targeting ${changes.targetAudience}`
    );

    await supabase.from('district_seo').upsert({
      microstore_id: microstoreId,
      meta_title: seo.title,
      meta_description: seo.description,
      keywords: seo.keywords,
      og_title: seo.ogTitle,
      og_description: seo.ogDescription,
      updated_at: new Date().toISOString(),
    });

    // Log evolution
    await supabase.from('evolution_log').insert({
      entity_type: 'district',
      entity_id: microstoreId,
      plan: plan,
      applied_at: new Date().toISOString(),
    });
  }

  /**
   * Suggest new product categories for district
   */
  static async suggestCategories(districtSlug: string): Promise<string[]> {
    const { data: district } = await supabase
      .from('microstores')
      .select('*, products(*)')
      .eq('slug', districtSlug)
      .single();

    if (!district) return [];

    const behavior = await this.analyzeUserBehavior(district.id);

    const systemPrompt = `You are a product category strategist. Based on a district's current products and user behavior, suggest 3-5 new product categories that would complement the existing offering.

Return JSON array of strings: ["category1", "category2", ...]`;

    const userPrompt = `District: ${district.name}
Current Category: ${district.category}
Current Products: ${district.products?.length || 0}
Recent Performance: ${JSON.stringify(behavior)}

Suggest complementary categories.`;

    try {
      const response = await callOpenAI(systemPrompt, userPrompt, 0.7);
      const categories = JSON.parse(response);
      return categories;
    } catch (error) {
      console.error('Error suggesting categories:', error);
      return [];
    }
  }

  /**
   * Auto-generate district marketing content
   */
  static async generateMarketingContent(districtSlug: string): Promise<any> {
    const { data: district } = await supabase
      .from('microstores')
      .select('*, district_personalities(*)')
      .eq('slug', districtSlug)
      .single();

    if (!district) return null;

    const personality = district.district_personalities?.[0];

    const systemPrompt = `You are a marketing copywriter. Generate compelling marketing content for an e-commerce district.

${personality ? `District Personality: ${JSON.stringify(personality)}` : ''}

Return JSON:
{
  "headline": "attention-grabbing headline",
  "subheadline": "supporting copy",
  "heroText": "2-3 sentences for hero section",
  "features": ["feature1", "feature2", "feature3"],
  "cta": "call to action",
  "emailSubject": "email campaign subject line",
  "emailPreview": "email preview text"
}`;

    const userPrompt = `District: ${district.name}
Category: ${district.category}
Description: ${district.description}

Generate marketing content.`;

    try {
      const response = await callOpenAI(systemPrompt, userPrompt, 0.9);
      const content = JSON.parse(response);

      // Save to database
      await supabase.from('district_marketing_content').insert({
        microstore_id: district.id,
        content,
        generated_at: new Date().toISOString(),
      });

      return content;
    } catch (error) {
      console.error('Error generating marketing content:', error);
      return null;
    }
  }

  /**
   * Evolve brand voice over time
   */
  static async evolveBrandVoice(districtSlug: string): Promise<string> {
    const { data: district } = await supabase
      .from('microstores')
      .select('*, district_personalities(*)')
      .eq('slug', districtSlug)
      .single();

    if (!district) return '';

    const { data: recentContent } = await supabase
      .from('district_marketing_content')
      .select('content')
      .eq('microstore_id', district.id)
      .order('generated_at', { ascending: false })
      .limit(10);

    const systemPrompt = `You are a brand voice evolution AI. Analyze recent marketing content and suggest how the brand voice should evolve to stay fresh while maintaining consistency.

Return a JSON object:
{
  "evolved_voice": "description of evolved brand voice",
  "tone_adjustments": "specific tone adjustments to make",
  "examples": ["example phrase 1", "example phrase 2"],
  "reasoning": "why this evolution makes sense"
}`;

    const userPrompt = `District: ${district.name}
Current Brand Voice: ${district.district_personalities?.[0]?.brand_voice || 'undefined'}
Recent Content: ${JSON.stringify(recentContent)}

Suggest brand voice evolution.`;

    try {
      const response = await callOpenAI(systemPrompt, userPrompt, 0.7);
      const evolution = JSON.parse(response);

      // Update brand voice
      if (district.district_personalities?.[0]) {
        const evolutionEntry = { date: new Date().toISOString(), ...evolution };
        const currentHistory = district.district_personalities[0].voice_evolution_history || [];
        const updatedHistory = [...currentHistory, evolutionEntry];

        await supabase
          .from('district_personalities')
          .update({
            brand_voice: evolution.evolved_voice,
            voice_evolution_history: updatedHistory,
          })
          .eq('microstore_id', district.id);
      }

      return evolution.evolved_voice;
    } catch (error) {
      console.error('Error evolving brand voice:', error);
      return '';
    }
  }
}
