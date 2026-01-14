/**
 * AI Analytics with Natural Language Generation
 * Generates insights and narratives from data
 */

import { supabase } from '../supabaseClient';
import { AIRouter } from '../ai/modelRouter';

export interface AnalyticsInsight {
  type: 'trend' | 'anomaly' | 'opportunity' | 'warning' | 'achievement';
  title: string;
  description: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  suggested_actions: string[];
  metrics: Record<string, number>;
  generated_at: string;
}

export interface AnalyticsNarrative {
  summary: string;
  highlights: string[];
  concerns: string[];
  recommendations: string[];
  forecast: string;
}

export class AIAnalytics {
  /**
   * Generate analytics narrative
   */
  static async generateNarrative(
    microstoreId: string,
    period: 'day' | 'week' | 'month' = 'week'
  ): Promise<AnalyticsNarrative> {
    console.log(`📊 Generating analytics narrative for period: ${period}`);

    const data = await this.gatherAnalytics(microstoreId, period);
    const insights = await this.detectInsights(data);

    const narrative = await this.narrateWithAI(data, insights);

    // Save narrative
    await supabase.from('analytics_narratives').insert({
      microstore_id: microstoreId,
      period,
      narrative,
      generated_at: new Date().toISOString(),
    });

    return narrative;
  }

  /**
   * Gather analytics data
   */
  private static async gatherAnalytics(
    microstoreId: string,
    period: 'day' | 'week' | 'month'
  ): Promise<any> {
    const daysBack = period === 'day' ? 1 : period === 'week' ? 7 : 30;
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    const { data: events } = await supabase
      .from('analytics')
      .select('*')
      .eq('microstore_id', microstoreId)
      .gte('created_at', startDate.toISOString());

    if (!events) return { total: 0 };

    const views = events.filter((e) => e.event_type === 'view').length;
    const clicks = events.filter((e) => e.event_type === 'click').length;
    const addToCarts = events.filter((e) => e.event_type === 'add_to_cart').length;
    const purchases = events.filter((e) => e.event_type === 'purchase').length;
    const searches = events.filter((e) => e.event_type === 'search').length;

    // Get product performance
    const productViews: Record<string, number> = {};
    events.forEach((e) => {
      if (e.product_id && e.event_type === 'view') {
        productViews[e.product_id] = (productViews[e.product_id] || 0) + 1;
      }
    });

    const topProducts = Object.entries(productViews)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // Calculate rates
    const conversionRate = views > 0 ? purchases / views : 0;
    const cartRate = views > 0 ? addToCarts / views : 0;
    const clickRate = views > 0 ? clicks / views : 0;

    // Get revenue data
    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('microstore_id', microstoreId)
      .gte('created_at', startDate.toISOString());

    const totalRevenue = orders?.reduce((sum, o) => sum + parseFloat(o.total_amount), 0) || 0;
    const avgOrderValue = orders && orders.length > 0 ? totalRevenue / orders.length : 0;

    return {
      period,
      daysBack,
      total: events.length,
      views,
      clicks,
      addToCarts,
      purchases,
      searches,
      conversionRate,
      cartRate,
      clickRate,
      topProducts,
      totalRevenue,
      avgOrderValue,
      orders: orders?.length || 0,
    };
  }

  /**
   * Detect insights from data
   */
  private static async detectInsights(data: any): Promise<AnalyticsInsight[]> {
    const insights: AnalyticsInsight[] = [];

    // Conversion rate insights
    if (data.conversionRate < 0.02) {
      insights.push({
        type: 'warning',
        title: 'Low Conversion Rate',
        description: `Conversion rate is ${(data.conversionRate * 100).toFixed(2)}%, below industry average`,
        impact: 'high',
        suggested_actions: [
          'Review product descriptions and images',
          'Optimize pricing strategy',
          'Improve checkout experience',
          'Add social proof and reviews',
        ],
        metrics: { conversion_rate: data.conversionRate },
        generated_at: new Date().toISOString(),
      });
    } else if (data.conversionRate > 0.05) {
      insights.push({
        type: 'achievement',
        title: 'Strong Conversion Rate',
        description: `Conversion rate of ${(data.conversionRate * 100).toFixed(2)}% exceeds benchmarks`,
        impact: 'medium',
        suggested_actions: [
          'Document what\'s working',
          'Scale successful strategies',
          'Test price increases',
        ],
        metrics: { conversion_rate: data.conversionRate },
        generated_at: new Date().toISOString(),
      });
    }

    // Cart abandonment
    if (data.addToCarts > 0) {
      const cartAbandonRate = 1 - data.purchases / data.addToCarts;
      if (cartAbandonRate > 0.7) {
        insights.push({
          type: 'warning',
          title: 'High Cart Abandonment',
          description: `${(cartAbandonRate * 100).toFixed(0)}% of carts are abandoned`,
          impact: 'high',
          suggested_actions: [
            'Simplify checkout process',
            'Add trust signals',
            'Review shipping costs',
            'Implement cart recovery emails',
          ],
          metrics: { cart_abandon_rate: cartAbandonRate },
          generated_at: new Date().toISOString(),
        });
      }
    }

    // Traffic trend
    if (data.views < 100 && data.period === 'week') {
      insights.push({
        type: 'opportunity',
        title: 'Traffic Growth Opportunity',
        description: `Only ${data.views} views this ${data.period}`,
        impact: 'medium',
        suggested_actions: [
          'Increase social media posting',
          'Optimize SEO',
          'Run promotional campaigns',
          'Improve product discoverability',
        ],
        metrics: { views: data.views },
        generated_at: new Date().toISOString(),
      });
    }

    // Search behavior
    if (data.searches > data.views * 0.3) {
      insights.push({
        type: 'trend',
        title: 'High Search Activity',
        description: `Users are searching heavily (${data.searches} searches vs ${data.views} views)`,
        impact: 'medium',
        suggested_actions: [
          'Analyze top search terms',
          'Improve product categorization',
          'Add more search filters',
          'Consider adding search suggestions',
        ],
        metrics: { search_ratio: data.searches / data.views },
        generated_at: new Date().toISOString(),
      });
    }

    return insights;
  }

  /**
   * Generate narrative using AI
   */
  private static async narrateWithAI(
    data: any,
    insights: AnalyticsInsight[]
  ): Promise<AnalyticsNarrative> {
    const systemPrompt = `You are a business intelligence analyst. Generate a narrative summary of analytics data.

Be:
- Clear and actionable
- Data-driven
- Strategic
- Concise

Return JSON:
{
  "summary": "2-3 sentence overview of performance",
  "highlights": ["positive point 1", "positive point 2"],
  "concerns": ["concern 1", "concern 2"],
  "recommendations": ["action 1", "action 2", "action 3"],
  "forecast": "1-2 sentence prediction for next period"
}`;

    const userPrompt = `Period: ${data.period} (last ${data.daysBack} days)

Metrics:
- Total Events: ${data.total}
- Views: ${data.views}
- Clicks: ${data.clicks}
- Add to Carts: ${data.addToCarts}
- Purchases: ${data.purchases}
- Conversion Rate: ${(data.conversionRate * 100).toFixed(2)}%
- Cart Rate: ${(data.cartRate * 100).toFixed(2)}%
- Click Rate: ${(data.clickRate * 100).toFixed(2)}%
- Total Revenue: $${data.totalRevenue.toFixed(2)}
- Avg Order Value: $${data.avgOrderValue.toFixed(2)}
- Orders: ${data.orders}

Detected Insights:
${insights.map((i) => `- ${i.title}: ${i.description}`).join('\n')}

Generate analytics narrative.`;

    try {
      const router = AIRouter.getInstance();
      const response = await router.executeTask({
        id: `analytics-narrative-${Date.now()}`,
        type: 'analysis',
        content: userPrompt,
        systemPrompt,
        temperature: 0.7,
        priority: 'medium'
      });
      const narrative = JSON.parse(response);
      return narrative;
    } catch (error) {
      console.error('Error generating narrative:', error);
      return {
        summary: `Analyzed ${data.total} events over ${data.period}`,
        highlights: [],
        concerns: [],
        recommendations: [],
        forecast: 'Continue monitoring performance',
      };
    }
  }

  /**
   * Highlight anomalies
   */
  static async detectAnomalies(
    microstoreId: string
  ): Promise<AnalyticsInsight[]> {
    const anomalies: AnalyticsInsight[] = [];

    // Compare today vs yesterday
    const today = await this.gatherAnalytics(microstoreId, 'day');
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const { data: yesterdayEvents } = await supabase
      .from('analytics')
      .select('*')
      .eq('microstore_id', microstoreId)
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', new Date().toISOString());

    const yesterdayViews = yesterdayEvents?.filter((e) => e.event_type === 'view').length || 0;

    if (yesterdayViews > 0) {
      const change = (today.views - yesterdayViews) / yesterdayViews;

      if (change < -0.5) {
        anomalies.push({
          type: 'anomaly',
          title: 'Traffic Drop Detected',
          description: `Views dropped ${Math.abs(change * 100).toFixed(0)}% from yesterday`,
          impact: 'critical',
          suggested_actions: [
            'Check for technical issues',
            'Review recent changes',
            'Investigate external factors',
          ],
          metrics: { change },
          generated_at: new Date().toISOString(),
        });
      } else if (change > 1.0) {
        anomalies.push({
          type: 'anomaly',
          title: 'Traffic Spike Detected',
          description: `Views increased ${(change * 100).toFixed(0)}% from yesterday`,
          impact: 'medium',
          suggested_actions: [
            'Identify traffic source',
            'Ensure inventory is sufficient',
            'Prepare for increased demand',
          ],
          metrics: { change },
          generated_at: new Date().toISOString(),
        });
      }
    }

    return anomalies;
  }

  /**
   * Suggest actions based on analytics
   */
  static async suggestActions(microstoreId: string): Promise<string[]> {
    const narrative = await this.generateNarrative(microstoreId, 'week');
    const insights = await this.detectInsights(await this.gatherAnalytics(microstoreId, 'week'));

    const allActions = [
      ...narrative.recommendations,
      ...insights.flatMap((i) => i.suggested_actions),
    ];

    // Deduplicate and prioritize
    return Array.from(new Set(allActions)).slice(0, 5);
  }

  /**
   * Generate executive summary
   */
  static async generateExecutiveSummary(microstoreId: string): Promise<string> {
    const weekData = await this.gatherAnalytics(microstoreId, 'week');
    const monthData = await this.gatherAnalytics(microstoreId, 'month');

    const systemPrompt = `You are a business executive assistant. Generate a concise executive summary of e-commerce performance.

Format as 3-4 paragraphs, suitable for C-level audience.`;

    const userPrompt = `Weekly Performance:
- Views: ${weekData.views}
- Purchases: ${weekData.purchases}
- Conversion: ${(weekData.conversionRate * 100).toFixed(2)}%
- Revenue: $${weekData.totalRevenue.toFixed(2)}

Monthly Performance:
- Views: ${monthData.views}
- Purchases: ${monthData.purchases}
- Conversion: ${(monthData.conversionRate * 100).toFixed(2)}%
- Revenue: $${monthData.totalRevenue.toFixed(2)}

Generate executive summary.`;

    try {
      const router = AIRouter.getInstance();
      const summary = await router.executeTask({
        id: `executive-summary-${Date.now()}`,
        type: 'analysis',
        content: userPrompt,
        systemPrompt,
        temperature: 0.6,
        priority: 'medium'
      });
      return summary;
    } catch (error) {
      return 'Unable to generate summary';
    }
  }
}
