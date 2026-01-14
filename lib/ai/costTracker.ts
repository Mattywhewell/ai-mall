import { supabase } from '@/lib/supabaseClient';

export interface ProviderCostMetrics {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number; // in USD
  timestamp: string;
  taskType: string;
  success: boolean;
  latency: number; // in milliseconds
}

export interface BudgetLimits {
  provider: string;
  dailyLimit: number;
  monthlyLimit: number;
  warningThreshold: number; // percentage (0-1)
}

export interface CostOptimization {
  provider: string;
  model: string;
  efficiency: number; // tokens per dollar
  avgLatency: number;
  successRate: number;
  recommendation: 'keep' | 'reduce' | 'increase' | 'replace';
  reason: string;
}

export class CostTracker {
  private static instance: CostTracker;
  private budgetLimits: Map<string, BudgetLimits> = new Map();
  private costCache: Map<string, ProviderCostMetrics[]> = new Map();

  private constructor() {
    this.initializeBudgetLimits();
  }

  static getInstance(): CostTracker {
    if (!CostTracker.instance) {
      CostTracker.instance = new CostTracker();
    }
    return CostTracker.instance;
  }

  private initializeBudgetLimits() {
    // Default budget limits - can be configured per environment
    this.budgetLimits.set('openai', {
      provider: 'openai',
      dailyLimit: 50, // $50/day
      monthlyLimit: 1000, // $1000/month
      warningThreshold: 0.8 // 80%
    });

    this.budgetLimits.set('anthropic', {
      provider: 'anthropic',
      dailyLimit: 30,
      monthlyLimit: 600,
      warningThreshold: 0.8
    });

    this.budgetLimits.set('azure-openai', {
      provider: 'azure-openai',
      dailyLimit: 75,
      monthlyLimit: 1500,
      warningThreshold: 0.8
    });

    this.budgetLimits.set('grok', {
      provider: 'grok',
      dailyLimit: 10,
      monthlyLimit: 200,
      warningThreshold: 0.8
    });

    this.budgetLimits.set('huggingface', {
      provider: 'huggingface',
      dailyLimit: 1000000, // Essentially unlimited since it's free
      monthlyLimit: 10000000,
      warningThreshold: 0.99
    });

    this.budgetLimits.set('local', {
      provider: 'local',
      dailyLimit: 0, // No cost for local models
      monthlyLimit: 0,
      warningThreshold: 1
    });
  }

  /**
   * Record a cost event
   */
  async recordCost(metrics: ProviderCostMetrics): Promise<void> {
    try {
      // Store in database
      const { error } = await supabase
        .from('ai_cost_tracking')
        .insert({
          provider: metrics.provider,
          model: metrics.model,
          input_tokens: metrics.inputTokens,
          output_tokens: metrics.outputTokens,
          total_tokens: metrics.totalTokens,
          cost_usd: metrics.cost,
          task_type: metrics.taskType,
          success: metrics.success,
          latency_ms: metrics.latency,
          created_at: metrics.timestamp
        });

      if (error) {
        console.error('Error recording cost metrics:', error);
        return;
      }

      // Update cache
      const cacheKey = `${metrics.provider}_${metrics.model}`;
      if (!this.costCache.has(cacheKey)) {
        this.costCache.set(cacheKey, []);
      }
      this.costCache.get(cacheKey)!.push(metrics);

      // Keep cache size manageable
      const cache = this.costCache.get(cacheKey)!;
      if (cache.length > 1000) {
        cache.splice(0, cache.length - 1000);
      }

    } catch (error) {
      console.error('Failed to record cost metrics:', error);
    }
  }

  /**
   * Get cost metrics for a time period
   */
  async getCostMetrics(
    provider?: string,
    startDate?: string,
    endDate?: string
  ): Promise<ProviderCostMetrics[]> {
    const query = supabase
      .from('ai_cost_tracking')
      .select('*')
      .order('created_at', { ascending: false });

    if (provider) {
      query.eq('provider', provider);
    }

    if (startDate) {
      query.gte('created_at', startDate);
    }

    if (endDate) {
      query.lte('created_at', endDate);
    }

    const { data, error } = await query.limit(10000);

    if (error) {
      console.error('Error fetching cost metrics:', error);
      return [];
    }

    return (data || []).map(row => ({
      provider: row.provider,
      model: row.model,
      inputTokens: row.input_tokens,
      outputTokens: row.output_tokens,
      totalTokens: row.total_tokens,
      cost: row.cost_usd,
      timestamp: row.created_at,
      taskType: row.task_type,
      success: row.success,
      latency: row.latency_ms
    }));
  }

  /**
   * Calculate current spending against budget
   */
  async getBudgetStatus(provider: string): Promise<{
    currentDaily: number;
    currentMonthly: number;
    dailyLimit: number;
    monthlyLimit: number;
    dailyPercentage: number;
    monthlyPercentage: number;
    warnings: string[];
  }> {
    const limits = this.budgetLimits.get(provider);
    if (!limits) {
      return {
        currentDaily: 0,
        currentMonthly: 0,
        dailyLimit: 0,
        monthlyLimit: 0,
        dailyPercentage: 0,
        monthlyPercentage: 0,
        warnings: []
      };
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Get today's costs
    const todayCosts = await this.getCostMetrics(provider, today, today + 'T23:59:59');
    const currentDaily = todayCosts.reduce((sum, cost) => sum + cost.cost, 0);

    // Get this month's costs
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthCosts = await this.getCostMetrics(provider, monthStart);
    const currentMonthly = monthCosts.reduce((sum, cost) => sum + cost.cost, 0);

    const dailyPercentage = currentDaily / limits.dailyLimit;
    const monthlyPercentage = currentMonthly / limits.monthlyLimit;

    const warnings: string[] = [];
    if (dailyPercentage >= limits.warningThreshold) {
      warnings.push(`Daily budget ${Math.round(dailyPercentage * 100)}% used`);
    }
    if (monthlyPercentage >= limits.warningThreshold) {
      warnings.push(`Monthly budget ${Math.round(monthlyPercentage * 100)}% used`);
    }
    if (dailyPercentage >= 1) {
      warnings.push('Daily budget exceeded!');
    }
    if (monthlyPercentage >= 1) {
      warnings.push('Monthly budget exceeded!');
    }

    return {
      currentDaily,
      currentMonthly,
      dailyLimit: limits.dailyLimit,
      monthlyLimit: limits.monthlyLimit,
      dailyPercentage,
      monthlyPercentage,
      warnings
    };
  }

  /**
   * Get cost optimization recommendations
   */
  async getCostOptimizations(): Promise<CostOptimization[]> {
    const allMetrics = await this.getCostMetrics();
    const optimizations: CostOptimization[] = [];

    // Group by provider and model
    const groupedMetrics = new Map<string, ProviderCostMetrics[]>();
    allMetrics.forEach(metric => {
      const key = `${metric.provider}_${metric.model}`;
      if (!groupedMetrics.has(key)) {
        groupedMetrics.set(key, []);
      }
      groupedMetrics.get(key)!.push(metric);
    });

    for (const [key, metrics] of groupedMetrics) {
      const [provider, model] = key.split('_');
      const optimization = this.analyzeProviderEfficiency(provider, model, metrics);
      optimizations.push(optimization);
    }

    return optimizations.sort((a, b) => b.efficiency - a.efficiency);
  }

  private analyzeProviderEfficiency(
    provider: string,
    model: string,
    metrics: ProviderCostMetrics[]
  ): CostOptimization {
    const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0);
    const totalTokens = metrics.reduce((sum, m) => sum + m.totalTokens, 0);
    const efficiency = totalTokens / totalCost; // tokens per dollar

    const avgLatency = metrics.reduce((sum, m) => sum + m.latency, 0) / metrics.length;
    const successRate = metrics.filter(m => m.success).length / metrics.length;

    let recommendation: CostOptimization['recommendation'] = 'keep';
    let reason = 'Balanced performance and cost';

    if (efficiency < 1000) { // Low efficiency
      if (successRate < 0.9) {
        recommendation = 'replace';
        reason = 'Poor reliability and high cost per token';
      } else {
        recommendation = 'reduce';
        reason = 'High cost per token, consider reducing usage';
      }
    } else if (efficiency > 5000) { // High efficiency
      if (successRate > 0.95 && avgLatency < 2000) {
        recommendation = 'increase';
        reason = 'Excellent value, consider increasing usage';
      }
    }

    // Special handling for local models
    if (provider === 'local') {
      recommendation = 'increase';
      reason = 'Zero cost, high efficiency - prefer for cost-sensitive tasks';
    }

    return {
      provider,
      model,
      efficiency,
      avgLatency,
      successRate,
      recommendation,
      reason
    };
  }

  /**
   * Check if a request should be allowed based on budget
   */
  async shouldAllowRequest(provider: string, estimatedCost: number): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const budgetStatus = await this.getBudgetStatus(provider);

    if (budgetStatus.dailyPercentage >= 1) {
      return {
        allowed: false,
        reason: `Daily budget exceeded (${budgetStatus.currentDaily.toFixed(2)}/${budgetStatus.dailyLimit})`
      };
    }

    if (budgetStatus.monthlyPercentage >= 1) {
      return {
        allowed: false,
        reason: `Monthly budget exceeded (${budgetStatus.currentMonthly.toFixed(2)}/${budgetStatus.monthlyLimit})`
      };
    }

    // Check if this request would exceed budget
    const projectedDaily = budgetStatus.currentDaily + estimatedCost;
    const projectedMonthly = budgetStatus.currentMonthly + estimatedCost;

    if (projectedDaily > budgetStatus.dailyLimit) {
      return {
        allowed: false,
        reason: `Request would exceed daily budget (${projectedDaily.toFixed(2)} > ${budgetStatus.dailyLimit})`
      };
    }

    if (projectedMonthly > budgetStatus.monthlyLimit) {
      return {
        allowed: false,
        reason: `Request would exceed monthly budget (${projectedMonthly.toFixed(2)} > ${budgetStatus.monthlyLimit})`
      };
    }

    return { allowed: true };
  }

  /**
   * Update budget limits
   */
  updateBudgetLimits(provider: string, limits: Partial<BudgetLimits>): void {
    const existing = this.budgetLimits.get(provider);
    if (existing) {
      this.budgetLimits.set(provider, { ...existing, ...limits });
    }
  }

  /**
   * Get cost summary for dashboard
   */
  async getCostSummary(): Promise<{
    totalCost: number;
    costByProvider: Record<string, number>;
    costByTaskType: Record<string, number>;
    topExpensiveTasks: Array<{
      taskType: string;
      provider: string;
      cost: number;
      count: number;
    }>;
    budgetAlerts: Array<{
      provider: string;
      type: 'daily' | 'monthly';
      percentage: number;
      message: string;
    }>;
  }> {
    const allMetrics = await this.getCostMetrics();

    const totalCost = allMetrics.reduce((sum, m) => sum + m.cost, 0);

    const costByProvider: Record<string, number> = {};
    const costByTaskType: Record<string, number> = {};
    const taskCounts: Record<string, { cost: number; count: number; provider: string }> = {};

    allMetrics.forEach(metric => {
      costByProvider[metric.provider] = (costByProvider[metric.provider] || 0) + metric.cost;
      costByTaskType[metric.taskType] = (costByTaskType[metric.taskType] || 0) + metric.cost;

      const taskKey = `${metric.taskType}_${metric.provider}`;
      if (!taskCounts[taskKey]) {
        taskCounts[taskKey] = { cost: 0, count: 0, provider: metric.provider };
      }
      taskCounts[taskKey].cost += metric.cost;
      taskCounts[taskKey].count += 1;
    });

    const topExpensiveTasks = Object.entries(taskCounts)
      .map(([key, data]) => {
        const [taskType] = key.split('_');
        return {
          taskType,
          provider: data.provider,
          cost: data.cost,
          count: data.count
        };
      })
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10);

    // Check budget alerts
    const budgetAlerts: Array<{
      provider: string;
      type: 'daily' | 'monthly';
      percentage: number;
      message: string;
    }> = [];

    for (const provider of Object.keys(costByProvider)) {
      const status = await this.getBudgetStatus(provider);
      if (status.warnings.length > 0) {
        if (status.dailyPercentage >= status.warningThreshold) {
          budgetAlerts.push({
            provider,
            type: 'daily',
            percentage: status.dailyPercentage,
            message: `Daily budget ${Math.round(status.dailyPercentage * 100)}% used`
          });
        }
        if (status.monthlyPercentage >= status.warningThreshold) {
          budgetAlerts.push({
            provider,
            type: 'monthly',
            percentage: status.monthlyPercentage,
            message: `Monthly budget ${Math.round(status.monthlyPercentage * 100)}% used`
          });
        }
      }
    }

    return {
      totalCost,
      costByProvider,
      costByTaskType,
      topExpensiveTasks,
      budgetAlerts
    };
  }

  /**
   * Export cost data for analysis
   */
  async exportCostData(startDate?: string, endDate?: string): Promise<string> {
    const metrics = await this.getCostMetrics(undefined, startDate, endDate);

    const csvHeader = 'timestamp,provider,model,task_type,input_tokens,output_tokens,total_tokens,cost_usd,success,latency_ms\n';
    const csvRows = metrics.map(m =>
      `${m.timestamp},${m.provider},${m.model},${m.taskType},${m.inputTokens},${m.outputTokens},${m.totalTokens},${m.cost},${m.success},${m.latency}`
    ).join('\n');

    return csvHeader + csvRows;
  }
}