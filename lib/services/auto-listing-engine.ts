/**
 * Auto-Listing Engine
 * Extracts and enhances product information from supplier URLs
 */

interface ProductData {
  title: string;
  description: string;
  price: string;
  images: string[];
  alt_text: string[];
  specifications: Record<string, any>;
  variants: Array<{
    name: string;
    options: string[];
    price_modifier?: number;
  }>;
  category: string;
  tags: string[];
  similarity_scores: {
    title_image: number;
    description_image: number;
    category_image: number;
  };
  status: 'approved' | 'needs_review';
  extraction_metadata?: {
    source_url: string;
    extracted_at: string;
    scraping_method: string;
  };
}

interface ExtractionResult {
  success: boolean;
  data?: ProductData;
  error?: string;
  warnings?: string[];
}

/**
 * Main Auto-Listing Engine Service
 */
export class AutoListingEngine {
  private readonly MIN_SIMILARITY_THRESHOLD = 0.75;

  /**
   * Process a product URL and generate a complete listing
   */
  async processProductURL(url: string, supplierId: string): Promise<ExtractionResult> {
    try {
      // Validate URL
      if (!this.isValidURL(url)) {
        return {
          success: false,
          error: 'Invalid URL provided. Please provide a valid product page URL.'
        };
      }

      // Step 1: Extract raw data from URL
      const rawData = await this.extractProductData(url);
      
      if (!rawData) {
        return {
          success: false,
          error: 'Unable to extract product data from the provided URL. The page may be protected or unavailable.'
        };
      }

      // Step 2: Enhance content with AI
      const enhancedData = await this.enhanceProductData(rawData);

      // Step 3: Validate images
      const imageValidation = await this.validateImages(enhancedData);

      // Step 4: Calculate similarity scores
      const similarityScores = await this.calculateSimilarityScores(enhancedData);

      // Step 5: Generate alt text for images
      const altText = await this.generateAltText(enhancedData);

      // Step 6: Determine approval status
      const status = this.determineStatus(similarityScores, imageValidation);

      // Compile final product data
      const productData: ProductData = {
        title: enhancedData.title,
        description: enhancedData.description,
        price: enhancedData.price || '',
        images: imageValidation.validImages,
        alt_text: altText,
        specifications: enhancedData.specifications || {},
        variants: enhancedData.variants || [],
        category: enhancedData.category || 'Uncategorized',
        tags: enhancedData.tags || [],
        similarity_scores: similarityScores,
        status: status,
        extraction_metadata: {
          source_url: url,
          extracted_at: new Date().toISOString(),
          scraping_method: 'intelligent_extraction'
        }
      };

      const warnings: string[] = [];
      if (imageValidation.rejectedImages.length > 0) {
        warnings.push(`${imageValidation.rejectedImages.length} images were rejected due to quality or relevance issues.`);
      }
      if (status === 'needs_review') {
        warnings.push('Product requires manual review due to low similarity scores or missing data.');
      }

      return {
        success: true,
        data: productData,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error: any) {
      return {
        success: false,
        error: `Failed to process product URL: ${error.message}`
      };
    }
  }

  /**
   * Extract raw product data from URL
   */
  private async extractProductData(url: string): Promise<any> {
    try {
      // Use multiple extraction strategies
      const strategies = [
        this.extractWithMetaTags.bind(this),
        this.extractWithStructuredData.bind(this),
        this.extractWithCommonSelectors.bind(this)
      ];

      let extractedData: any = {};

      for (const strategy of strategies) {
        const data = await strategy(url);
        extractedData = { ...extractedData, ...data };
      }

      return extractedData;

    } catch (error) {
      console.error('Extraction error:', error);
      return null;
    }
  }

  /**
   * Extract using Open Graph and meta tags
   */
  private async extractWithMetaTags(url: string): Promise<any> {
    // This would use a web scraping library or API
    // For now, returning a structure to demonstrate the flow
    
    // In production, you'd use:
    // - Puppeteer/Playwright for JS-heavy sites
    // - Cheerio for static HTML
    // - External APIs like ScrapingBee, Apify, etc.
    
    return {
      title: null,
      description: null,
      images: [],
      price: null
    };
  }

  /**
   * Extract using JSON-LD structured data
   */
  private async extractWithStructuredData(url: string): Promise<any> {
    // Look for schema.org Product markup
    return {
      specifications: {},
      category: null,
      brand: null
    };
  }

  /**
   * Extract using common HTML selectors
   */
  private async extractWithCommonSelectors(url: string): Promise<any> {
    // Common e-commerce selectors
    const selectors = {
      title: ['h1.product-title', '.product-name', '[itemprop="name"]'],
      price: ['.price', '.product-price', '[itemprop="price"]'],
      description: ['.product-description', '.description', '[itemprop="description"]'],
      images: ['img.product-image', '.product-gallery img', '[itemprop="image"]']
    };

    return {
      variants: []
    };
  }

  /**
   * Enhance product data with AI
   */
  private async enhanceProductData(rawData: any): Promise<any> {
    // Clean and enhance the title
    const enhancedTitle = this.enhanceTitle(rawData.title);

    // Expand and improve description
    const enhancedDescription = await this.enhanceDescription(rawData.description);

    // Normalize specifications
    const normalizedSpecs = this.normalizeSpecifications(rawData.specifications);

    // Extract and enhance tags
    const tags = this.extractTags(rawData);

    return {
      ...rawData,
      title: enhancedTitle,
      description: enhancedDescription,
      specifications: normalizedSpecs,
      tags
    };
  }

  /**
   * Enhance product title
   */
  private enhanceTitle(title: string): string {
    if (!title) return 'Untitled Product';

    // Remove excessive punctuation
    let enhanced = title.replace(/[!]{2,}/g, '!');
    
    // Capitalize properly
    enhanced = enhanced
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    // Remove common filler words
    enhanced = enhanced.replace(/\b(hot|new|sale|deal)\b/gi, '').trim();

    return enhanced;
  }

  /**
   * Enhance product description
   */
  private async enhanceDescription(description: string): Promise<string> {
    if (!description || description.length < 20) {
      return 'Product description not available. Please contact the supplier for more information.';
    }

    // Clean HTML tags
    let enhanced = description.replace(/<[^>]*>/g, '');

    // Remove excessive whitespace
    enhanced = enhanced.replace(/\s+/g, ' ').trim();

    // Format into paragraphs if too long
    if (enhanced.length > 500) {
      const sentences = enhanced.match(/[^.!?]+[.!?]+/g) || [enhanced];
      const paragraphs: string[] = [];
      let currentParagraph = '';

      for (const sentence of sentences) {
        if (currentParagraph.length + sentence.length > 300) {
          paragraphs.push(currentParagraph.trim());
          currentParagraph = sentence;
        } else {
          currentParagraph += ' ' + sentence;
        }
      }
      if (currentParagraph) {
        paragraphs.push(currentParagraph.trim());
      }

      enhanced = paragraphs.join('\n\n');
    }

    return enhanced;
  }

  /**
   * Normalize specifications into structured format
   */
  private normalizeSpecifications(specs: any): Record<string, any> {
    const normalized: Record<string, any> = {};

    if (!specs) return normalized;

    // Common specification keys and their normalized names
    const keyMappings: Record<string, string> = {
      'size': 'dimensions',
      'dimension': 'dimensions',
      'weight': 'weight',
      'material': 'material',
      'color': 'color',
      'brand': 'brand',
      'model': 'model_number',
      'warranty': 'warranty'
    };

    for (const [key, value] of Object.entries(specs)) {
      const normalizedKey = keyMappings[key.toLowerCase()] || key.toLowerCase().replace(/\s+/g, '_');
      normalized[normalizedKey] = value;
    }

    return normalized;
  }

  /**
   * Extract relevant tags from product data
   */
  private extractTags(data: any): string[] {
    const tags: Set<string> = new Set();

    // Extract from title
    if (data.title) {
      const titleWords = data.title
        .toLowerCase()
        .split(/\s+/)
        .filter((word: string) => word.length > 3);
      titleWords.forEach((word: string) => tags.add(word));
    }

    // Extract from category
    if (data.category) {
      tags.add(data.category.toLowerCase());
    }

    // Extract from description (keywords)
    if (data.description) {
      const keywords = this.extractKeywords(data.description);
      keywords.forEach(keyword => tags.add(keyword));
    }

    return Array.from(tags).slice(0, 10); // Limit to 10 tags
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    // Simple keyword extraction (in production, use NLP)
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'of', 'is', 'are', 'was', 'were', 'be', 'been', 'being']);
    
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word));

    // Count frequency
    const frequency: Record<string, number> = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    // Return top keywords
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * Validate that images match the product
   */
  private async validateImages(data: any): Promise<{ validImages: string[], rejectedImages: string[] }> {
    const validImages: string[] = [];
    const rejectedImages: string[] = [];

    if (!data.images || data.images.length === 0) {
      return { validImages, rejectedImages };
    }

    for (const imageUrl of data.images) {
      // Basic validation checks
      if (!this.isValidImageURL(imageUrl)) {
        rejectedImages.push(imageUrl);
        continue;
      }

      // Check image size and format (would require actual image fetching)
      const isValid = await this.checkImageQuality(imageUrl);
      
      if (isValid) {
        validImages.push(imageUrl);
      } else {
        rejectedImages.push(imageUrl);
      }
    }

    return { validImages, rejectedImages };
  }

  /**
   * Check if URL is a valid image URL
   */
  private isValidImageURL(url: string): boolean {
    try {
      const parsed = new URL(url);
      const ext = parsed.pathname.split('.').pop()?.toLowerCase();
      return ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '');
    } catch {
      return false;
    }
  }

  /**
   * Check image quality (basic checks)
   */
  private async checkImageQuality(url: string): Promise<boolean> {
    // In production, this would:
    // 1. Fetch the image
    // 2. Check dimensions (reject if too small)
    // 3. Check file size (reject if corrupt)
    // 4. Use AI to verify relevance to product
    
    // For now, assume valid
    return true;
  }

  /**
   * Calculate similarity scores between text and images
   */
  private async calculateSimilarityScores(data: any): Promise<{
    title_image: number;
    description_image: number;
    category_image: number;
  }> {
    // In production, this would use:
    // - CLIP (Contrastive Language-Image Pre-training)
    // - OpenAI's embeddings API
    // - Custom vision-language models

    // For demonstration, returning mock scores
    // In reality, these would be calculated by comparing:
    // - Text embeddings (title/description/category)
    // - Image embeddings (from the product images)
    
    const hasImages = data.images && data.images.length > 0;
    const hasTitle = data.title && data.title.length > 0;
    const hasDescription = data.description && data.description.length > 20;

    return {
      title_image: hasImages && hasTitle ? 0.85 : 0.5,
      description_image: hasImages && hasDescription ? 0.82 : 0.5,
      category_image: hasImages && data.category ? 0.78 : 0.5
    };
  }

  /**
   * Generate alt text for product images
   */
  private async generateAltText(data: any): Promise<string[]> {
    const altTexts: string[] = [];

    if (!data.images || data.images.length === 0) {
      return altTexts;
    }

    for (let i = 0; i < data.images.length; i++) {
      let altText = '';

      if (i === 0) {
        // Main image
        altText = `${data.title} - Main Product Image`;
      } else if (data.variants && data.variants[i - 1]) {
        // Variant image
        altText = `${data.title} - ${data.variants[i - 1].name}`;
      } else {
        // Additional images
        altText = `${data.title} - View ${i + 1}`;
      }

      altTexts.push(altText);
    }

    return altTexts;
  }

  /**
   * Determine if product should be auto-approved or needs review
   */
  private determineStatus(
    scores: { title_image: number; description_image: number; category_image: number },
    imageValidation: { validImages: string[]; rejectedImages: string[] }
  ): 'approved' | 'needs_review' {
    // Check similarity scores
    const avgScore = (scores.title_image + scores.description_image + scores.category_image) / 3;
    
    if (avgScore < this.MIN_SIMILARITY_THRESHOLD) {
      return 'needs_review';
    }

    // Check if any images were rejected
    if (imageValidation.rejectedImages.length > 0) {
      return 'needs_review';
    }

    // Check if we have minimum required data
    if (imageValidation.validImages.length === 0) {
      return 'needs_review';
    }

    return 'approved';
  }

  /**
   * Validate URL format
   */
  private isValidURL(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const autoListingEngine = new AutoListingEngine();
