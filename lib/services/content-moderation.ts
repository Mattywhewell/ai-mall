/**
 * NSFW Content Detection Service
 * Moderates images and text for inappropriate content
 */

import { getOpenAIOrNull } from '../openai';

interface ModerationResult {
  flagged: boolean;
  categories: {
    sexual: boolean;
    hate: boolean;
    harassment: boolean;
    selfHarm: boolean;
    violence: boolean;
    graphic: boolean;
  };
  confidence: number;
  reason?: string;
}

export class ContentModerator {
  /**
   * Moderate text content using OpenAI Moderation API
   */
  async moderateText(text: string): Promise<ModerationResult> {
    const client = getOpenAIOrNull();
    if (!client) {
      // OpenAI not configured — return a neutral moderation result rather than throwing
      return {
        flagged: false,
        categories: {
          sexual: false,
          hate: false,
          harassment: false,
          selfHarm: false,
          violence: false,
          graphic: false,
        },
        confidence: 0,
        reason: 'OpenAI API key not configured',
      };
    }

    try {
      const response = await client.moderations.create({
        input: text,
      });

      const result = response.results[0];

      return {
        flagged: result.flagged,
        categories: {
          sexual: result.categories.sexual || result.categories['sexual/minors'],
          hate: result.categories.hate || result.categories['hate/threatening'],
          harassment: result.categories.harassment || result.categories['harassment/threatening'],
          selfHarm: result.categories['self-harm'] || result.categories['self-harm/intent'],
          violence: result.categories.violence || result.categories['violence/graphic'],
          graphic: result.categories['violence/graphic'],
        },
        confidence: Math.max(...Object.values(result.category_scores)),
        reason: result.flagged ? this.buildReasonMessage(result.categories) : undefined,
      };
    } catch (error) {
      console.error('Text moderation error:', error);
      return {
        flagged: false,
        categories: {
          sexual: false,
          hate: false,
          harassment: false,
          selfHarm: false,
          violence: false,
          graphic: false,
        },
        confidence: 0,
        reason: 'Moderation check failed',
      };
    }
  }

  /**
   * Moderate image content using GPT-4 Vision
   */
  async moderateImage(imageUrl: string): Promise<ModerationResult> {
    const client = getOpenAIOrNull();
    if (!client) {
      return {
        flagged: false,
        categories: {
          sexual: false,
          hate: false,
          harassment: false,
          selfHarm: false,
          violence: false,
          graphic: false,
        },
        confidence: 0,
        reason: 'OpenAI API key not configured',
      };
    }

    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image for inappropriate content. Check for: nudity, violence, weapons, drugs, hate symbols, or other NSFW content. Respond with ONLY "SAFE" or "UNSAFE: [reason]".',
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        max_tokens: 100,
      });

      const result = response.choices[0].message.content || '';
      const isSafe = result.toUpperCase().startsWith('SAFE');

      return {
        flagged: !isSafe,
        categories: {
          sexual: result.toLowerCase().includes('nudity') || result.toLowerCase().includes('sexual'),
          hate: result.toLowerCase().includes('hate'),
          harassment: false,
          selfHarm: result.toLowerCase().includes('self-harm'),
          violence: result.toLowerCase().includes('violence') || result.toLowerCase().includes('weapon'),
          graphic: result.toLowerCase().includes('graphic'),
        },
        confidence: isSafe ? 0.9 : 0.95,
        reason: isSafe ? undefined : result.replace('UNSAFE:', '').trim(),
      };
    } catch (error) {
      console.error('Image moderation error:', error);
      return {
        flagged: false,
        categories: {
          sexual: false,
          hate: false,
          harassment: false,
          selfHarm: false,
          violence: false,
          graphic: false,
        },
        confidence: 0,
        reason: 'Image moderation check failed',
      };
    }
  }

  /**
   * Moderate multiple images in batch
   */
  async moderateImages(imageUrls: string[]): Promise<ModerationResult[]> {
    const results = await Promise.all(
      imageUrls.map(url => this.moderateImage(url))
    );
    return results;
  }

  /**
   * Moderate product (title, description, images)
   */
  async moderateProduct(product: {
    title: string;
    description: string;
    images: string[];
  }): Promise<{ safe: boolean; reasons: string[] }> {
    const reasons: string[] = [];

    // Moderate text
    const textToModerate = `${product.title} ${product.description}`;
    const textResult = await this.moderateText(textToModerate);

    if (textResult.flagged) {
      reasons.push(`Text: ${textResult.reason}`);
    }

    // Moderate images
    const imageResults = await this.moderateImages(product.images);
    imageResults.forEach((result, index) => {
      if (result.flagged) {
        reasons.push(`Image ${index + 1}: ${result.reason}`);
      }
    });

    return {
      safe: reasons.length === 0,
      reasons,
    };
  }

  /**
   * Build human-readable reason message
   */
  private buildReasonMessage(categories: any): string {
    const flagged: string[] = [];

    if (categories.sexual) flagged.push('sexual content');
    if (categories.hate) flagged.push('hate speech');
    if (categories.harassment) flagged.push('harassment');
    if (categories['self-harm']) flagged.push('self-harm content');
    if (categories.violence) flagged.push('violence');
    if (categories['violence/graphic']) flagged.push('graphic violence');

    return `Flagged for: ${flagged.join(', ')}`;
  }

  /**
   * Check if specific category is flagged
   */
  hasCategory(result: ModerationResult, category: keyof ModerationResult['categories']): boolean {
    return result.categories[category];
  }
}

// Example usage in auto-listing engine:
/*
const moderator = new ContentModerator();
const result = await moderator.moderateProduct({
  title: product.title,
  description: product.description,
  images: product.images,
});

if (!result.safe) {
  // Reject product or flag for manual review
  console.log('Product flagged:', result.reasons);
}
*/
