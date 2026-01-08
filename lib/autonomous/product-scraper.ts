/**
 * Product Scraper
 * 
 * Automatically discovers and extracts products from supplier websites.
 * This is the magic that turns AI City into a self-populating marketplace.
 * 
 * Features:
 * - Intelligent product detection
 * - Auto-generated descriptions
 * - Image extraction and enhancement
 * - Automatic district assignment
 * - Price normalization
 */

import { WebsiteAnalysis } from './website-analyzer';
import { getOpenAI } from '../openai';

export interface ScrapedProduct {
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  images: string[];
  url: string;
  sku?: string;
  inStock: boolean;
  attributes?: Record<string, any>;
}

export interface ProductImportResult {
  success: boolean;
  productsFound: number;
  productsImported: number;
  errors: string[];
  products: ScrapedProduct[];
}

export class ProductScraper {
  /**
   * Main entry point: Scrape products from supplier website
   */
  async scrapeProducts(
    websiteUrl: string,
    supplierId: string,
    websiteAnalysis: WebsiteAnalysis | null = null
  ): Promise<ProductImportResult> {
    console.log(`🔍 Scraping products from ${websiteUrl}`);

    try {
      // Step 1: Fetch website content
      const html = await this.fetchWebsite(websiteUrl);
      if (!html) {
        return {
          success: false,
          productsFound: 0,
          productsImported: 0,
          errors: ['Failed to fetch website'],
          products: []
        };
      }

      // Step 2: Use AI to detect product pages
      const productUrls = await this.detectProductPages(websiteUrl, html);
      console.log(`📦 Found ${productUrls.length} potential products`);

      // Step 3: Extract product details from each page
      const products: ScrapedProduct[] = [];
      const errors: string[] = [];

      for (const url of productUrls.slice(0, 20)) { // Limit to 20 products for now
        try {
          const product = await this.extractProduct(url, websiteAnalysis);
          if (product) {
            products.push(product);
          }
        } catch (error) {
          errors.push(`Failed to extract ${url}: ${error}`);
        }
      }

      console.log(`✅ Extracted ${products.length} products`);

      return {
        success: true,
        productsFound: productUrls.length,
        productsImported: products.length,
        errors,
        products
      };
    } catch (error) {
      console.error('Product scraping error:', error);
      return {
        success: false,
        productsFound: 0,
        productsImported: 0,
        errors: [String(error)],
        products: []
      };
    }
  }

  /**
   * Fetch website HTML
   */
  private async fetchWebsite(url: string): Promise<string | null> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'AI-City-Bot/1.0 (Product Discovery)'
        }
      });

      if (!response.ok) return null;
      return await response.text();
    } catch (error) {
      console.error('Fetch error:', error);
      return null;
    }
  }

  /**
   * Use AI to detect product pages from website structure
   */
  private async detectProductPages(baseUrl: string, html: string): Promise<string[]> {
    // Extract all links from HTML
    const linkRegex = /<a[^>]+href=["']([^"']+)["']/gi;
    const links: string[] = [];
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      // Filter for likely product pages
      if (
        (href.includes('/product') || 
         href.includes('/shop') || 
         href.includes('/item') ||
         href.includes('/p/')) &&
        !href.includes('cart') &&
        !href.includes('checkout')
      ) {
        // Convert relative URLs to absolute
        const absoluteUrl = href.startsWith('http') 
          ? href 
          : new URL(href, baseUrl).toString();
        links.push(absoluteUrl);
      }
    }

    // Remove duplicates
    return [...new Set(links)];
  }

  /**
   * Extract product details from a product page
   */
  private async extractProduct(
    url: string,
    websiteAnalysis: WebsiteAnalysis | null
  ): Promise<ScrapedProduct | null> {
    try {
      const html = await this.fetchWebsite(url);
      if (!html) return null;

      // Extract text content
      const text = this.extractText(html);

      // Use AI to extract product information
      const productData = await this.aiExtractProduct(text, url, websiteAnalysis);

      return productData;
    } catch (error) {
      console.error(`Error extracting product from ${url}:`, error);
      return null;
    }
  }

  /**
   * Use AI to extract structured product data from text
   */
  private async aiExtractProduct(
    pageText: string,
    url: string,
    websiteAnalysis: WebsiteAnalysis | null
  ): Promise<ScrapedProduct | null> {
    const brandContext = websiteAnalysis ? `
Brand Context:
- Tone: ${websiteAnalysis.brandTone}
- Style: ${websiteAnalysis.productStyle.join(', ')}
- Values: ${websiteAnalysis.coreValues.join(', ')}
` : '';

    const prompt = `Extract product information from this e-commerce page:

${pageText.substring(0, 4000)}

${brandContext}

Return JSON with this structure:
{
  "name": "product name",
  "description": "compelling 2-3 sentence description",
  "price": numeric_price,
  "currency": "USD",
  "category": "tech|wellness|fashion|home|food|other",
  "images": ["image_url1", "image_url2"],
  "sku": "product_sku_if_available",
  "inStock": true,
  "attributes": {
    "color": "value",
    "size": "value",
    "material": "value"
  }
}

Important:
- Make description engaging and highlight benefits
- Extract actual price (remove currency symbols)
- Get all image URLs
- Determine best category
- Only return valid JSON`;

    try {
      const client = getOpenAI();
      const response = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a product data extraction expert. Return only valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 600
      });

      const content = response.choices[0].message.content?.trim() || '{}';
      const product = JSON.parse(content);

      // Add URL
      product.url = url;

      // Validate required fields
      if (!product.name || !product.price) {
        console.log('Invalid product data - missing required fields');
        return null;
      }

      return product as ScrapedProduct;
    } catch (error) {
      console.error('AI extraction error:', error);
      return null;
    }
  }

  /**
   * Generate enhanced product description using AI
   */
  async generateDescription(
    product: ScrapedProduct,
    brandAnalysis: WebsiteAnalysis | null
  ): Promise<string> {
    const brandContext = brandAnalysis ? `
Write in ${brandAnalysis.brandTone} tone.
Brand values: ${brandAnalysis.coreValues.join(', ')}.
Target audience: ${brandAnalysis.targetAudience}.
` : '';

    const prompt = `Create an engaging product description for AI City marketplace:

Product: ${product.name}
Current Description: ${product.description}
Category: ${product.category}
Price: $${product.price}
${brandContext}

Write a compelling 2-3 paragraph description that:
- Highlights key benefits and features
- Creates emotional connection
- Mentions what makes it special
- Uses the brand's tone
- Encourages purchase

Return only the description text, no JSON or formatting.`;

    try {
      const client = getOpenAI();
      const response = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a creative product copywriter.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      });

      return response.choices[0].message.content?.trim() || product.description;
    } catch (error) {
      console.error('Description generation error:', error);
      return product.description;
    }
  }

  /**
   * Auto-assign product to optimal district
   */
  async assignDistrict(
    product: ScrapedProduct,
    websiteAnalysis: WebsiteAnalysis | null
  ): Promise<{ districtSlug: string; confidence: number }> {
    const brandContext = websiteAnalysis ? `
Brand matches: ${websiteAnalysis.recommendedDistricts.join(', ')}
Product style: ${websiteAnalysis.productStyle.join(', ')}
` : '';

    const prompt = `Assign this product to the best district in AI City:

Product: ${product.name}
Description: ${product.description}
Category: ${product.category}
${brandContext}

Available Districts:
- tech-hub: Technology, gadgets, electronics
- yoga-studio: Wellness, fitness, mindfulness
- craft-shop: Handmade, artisan, creative goods
- gadget-corner: Small electronics, accessories
- vintage-corner: Classic, retro, timeless items
- eco-market: Sustainable, eco-friendly products
- fashion-district: Clothing, accessories, style
- home-haven: Home decor, furniture, living

Return JSON:
{
  "district": "district-slug",
  "confidence": 0.0-1.0,
  "reasoning": "why this district"
}`;

    try {
      const client = getOpenAI();
      const response = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a product placement expert. Return only valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      });

      const content = response.choices[0].message.content?.trim() || '{}';
      const result = JSON.parse(content);

      return {
        districtSlug: result.district || 'tech-hub',
        confidence: result.confidence || 0.7
      };
    } catch (error) {
      console.error('District assignment error:', error);
      return { districtSlug: 'tech-hub', confidence: 0.5 };
    }
  }

  /**
   * Extract clean text from HTML
   */
  private extractText(html: string): string {
    // Remove script, style, nav, footer
    let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    text = text.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '');
    text = text.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '');

    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, ' ');

    // Decode entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');

    // Clean whitespace
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  }

  /**
   * Generate product images using AI (fallback if scraping fails)
   */
  async generateProductImage(product: ScrapedProduct): Promise<string | null> {
    // Note: This would use DALL-E or similar
    // For now, return placeholder
    console.log(`🎨 Would generate image for: ${product.name}`);
    return `https://placehold.co/600x400/png?text=${encodeURIComponent(product.name)}`;
  }

  /**
   * Normalize price to USD
   */
  normalizePrice(price: number, currency: string): number {
    // Simple conversion - in production, use exchange rate API
    const rates: Record<string, number> = {
      'USD': 1.0,
      'EUR': 1.1,
      'GBP': 1.3,
      'CAD': 0.75
    };

    return price * (rates[currency] || 1.0);
  }
}

// Export singleton
export const productScraper = new ProductScraper();
