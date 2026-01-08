/**
 * Website Analyzer
 * 
 * Automatically scrapes and analyzes supplier websites to extract:
 * - Brand tone and personality
 * - Product categories and styles
 * - Company values and mission
 * - Visual themes and aesthetics
 * 
 * This enriches AI Spirits' understanding and improves recommendations.
 */

import { getOpenAI } from '../openai';

export interface WebsiteAnalysis {
  brandTone: string; // 'professional', 'casual', 'luxurious', 'eco-friendly', etc.
  brandPersonality: string;
  productStyle: string[]; // ['minimalist', 'colorful', 'premium', etc.]
  coreValues: string[];
  visualTheme: {
    primaryColors: string[];
    mood: string; // 'vibrant', 'calm', 'bold', 'elegant'
    aesthetic: string; // 'modern', 'vintage', 'industrial', etc.
  };
  targetAudience: string;
  uniqueSellingPoints: string[];
  contentKeywords: string[];
  recommendedDistricts: string[];
  atmosphereInfluence: {
    hall: string; // Which hall this brand belongs to
    street: string; // Which street vibe matches
    description: string; // How to describe this brand in the world
  };
}

export class WebsiteAnalyzer {
  /**
   * Analyze a supplier's website to extract brand intelligence
   */
  async analyzeWebsite(websiteUrl: string): Promise<WebsiteAnalysis | null> {
    if (!websiteUrl) return null;

    try {
      console.log(`🌐 Analyzing website: ${websiteUrl}`);

      // Fetch website content
      const content = await this.fetchWebsiteContent(websiteUrl);
      if (!content) {
        console.log('Could not fetch website content');
        return null;
      }

      // Use AI to analyze the content
      const analysis = await this.aiAnalyzeContent(content, websiteUrl);
      return analysis;
    } catch (error) {
      console.error('Error analyzing website:', error);
      return null;
    }
  }

  /**
   * Fetch and clean website content
   */
  private async fetchWebsiteContent(url: string): Promise<string | null> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'AI-City-Bot/1.0 (Brand Intelligence Analyzer)'
        }
      });

      if (!response.ok) {
        console.log(`Failed to fetch ${url}: ${response.status}`);
        return null;
      }

      const html = await response.text();
      
      // Extract text content (simple HTML stripping)
      const textContent = this.extractTextFromHTML(html);
      
      // Limit to first 8000 characters to stay within token limits
      return textContent.substring(0, 8000);
    } catch (error) {
      console.error('Fetch error:', error);
      return null;
    }
  }

  /**
   * Extract text from HTML
   */
  private extractTextFromHTML(html: string): string {
    // Remove script and style tags
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    
    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, ' ');
    
    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    
    // Clean whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    return text;
  }

  /**
   * Use AI to analyze website content
   */
  private async aiAnalyzeContent(content: string, url: string): Promise<WebsiteAnalysis> {
    const prompt = `Analyze this e-commerce website and extract brand intelligence:

URL: ${url}
Content: ${content}

Extract and return JSON with this structure:
{
  "brandTone": "professional|casual|luxurious|eco-friendly|playful|minimalist",
  "brandPersonality": "2-sentence description of brand personality",
  "productStyle": ["style keywords like minimalist, colorful, premium"],
  "coreValues": ["sustainability", "quality", "innovation", etc.],
  "visualTheme": {
    "primaryColors": ["color names"],
    "mood": "vibrant|calm|bold|elegant",
    "aesthetic": "modern|vintage|industrial|artisan"
  },
  "targetAudience": "who is this brand for?",
  "uniqueSellingPoints": ["what makes them special"],
  "contentKeywords": ["key themes from content"],
  "recommendedDistricts": ["which AI City districts match this brand"],
  "atmosphereInfluence": {
    "hall": "Innovation Hall|Wellness Garden|Craft Sanctuary|Motion Plaza",
    "street": "Neon Boulevard|Artisan Row|Wellness Way|Tech Corridor",
    "description": "how to describe this brand in AI City"
  }
}`;

    try {
      const client = getOpenAI();
      const response = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a brand intelligence analyst. Extract brand personality from website content. Return only valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      });

      const aiContent = response.choices[0].message.content?.trim() || '{}';
      const analysis = JSON.parse(aiContent);

      console.log(`✅ Website analysis complete: ${analysis.brandTone} brand`);
      return analysis;
    } catch (error) {
      console.error('AI analysis error:', error);
      
      // Return basic fallback analysis
      return {
        brandTone: 'professional',
        brandPersonality: 'A quality brand serving customers with care',
        productStyle: ['quality'],
        coreValues: ['customer satisfaction'],
        visualTheme: {
          primaryColors: ['blue'],
          mood: 'calm',
          aesthetic: 'modern'
        },
        targetAudience: 'general consumers',
        uniqueSellingPoints: ['quality products'],
        contentKeywords: ['products', 'quality'],
        recommendedDistricts: [],
        atmosphereInfluence: {
          hall: 'Innovation Hall',
          street: 'Neon Boulevard',
          description: 'A trusted brand'
        }
      };
    }
  }

  /**
   * Generate enhanced brand description using website analysis
   */
  generateEnhancedDescription(websiteAnalysis: WebsiteAnalysis): string {
    const { brandPersonality, coreValues, uniqueSellingPoints } = websiteAnalysis;
    
    return `${brandPersonality} Core values: ${coreValues.join(', ')}. ${uniqueSellingPoints.join('. ')}.`;
  }

  /**
   * Extract keywords for AI Spirit training
   */
  extractSpiritKeywords(websiteAnalysis: WebsiteAnalysis): string[] {
    return [
      ...websiteAnalysis.contentKeywords,
      ...websiteAnalysis.productStyle,
      ...websiteAnalysis.coreValues,
      websiteAnalysis.brandTone,
      websiteAnalysis.visualTheme.mood,
      websiteAnalysis.visualTheme.aesthetic
    ].filter(Boolean);
  }

  /**
   * Determine how this brand influences world atmosphere
   */
  getAtmosphereInfluence(websiteAnalysis: WebsiteAnalysis): {
    colors: string[];
    mood: string;
    keywords: string[];
    description: string;
  } {
    return {
      colors: websiteAnalysis.visualTheme.primaryColors,
      mood: websiteAnalysis.visualTheme.mood,
      keywords: this.extractSpiritKeywords(websiteAnalysis),
      description: websiteAnalysis.atmosphereInfluence.description
    };
  }

  /**
   * Match products to districts based on website analysis
   */
  recommendProductPlacements(
    websiteAnalysis: WebsiteAnalysis,
    productCategories: string[]
  ): Array<{ category: string; district: string; confidence: number }> {
    // Use website insights to improve placement confidence
    const placements: Array<{ category: string; district: string; confidence: number }> = [];

    for (const category of productCategories) {
      // Match based on brand tone and product style
      const district = this.matchCategoryToDistrict(
        category,
        websiteAnalysis.brandTone,
        websiteAnalysis.productStyle
      );

      if (district) {
        placements.push({
          category,
          district,
          confidence: 0.85 // Higher confidence with website data
        });
      }
    }

    return placements;
  }

  /**
   * Smart district matching using website data
   */
  private matchCategoryToDistrict(
    category: string,
    brandTone: string,
    productStyle: string[]
  ): string | null {
    const categoryLower = category.toLowerCase();
    
    // Tech products
    if (categoryLower.includes('tech') || categoryLower.includes('electronics')) {
      return brandTone === 'luxurious' ? 'premium-tech-district' : 'tech-hub';
    }
    
    // Wellness products
    if (categoryLower.includes('wellness') || categoryLower.includes('health')) {
      return productStyle.includes('minimalist') ? 'zen-wellness' : 'yoga-studio';
    }
    
    // Fashion & accessories
    if (categoryLower.includes('fashion') || categoryLower.includes('clothing')) {
      return brandTone === 'luxurious' ? 'luxury-boutique' : 'artisan-row';
    }
    
    // Home & craft
    if (categoryLower.includes('home') || categoryLower.includes('craft')) {
      return productStyle.includes('vintage') ? 'vintage-corner' : 'craft-shop';
    }
    
    return null;
  }

  /**
   * Enhance semantic search with website keywords
   */
  generateSearchKeywords(websiteAnalysis: WebsiteAnalysis): string[] {
    return [
      ...websiteAnalysis.contentKeywords,
      ...websiteAnalysis.uniqueSellingPoints.map(usp => 
        usp.toLowerCase().split(' ')
      ).flat(),
      websiteAnalysis.brandTone,
      websiteAnalysis.targetAudience
    ].filter((keyword, index, self) => 
      keyword && self.indexOf(keyword) === index // Remove duplicates
    );
  }
}

// Export singleton instance
export const websiteAnalyzer = new WebsiteAnalyzer();
