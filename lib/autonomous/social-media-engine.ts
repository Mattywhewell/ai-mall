/**
 * Autonomous Social Media Engine
 * Automatically generates and schedules social content
 */

import { supabase } from '../supabaseClient';
import { AIRouter } from '../ai/modelRouter';

export interface SocialPost {
  platform: 'tiktok' | 'instagram' | 'twitter' | 'facebook';
  content: string;
  hashtags: string[];
  media_url?: string;
  scheduled_for: string;
  posted: boolean;
}

export interface SocialCalendar {
  week_start: string;
  posts: SocialPost[];
  themes: string[];
}

export class SocialMediaEngine {
  /**
   * Generate weekly social calendar for district
   */
  static async generateWeeklyCalendar(districtSlug: string): Promise<SocialCalendar> {
    console.log(`📱 Generating social calendar for ${districtSlug}`);

    const { data: district } = await supabase
      .from('microstores')
      .select('*, products(*), district_personalities(*)')
      .eq('slug', districtSlug)
      .single();

    if (!district) throw new Error('District not found');

    // Get top performing products
    const { data: topProducts } = await supabase
      .from('analytics')
      .select('product_id, count')
      .eq('microstore_id', district.id)
      .eq('event_type', 'view')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('count', { ascending: false })
      .limit(5);

    const productIds = topProducts?.map((p) => p.product_id) || [];
    const featuredProducts = district.products?.filter((p: any) =>
      productIds.includes(p.id)
    ) || [];

    // Generate calendar using AI
    const calendar = await this.generateCalendarWithAI(
      district,
      featuredProducts,
      district.district_personalities?.[0]
    );

    // Save to database
    await supabase.from('social_calendars').insert({
      microstore_id: district.id,
      week_start: calendar.week_start,
      calendar_data: calendar,
      generated_at: new Date().toISOString(),
    });

    // Schedule posts
    await this.schedulePosts(district.id, calendar.posts);

    return calendar;
  }

  /**
   * Generate calendar using AI
   */
  private static async generateCalendarWithAI(
    district: any,
    products: any[],
    personality: any
  ): Promise<SocialCalendar> {
    const systemPrompt = `You are a social media strategist. Generate a 7-day content calendar for an e-commerce district.

Create diverse content: product highlights, behind-the-scenes, user engagement, trends, tips, lifestyle.

Return JSON:
{
  "week_start": "2024-01-15",
  "themes": ["theme1", "theme2"],
  "posts": [
    {
      "platform": "tiktok|instagram|twitter|facebook",
      "day": "monday",
      "time": "09:00",
      "content": "post content",
      "hashtags": ["tag1", "tag2"],
      "content_type": "product_highlight|lifestyle|tip|engagement|trend",
      "product_id": "optional product id"
    }
  ]
}

Generate 2-3 posts per day across different platforms.`;

    const userPrompt = `District: ${district.name}
Category: ${district.category}
Description: ${district.description}
Personality: ${JSON.stringify(personality || {})}

Top Products:
${products.map((p) => `- ${p.name}: ${p.description?.substring(0, 100)}`).join('\n')}

Generate a weekly social media calendar.`;

    try {
      const response = await AIRouter.getInstance().executeTask({
        id: `social-calendar-${districtSlug}-${Date.now()}`,
        type: 'creative',
        content: userPrompt,
        systemPrompt,
        temperature: 0.9,
        priority: 'medium'
      });
      const calendar = JSON.parse(response);

      // Add scheduled_for timestamps
      const weekStart = new Date();
      weekStart.setHours(0, 0, 0, 0);

      const dayMap: Record<string, number> = {
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
        sunday: 0,
      };

      calendar.posts = calendar.posts.map((post: any) => {
        const dayOffset = dayMap[post.day.toLowerCase()] || 0;
        const [hours, minutes] = post.time.split(':');
        const scheduledDate = new Date(weekStart);
        scheduledDate.setDate(scheduledDate.getDate() + dayOffset);
        scheduledDate.setHours(parseInt(hours), parseInt(minutes));

        return {
          platform: post.platform,
          content: post.content,
          hashtags: post.hashtags,
          scheduled_for: scheduledDate.toISOString(),
          posted: false,
          content_type: post.content_type,
          product_id: post.product_id,
        };
      });

      return {
        week_start: weekStart.toISOString(),
        posts: calendar.posts,
        themes: calendar.themes,
      };
    } catch (error) {
      console.error('Error generating social calendar:', error);
      return {
        week_start: new Date().toISOString(),
        posts: [],
        themes: [],
      };
    }
  }

  /**
   * Generate TikTok hook
   */
  static async generateTikTokHook(productName: string, description: string): Promise<string> {
    const systemPrompt = `You are a TikTok content creator. Generate a viral hook (first 3 seconds) for a product video.

Must be:
- Attention-grabbing
- 1-2 sentences max
- Conversational tone
- Pattern interrupt

Return just the hook text, no JSON.`;

    const userPrompt = `Product: ${productName}
Description: ${description}

Generate TikTok hook.`;

    try {
      const hook = await AIRouter.getInstance().executeTask({
        id: `tiktok-hook-${productName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
        type: 'creative',
        content: userPrompt,
        systemPrompt,
        temperature: 1.0,
        priority: 'medium'
      });
      return hook.trim();
    } catch (error) {
      return `You need to see this! 👀`;
    }
  }

  /**
   * Generate Instagram caption
   */
  static async generateInstagramCaption(
    productName: string,
    description: string,
    hashtags: string[]
  ): Promise<string> {
    const systemPrompt = `You are an Instagram content creator. Generate an engaging caption for a product post.

Include:
- Hook first line
- Product benefits
- Call to action
- Emojis (tastefully)

Return just the caption text.`;

    const userPrompt = `Product: ${productName}
Description: ${description}
Hashtags: ${hashtags.join(', ')}

Generate Instagram caption.`;

    try {
      const caption = await AIRouter.getInstance().executeTask({
        id: `instagram-caption-${productName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
        type: 'creative',
        content: userPrompt,
        systemPrompt,
        temperature: 0.9,
        priority: 'medium'
      });
      return caption.trim();
    } catch (error) {
      return `✨ ${productName}\n\n${description}\n\n#${hashtags.join(' #')}`;
    }
  }

  /**
   * Generate Twitter thread
   */
  static async generateTwitterThread(topic: string, products: any[]): Promise<string[]> {
    const systemPrompt = `You are a Twitter thread writer. Generate a 5-tweet thread about a topic, weaving in products naturally.

Each tweet must:
- Be under 280 characters
- Be engaging and valuable
- Build on previous tweets
- Include relevant hashtags

Return JSON array of strings: ["tweet1", "tweet2", ...]`;

    const userPrompt = `Topic: ${topic}
Products:
${products.map((p) => `- ${p.name}`).join('\n')}

Generate thread.`;

    try {
      const response = await AIRouter.getInstance().executeTask({
        id: `twitter-thread-${topic.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
        type: 'creative',
        content: userPrompt,
        systemPrompt,
        temperature: 0.8,
        priority: 'medium'
      });
      const thread = JSON.parse(response);
      return thread;
    } catch (error) {
      return [`🧵 Thread about ${topic}`];
    }
  }

  /**
   * Generate hashtag set
   */
  static async generateHashtagSet(
    content: string,
    platform: 'tiktok' | 'instagram' | 'twitter'
  ): Promise<string[]> {
    const systemPrompt = `You are a hashtag strategist. Generate optimal hashtags for social media.

Platform: ${platform}
${platform === 'instagram' ? '20-30 hashtags' : platform === 'tiktok' ? '3-5 hashtags' : '2-3 hashtags'}

Mix of:
- High-volume trending
- Niche specific
- Branded

Return JSON array of strings (without # symbol): ["tag1", "tag2", ...]`;

    const userPrompt = `Content: ${content}

Generate hashtags.`;

    try {
      const response = await AIRouter.getInstance().executeTask({
        id: `hashtags-${platform}-${Date.now()}`,
        type: 'factual',
        content: userPrompt,
        systemPrompt,
        temperature: 0.7,
        priority: 'low'
      });
      const hashtags = JSON.parse(response);
      return hashtags;
    } catch (error) {
      return ['ecommerce', 'shopping', 'deals'];
    }
  }

  /**
   * Schedule posts
   */
  private static async schedulePosts(microstoreId: string, posts: SocialPost[]) {
    for (const post of posts) {
      await supabase.from('scheduled_social_posts').insert({
        microstore_id: microstoreId,
        platform: post.platform,
        content: post.content,
        hashtags: post.hashtags,
        media_url: post.media_url,
        scheduled_for: post.scheduled_for,
        posted: false,
      });
    }
  }

  /**
   * Get posts ready to publish
   */
  static async getReadyPosts(): Promise<any[]> {
    const { data: posts } = await supabase
      .from('scheduled_social_posts')
      .select('*')
      .eq('posted', false)
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(20);

    return posts || [];
  }

  /**
   * Mark post as published
   */
  static async markAsPublished(postId: string) {
    await supabase
      .from('scheduled_social_posts')
      .update({ posted: true, published_at: new Date().toISOString() })
      .eq('id', postId);
  }

  /**
   * Analyze social media performance
   */
  static async analyzePerformance(microstoreId: string): Promise<any> {
    const { data: posts } = await supabase
      .from('scheduled_social_posts')
      .select('*')
      .eq('microstore_id', microstoreId)
      .eq('posted', true)
      .gte('published_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (!posts || posts.length === 0) {
      return {
        total_posts: 0,
        platforms: {},
        avg_engagement: 0,
        top_hashtags: [],
      };
    }

    const platformBreakdown: Record<string, number> = {};
    const hashtagCounts: Record<string, number> = {};

    posts.forEach((post) => {
      platformBreakdown[post.platform] = (platformBreakdown[post.platform] || 0) + 1;

      post.hashtags?.forEach((tag: string) => {
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
      });
    });

    const topHashtags = Object.entries(hashtagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => tag);

    return {
      total_posts: posts.length,
      platforms: platformBreakdown,
      top_hashtags: topHashtags,
    };
  }

  /**
   * Generate content ideas based on trends
   */
  static async generateContentIdeas(districtSlug: string): Promise<string[]> {
    const { data: district } = await supabase
      .from('microstores')
      .select('*')
      .eq('slug', districtSlug)
      .single();

    if (!district) return [];

    const systemPrompt = `You are a social media content strategist. Generate 10 content ideas for an e-commerce district.

Ideas should be:
- Trend-aware
- Engaging
- Platform-specific
- Actionable

Return JSON array of strings: ["idea1", "idea2", ...]`;

    const userPrompt = `District: ${district.name}
Category: ${district.category}
Description: ${district.description}

Generate content ideas.`;

    try {
      const response = await AIRouter.getInstance().executeTask({
        id: `content-ideas-${districtSlug}-${Date.now()}`,
        type: 'creative',
        content: userPrompt,
        systemPrompt,
        temperature: 0.9,
        priority: 'medium'
      });
      const ideas = JSON.parse(response);
      return ideas;
    } catch (error) {
      return [];
    }
  }
}
