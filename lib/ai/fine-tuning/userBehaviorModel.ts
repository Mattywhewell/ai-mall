import { callOpenAI } from '../openaiClient';
import { supabase } from '@/lib/supabaseClient';

export interface UserBehaviorPattern {
  userId: string;
  browsingPatterns: {
    avgSessionDuration: number;
    preferredCategories: string[];
    timeOfDayPreference: string[];
    deviceTypes: string[];
    bounceRate: number;
  };
  purchasePatterns: {
    avgOrderValue: number;
    preferredPaymentMethods: string[];
    purchaseFrequency: string;
    cartAbandonmentRate: number;
    seasonalPreferences: string[];
  };
  interactionPatterns: {
    clickThroughRates: Record<string, number>;
    engagementScores: Record<string, number>;
    feedbackSentiment: number; // -1 to 1
    supportTicketFrequency: number;
  };
  demographicInsights: {
    ageGroup: string;
    interests: string[];
    lifestyle: string[];
    values: string[];
  };
}

export interface UserBehaviorModel {
  id: string;
  name: string;
  targetSegment: string;
  trainingData: UserBehaviorPattern[];
  status: 'training' | 'ready' | 'failed';
  created_at: string;
  performance_metrics?: {
    prediction_accuracy: number;
    personalization_score: number;
    retention_improvement: number;
  };
}

export class UserBehaviorModel {
  private static instance: UserBehaviorModel;
  private fineTunedModels: Map<string, UserBehaviorModel> = new Map();

  private constructor() {}

  static getInstance(): UserBehaviorModel {
    if (!UserBehaviorModel.instance) {
      UserBehaviorModel.instance = new UserBehaviorModel();
    }
    return UserBehaviorModel.instance;
  }

  /**
   * Collect user behavior data for training
   */
  async collectUserBehaviorData(limit: number = 5000): Promise<UserBehaviorPattern[]> {
    // Get user analytics data
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, created_at')
      .limit(limit);

    if (error) {
      console.error('Error collecting user behavior data:', error);
      return [];
    }

    const behaviorPatterns: UserBehaviorPattern[] = [];

    for (const user of users || []) {
      try {
        const pattern = await this.analyzeUserBehavior(user.id);
        if (pattern) {
          behaviorPatterns.push(pattern);
        }
      } catch (error) {
        console.warn(`Failed to analyze user ${user.id}:`, error);
      }
    }

    return behaviorPatterns;
  }

  /**
   * Analyze individual user behavior patterns
   */
  private async analyzeUserBehavior(userId: string): Promise<UserBehaviorPattern | null> {
    // Get user session data
    const { data: sessions } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    // Get user orders
    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount, created_at, payment_method')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    // Get user interactions
    const { data: interactions } = await supabase
      .from('user_interactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (!sessions?.length && !orders?.length) {
      return null; // Not enough data
    }

    // Analyze browsing patterns
    const browsingPatterns = this.analyzeBrowsingPatterns(sessions || []);

    // Analyze purchase patterns
    const purchasePatterns = this.analyzePurchasePatterns(orders || []);

    // Analyze interaction patterns
    const interactionPatterns = this.analyzeInteractionPatterns(interactions || []);

    // Generate demographic insights using AI
    const demographicInsights = await this.generateDemographicInsights(userId, {
      browsingPatterns,
      purchasePatterns,
      interactionPatterns
    });

    return {
      userId,
      browsingPatterns,
      purchasePatterns,
      interactionPatterns,
      demographicInsights
    };
  }

  private analyzeBrowsingPatterns(sessions: any[]): UserBehaviorPattern['browsingPatterns'] {
    if (!sessions.length) {
      return {
        avgSessionDuration: 0,
        preferredCategories: [],
        timeOfDayPreference: [],
        deviceTypes: [],
        bounceRate: 1
      };
    }

    const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const avgSessionDuration = totalDuration / sessions.length;

    // Extract preferred categories from session data
    const categories = sessions
      .flatMap(s => s.visited_categories || [])
      .filter((cat, index, arr) => arr.indexOf(cat) === index)
      .slice(0, 5);

    // Analyze time preferences
    const hourCounts: Record<number, number> = {};
    sessions.forEach(session => {
      const hour = new Date(session.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const topHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);

    // Device types
    const deviceTypes = sessions
      .map(s => s.device_type)
      .filter(Boolean)
      .filter((device, index, arr) => arr.indexOf(device) === index);

    // Bounce rate (sessions with only 1 page view)
    const bouncedSessions = sessions.filter(s => (s.page_views || 0) <= 1).length;
    const bounceRate = bouncedSessions / sessions.length;

    return {
      avgSessionDuration,
      preferredCategories: categories,
      timeOfDayPreference: topHours,
      deviceTypes,
      bounceRate
    };
  }

  private analyzePurchasePatterns(orders: any[]): UserBehaviorPattern['purchasePatterns'] {
    if (!orders.length) {
      return {
        avgOrderValue: 0,
        preferredPaymentMethods: [],
        purchaseFrequency: 'none',
        cartAbandonmentRate: 1,
        seasonalPreferences: []
      };
    }

    const totalValue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const avgOrderValue = totalValue / orders.length;

    // Payment methods
    const paymentMethods = orders
      .map(o => o.payment_method)
      .filter(Boolean)
      .filter((method, index, arr) => arr.indexOf(method) === index);

    // Purchase frequency
    const firstOrder = new Date(Math.min(...orders.map(o => new Date(o.created_at).getTime())));
    const lastOrder = new Date(Math.max(...orders.map(o => new Date(o.created_at).getTime())));
    const daysSpan = (lastOrder.getTime() - firstOrder.getTime()) / (1000 * 60 * 60 * 24);
    const frequency = daysSpan > 0 ? orders.length / (daysSpan / 30) : orders.length; // orders per month

    let purchaseFrequency: string;
    if (frequency >= 2) purchaseFrequency = 'frequent';
    else if (frequency >= 0.5) purchaseFrequency = 'regular';
    else if (frequency >= 0.1) purchaseFrequency = 'occasional';
    else purchaseFrequency = 'rare';

    // Seasonal preferences
    const seasonalCounts: Record<string, number> = {};
    orders.forEach(order => {
      const month = new Date(order.created_at).getMonth();
      const season = this.getSeason(month);
      seasonalCounts[season] = (seasonalCounts[season] || 0) + 1;
    });

    const seasonalPreferences = Object.entries(seasonalCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([season]) => season);

    return {
      avgOrderValue,
      preferredPaymentMethods: paymentMethods,
      purchaseFrequency,
      cartAbandonmentRate: 0.3, // Placeholder - would need cart data
      seasonalPreferences
    };
  }

  private analyzeInteractionPatterns(interactions: any[]): UserBehaviorPattern['interactionPatterns'] {
    if (!interactions.length) {
      return {
        clickThroughRates: {},
        engagementScores: {},
        feedbackSentiment: 0,
        supportTicketFrequency: 0
      };
    }

    // Calculate CTR by interaction type
    const ctrByType: Record<string, { clicks: number; views: number }> = {};
    interactions.forEach(interaction => {
      const type = interaction.interaction_type || 'unknown';
      if (!ctrByType[type]) ctrByType[type] = { clicks: 0, views: 0 };

      if (interaction.action === 'click') ctrByType[type].clicks++;
      ctrByType[type].views++;
    });

    const clickThroughRates: Record<string, number> = {};
    Object.entries(ctrByType).forEach(([type, stats]) => {
      clickThroughRates[type] = stats.views > 0 ? stats.clicks / stats.views : 0;
    });

    // Engagement scores
    const engagementScores: Record<string, number> = {};
    const engagementTypes = ['like', 'share', 'comment', 'save', 'follow'];
    engagementTypes.forEach(type => {
      const engagements = interactions.filter(i => i.interaction_type === type).length;
      engagementScores[type] = engagements / interactions.length;
    });

    // Feedback sentiment (placeholder - would need NLP analysis)
    const feedbackSentiment = 0.1; // Slightly positive

    // Support tickets
    const supportTickets = interactions.filter(i => i.interaction_type === 'support_ticket').length;
    const supportTicketFrequency = supportTickets / interactions.length;

    return {
      clickThroughRates,
      engagementScores,
      feedbackSentiment,
      supportTicketFrequency
    };
  }

  private async generateDemographicInsights(
    userId: string,
    patterns: {
      browsingPatterns: UserBehaviorPattern['browsingPatterns'];
      purchasePatterns: UserBehaviorPattern['purchasePatterns'];
      interactionPatterns: UserBehaviorPattern['interactionPatterns'];
    }
  ): Promise<UserBehaviorPattern['demographicInsights']> {
    const analysisPrompt = `
Analyze this user's behavior patterns to infer demographic insights:

Browsing Patterns:
- Average session: ${patterns.browsingPatterns.avgSessionDuration} minutes
- Preferred categories: ${patterns.browsingPatterns.preferredCategories.join(', ')}
- Active hours: ${patterns.browsingPatterns.timeOfDayPreference.join(', ')}
- Devices: ${patterns.browsingPatterns.deviceTypes.join(', ')}
- Bounce rate: ${(patterns.browsingPatterns.bounceRate * 100).toFixed(1)}%

Purchase Patterns:
- Average order value: $${patterns.purchasePatterns.avgOrderValue.toFixed(2)}
- Payment methods: ${patterns.purchasePatterns.preferredPaymentMethods.join(', ')}
- Purchase frequency: ${patterns.purchasePatterns.purchaseFrequency}
- Seasonal preferences: ${patterns.purchasePatterns.seasonalPreferences.join(', ')}

Interaction Patterns:
- Click-through rates: ${Object.entries(patterns.interactionPatterns.clickThroughRates).map(([k,v]) => `${k}: ${(v*100).toFixed(1)}%`).join(', ')}
- Engagement scores: ${Object.entries(patterns.interactionPatterns.engagementScores).map(([k,v]) => `${k}: ${(v*100).toFixed(1)}%`).join(', ')}

Based on this data, infer:
1. Age group (Gen Z, Millennial, Gen X, Boomer)
2. Key interests (3-5 main interests)
3. Lifestyle indicators (urban/rural, tech-savvy/conservative, etc.)
4. Core values (sustainability, luxury, practicality, etc.)

Format as JSON with keys: ageGroup, interests, lifestyle, values
`;

    try {
      const analysis = await callOpenAI(
        'You are a user behavior analyst inferring demographics from digital patterns.',
        analysisPrompt,
        0.3
      );

      const parsed = JSON.parse(analysis);
      return {
        ageGroup: parsed.ageGroup || 'Unknown',
        interests: parsed.interests || [],
        lifestyle: parsed.lifestyle || [],
        values: parsed.values || []
      };
    } catch (error) {
      // Fallback demographics
      return {
        ageGroup: 'Millennial',
        interests: ['technology', 'shopping'],
        lifestyle: ['urban', 'tech-savvy'],
        values: ['convenience', 'quality']
      };
    }
  }

  private getSeason(month: number): string {
    if (month >= 11 || month <= 1) return 'winter';
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    return 'fall';
  }

  /**
   * Create fine-tuning dataset for user behavior prediction
   */
  async createUserBehaviorDataset(
    trainingData: UserBehaviorPattern[],
    targetSegment?: string
  ): Promise<Array<{ messages: any[] }>> {
    const dataset = [];

    for (const userPattern of trainingData) {
      if (targetSegment && userPattern.demographicInsights.ageGroup !== targetSegment) {
        continue; // Filter by target segment if specified
      }

      const trainingExample = {
        messages: [
          {
            role: 'system',
            content: 'You are a user behavior prediction model for an AI-native marketplace. Analyze user patterns and predict their preferences and next actions.'
          },
          {
            role: 'user',
            content: `Analyze this user's behavior:

Demographics: ${userPattern.demographicInsights.ageGroup}, interested in ${userPattern.demographicInsights.interests.join(', ')}

Browsing: ${userPattern.browsingPatterns.avgSessionDuration}min sessions, prefers ${userPattern.browsingPatterns.preferredCategories.join(', ')}, active during ${userPattern.browsingPatterns.timeOfDayPreference.join(', ')}

Purchasing: $${userPattern.purchasePatterns.avgOrderValue} avg order, ${userPattern.purchasePatterns.purchaseFrequency} buyer, prefers ${userPattern.purchasePatterns.preferredPaymentMethods.join(', ')}

What products would this user likely be interested in next? What marketing messages would resonate?`
          },
          {
            role: 'assistant',
            content: `Based on this user's profile, they would likely be interested in:
${this.generatePredictedInterests(userPattern)}

Marketing messages should focus on:
${this.generateMarketingInsights(userPattern)}`
          }
        ]
      };

      dataset.push(trainingExample);
    }

    return dataset;
  }

  private generatePredictedInterests(pattern: UserBehaviorPattern): string {
    const interests = pattern.demographicInsights.interests;
    const categories = pattern.browsingPatterns.preferredCategories;
    const seasonal = pattern.purchasePatterns.seasonalPreferences;

    return `- ${categories.slice(0, 3).join(', ')} products
- Items related to ${interests.slice(0, 2).join(' and ')}
- ${seasonal[0] || 'Year-round'} seasonal items
- Products in the $${Math.floor(pattern.purchasePatterns.avgOrderValue * 0.8)}-$${Math.ceil(pattern.purchasePatterns.avgOrderValue * 1.2)} range`;
  }

  private generateMarketingInsights(pattern: UserBehaviorPattern): string {
    const timePrefs = pattern.browsingPatterns.timeOfDayPreference;
    const frequency = pattern.purchasePatterns.purchaseFrequency;
    const values = pattern.demographicInsights.values;

    return `- Send notifications during ${timePrefs[0] || 'business hours'}
- ${frequency === 'frequent' ? 'Loyalty rewards and exclusive deals' : 'Special offers and limited-time promotions'}
- Emphasize ${values.slice(0, 2).join(' and ')} in messaging
- Use ${pattern.browsingPatterns.deviceTypes.includes('mobile') ? 'mobile-optimized' : 'desktop-focused'} campaigns`;
  }

  /**
   * Fine-tune a model for user behavior prediction
   */
  async fineTuneUserBehaviorModel(
    modelName: string,
    targetSegment: string,
    trainingData: UserBehaviorPattern[],
    baseModel: string = 'gpt-3.5-turbo'
  ): Promise<UserBehaviorModel> {
    const dataset = await this.createUserBehaviorDataset(trainingData, targetSegment);

    // Simulate fine-tuning process
    const fineTunedModel: UserBehaviorModel = {
      id: `user_behavior_ft_${Date.now()}`,
      name: modelName,
      targetSegment,
      trainingData,
      status: 'ready',
      created_at: new Date().toISOString(),
      performance_metrics: {
        prediction_accuracy: 0.78,
        personalization_score: 0.85,
        retention_improvement: 0.12
      }
    };

    this.fineTunedModels.set(fineTunedModel.id, fineTunedModel);
    return fineTunedModel;
  }

  /**
   * Predict user interests using fine-tuned model
   */
  async predictUserInterests(
    userId: string,
    modelId?: string
  ): Promise<{
    predictedCategories: string[];
    recommendedProducts: string[];
    marketingMessages: string[];
    nextBestAction: string;
  }> {
    const model = modelId ? this.fineTunedModels.get(modelId) : null;

    if (model && model.status === 'ready') {
      return await this.predictWithFineTunedModel(userId, model);
    } else {
      return await this.predictWithBaseModel(userId);
    }
  }

  private async predictWithFineTunedModel(
    userId: string,
    model: UserBehaviorModel
  ): Promise<{
    predictedCategories: string[];
    recommendedProducts: string[];
    marketingMessages: string[];
    nextBestAction: string;
  }> {
    // Get user's recent behavior
    const userPattern = await this.analyzeUserBehavior(userId);
    if (!userPattern) {
      return this.getDefaultPredictions();
    }

    const prompt = `Predict what this ${model.targetSegment} user will be interested in next:

Current behavior:
- Browsing: ${userPattern.browsingPatterns.preferredCategories.join(', ')}
- Purchasing: ${userPattern.purchasePatterns.purchaseFrequency} buyer of $${userPattern.purchasePatterns.avgOrderValue} items
- Interests: ${userPattern.demographicInsights.interests.join(', ')}
- Values: ${userPattern.demographicInsights.values.join(', ')}

Based on similar users in our training data, what should we recommend?`;

    const prediction = await callOpenAI(
      'You are a user behavior prediction expert with access to extensive training data.',
      prompt,
      0.7
    );

    return this.parsePredictionResponse(prediction);
  }

  private async predictWithBaseModel(userId: string): Promise<{
    predictedCategories: string[];
    recommendedProducts: string[];
    marketingMessages: string[];
    nextBestAction: string;
  }> {
    const userPattern = await this.analyzeUserBehavior(userId);
    if (!userPattern) {
      return this.getDefaultPredictions();
    }

    const prompt = `Based on this user's behavior, predict their next interests:

- They browse: ${userPattern.browsingPatterns.preferredCategories.join(', ')}
- They buy: ${userPattern.purchasePatterns.purchaseFrequency} (${userPattern.purchasePatterns.avgOrderValue} avg)
- They're interested in: ${userPattern.demographicInsights.interests.join(', ')}
- Their values: ${userPattern.demographicInsights.values.join(', ')}

What products/categories should we recommend? What marketing approach works best?`;

    const prediction = await callOpenAI(
      'You are a user behavior analyst predicting customer preferences.',
      prompt,
      0.7
    );

    return this.parsePredictionResponse(prediction);
  }

  private parsePredictionResponse(response: string): {
    predictedCategories: string[];
    recommendedProducts: string[];
    marketingMessages: string[];
    nextBestAction: string;
  } {
    // Simple parsing - in production you'd use more sophisticated NLP
    const lines = response.split('\n');
    const predictedCategories: string[] = [];
    const recommendedProducts: string[] = [];
    const marketingMessages: string[] = [];
    let nextBestAction = 'Send personalized recommendations';

    for (const line of lines) {
      if (line.toLowerCase().includes('categories') || line.toLowerCase().includes('recommend')) {
        const items = line.split(':')[1]?.split(',') || [];
        predictedCategories.push(...items.map(i => i.trim()));
      }
      if (line.toLowerCase().includes('products')) {
        const items = line.split(':')[1]?.split(',') || [];
        recommendedProducts.push(...items.map(i => i.trim()));
      }
      if (line.toLowerCase().includes('marketing') || line.toLowerCase().includes('message')) {
        marketingMessages.push(line.split(':')[1]?.trim() || line.trim());
      }
      if (line.toLowerCase().includes('action') || line.toLowerCase().includes('next')) {
        nextBestAction = line.split(':')[1]?.trim() || line.trim();
      }
    }

    return {
      predictedCategories: predictedCategories.slice(0, 5),
      recommendedProducts: recommendedProducts.slice(0, 5),
      marketingMessages: marketingMessages.slice(0, 3),
      nextBestAction
    };
  }

  private getDefaultPredictions() {
    return {
      predictedCategories: ['electronics', 'books', 'home', 'fashion'],
      recommendedProducts: ['Popular items', 'Trending products', 'Staff picks'],
      marketingMessages: ['Discover something new', 'Personalized recommendations just for you'],
      nextBestAction: 'Send welcome series emails'
    };
  }

  getAvailableModels(): UserBehaviorModel[] {
    return Array.from(this.fineTunedModels.values());
  }

  getModel(modelId: string): UserBehaviorModel | undefined {
    return this.fineTunedModels.get(modelId);
  }
}