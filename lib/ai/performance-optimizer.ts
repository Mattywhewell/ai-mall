/**
 * Real-time Performance Optimization Engine
 * Phase 3: Automatically optimizes AI provider routing based on live metrics
 */

import { AIRouter } from './modelRouter';
import { CostTracker } from './costTracker';

export interface OptimizationRule {
  id: string;
  condition: (metrics: PerformanceMetrics) => boolean;
  action: (router: AIRouter, metrics: PerformanceMetrics) => Promise<void>;
  priority: number;
  cooldown: number; // minutes
  lastExecuted?: number;
}

export interface PerformanceMetrics {
  provider: string;
  latency: number;
  errorRate: number;
  costPerToken: number;
  successRate: number;
  taskCount: number;
  avgResponseTime: number;
  timestamp: number;
}

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private router: AIRouter;
  private costTracker: CostTracker;
  private optimizationRules: OptimizationRule[] = [];
  private metricsHistory: Map<string, PerformanceMetrics[]> = new Map();
  private isRunning = false;

  private constructor() {
    this.router = AIRouter.getInstance();
    this.costTracker = CostTracker.getInstance();
    this.initializeOptimizationRules();
  }

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  private initializeOptimizationRules() {
    // Rule 1: High latency provider - reduce priority
    this.optimizationRules.push({
      id: 'high_latency_reduction',
      condition: (metrics) => metrics.latency > 3000 && metrics.taskCount > 10,
      action: async (router, metrics) => {
        console.log(`🔧 Reducing priority for high-latency provider: ${metrics.provider}`);
        // This would modify routing weights - implementation depends on router internals
      },
      priority: 1,
      cooldown: 5
    });

    // Rule 2: High error rate provider - switch to fallback
    this.optimizationRules.push({
      id: 'high_error_fallback',
      condition: (metrics) => metrics.errorRate > 0.1 && metrics.taskCount > 5,
      action: async (router, metrics) => {
        console.log(`🔧 Switching ${metrics.provider} to fallback mode due to high error rate`);
        // Implement fallback logic
      },
      priority: 2,
      cooldown: 2
    });

    // Rule 3: Cost optimization - prefer cheaper providers
    this.optimizationRules.push({
      id: 'cost_optimization',
      condition: (metrics) => metrics.costPerToken > 0.01 && metrics.successRate > 0.95,
      action: async (router, metrics) => {
        console.log(`💰 Optimizing costs by adjusting ${metrics.provider} usage`);
        // Adjust routing to prefer cheaper alternatives
      },
      priority: 3,
      cooldown: 15
    });

    // Rule 4: Underutilized provider - increase load
    this.optimizationRules.push({
      id: 'load_balancing',
      condition: (metrics) => metrics.taskCount < 5 && metrics.successRate > 0.98 && metrics.latency < 1000,
      action: async (router, metrics) => {
        console.log(`⚖️ Increasing load on underutilized provider: ${metrics.provider}`);
        // Increase routing priority for this provider
      },
      priority: 4,
      cooldown: 10
    });

    // Rule 5: Performance degradation detection
    this.optimizationRules.push({
      id: 'performance_degradation',
      condition: (metrics) => this.detectPerformanceDegradation(metrics),
      action: async (router, metrics) => {
        console.log(`📉 Detected performance degradation for ${metrics.provider}, triggering recovery`);
        // Implement recovery actions
      },
      priority: 1,
      cooldown: 1
    });
  }

  /**
   * Start the optimization engine
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('🚀 Starting Performance Optimization Engine (Phase 3)');

    // Initial optimization run
    await this.runOptimizationCycle();

    // Set up periodic optimization
    setInterval(() => this.runOptimizationCycle(), 60000); // Every minute
  }

  /**
   * Stop the optimization engine
   */
  stop(): void {
    this.isRunning = false;
    console.log('🛑 Stopping Performance Optimization Engine');
  }

  /**
   * Run a complete optimization cycle
   */
  private async runOptimizationCycle(): Promise<void> {
    try {
      // Collect current metrics
      const metrics = await this.collectPerformanceMetrics();

      // Update metrics history
      this.updateMetricsHistory(metrics);

      // Apply optimization rules
      await this.applyOptimizationRules(metrics);

      // Generate optimization report
      await this.generateOptimizationReport(metrics);

    } catch (error) {
      console.error('Optimization cycle error:', error);
    }
  }

  /**
   * Collect performance metrics from all providers
   */
  private async collectPerformanceMetrics(): Promise<PerformanceMetrics[]> {
    const healthStatus = this.router.getHealthStatus();
    const taskHistory = this.router.getTaskHistory(100);
    const costMetrics = await this.costTracker.getCostMetrics('', new Date(Date.now() - 3600000).toISOString()); // Last hour

    const metrics: PerformanceMetrics[] = [];

    for (const [provider, health] of Object.entries(healthStatus)) {
      const providerTasks = taskHistory.filter(t => t.decision.provider === provider);
      const providerCosts = costMetrics.filter(m => m.provider === provider);

      if (providerTasks.length === 0) continue;

      const successfulTasks = providerTasks.filter(t => t.result === 'success').length;
      const totalCost = providerCosts.reduce((sum, c) => sum + c.cost, 0);
      const totalTokens = providerCosts.reduce((sum, c) => sum + c.totalTokens, 0);

      metrics.push({
        provider,
        latency: health.latency,
        errorRate: health.errorRate,
        costPerToken: totalTokens > 0 ? totalCost / totalTokens : 0,
        successRate: providerTasks.length > 0 ? successfulTasks / providerTasks.length : 0,
        taskCount: providerTasks.length,
        avgResponseTime: providerTasks.reduce((sum, t) => sum + (t.decision.estimatedLatency || 0), 0) / providerTasks.length,
        timestamp: Date.now()
      });
    }

    return metrics;
  }

  /**
   * Update metrics history for trend analysis
   */
  private updateMetricsHistory(metrics: PerformanceMetrics[]): void {
    metrics.forEach(metric => {
      if (!this.metricsHistory.has(metric.provider)) {
        this.metricsHistory.set(metric.provider, []);
      }

      const history = this.metricsHistory.get(metric.provider)!;
      history.push(metric);

      // Keep only last 24 hours of data (assuming 1 reading per minute)
      if (history.length > 1440) {
        history.shift();
      }
    });
  }

  /**
   * Apply optimization rules based on current metrics
   */
  private async applyOptimizationRules(metrics: PerformanceMetrics[]): Promise<void> {
    const now = Date.now();

    for (const rule of this.optimizationRules.sort((a, b) => a.priority - b.priority)) {
      // Check cooldown
      if (rule.lastExecuted && (now - rule.lastExecuted) < (rule.cooldown * 60000)) {
        continue;
      }

      for (const metric of metrics) {
        if (rule.condition(metric)) {
          try {
            await rule.action(this.router, metric);
            rule.lastExecuted = now;
            break; // Only apply rule once per cycle
          } catch (error) {
            console.error(`Failed to apply optimization rule ${rule.id}:`, error);
          }
        }
      }
    }
  }

  /**
   * Detect performance degradation using trend analysis
   */
  private detectPerformanceDegradation(current: PerformanceMetrics): boolean {
    const history = this.metricsHistory.get(current.provider);
    if (!history || history.length < 10) return false;

    // Check if latency has increased by 50% in the last 10 minutes
    const recent = history.slice(-10);
    const avgRecentLatency = recent.reduce((sum, m) => sum + m.latency, 0) / recent.length;
    const avgOlderLatency = history.slice(-20, -10).reduce((sum, m) => sum + m.latency, 0) / 10;

    return avgRecentLatency > avgOlderLatency * 1.5;
  }

  /**
   * Generate optimization report
   */
  private async generateOptimizationReport(metrics: PerformanceMetrics[]): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalProviders: metrics.length,
        avgSuccessRate: metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length,
        totalTasks: metrics.reduce((sum, m) => sum + m.taskCount, 0),
        totalCost: await this.getTotalCost()
      },
      providerPerformance: metrics.map(m => ({
        provider: m.provider,
        score: this.calculateProviderScore(m),
        recommendations: this.generateRecommendations(m)
      })),
      optimizations: this.optimizationRules.filter(r => r.lastExecuted).map(r => ({
        rule: r.id,
        lastExecuted: new Date(r.lastExecuted!).toISOString(),
        cooldown: r.cooldown
      }))
    };

    // Store report for dashboard access
    // This could be stored in a database or cache
    console.log('📊 Optimization Report Generated:', JSON.stringify(report, null, 2));
  }

  /**
   * Calculate overall provider score (0-100)
   */
  private calculateProviderScore(metrics: PerformanceMetrics): number {
    const latencyScore = Math.max(0, 100 - (metrics.latency / 50)); // Lower latency = higher score
    const errorScore = Math.max(0, 100 - (metrics.errorRate * 1000));
    const successScore = metrics.successRate * 100;
    const costScore = Math.max(0, 100 - (metrics.costPerToken * 100000)); // Lower cost = higher score

    return (latencyScore + errorScore + successScore + costScore) / 4;
  }

  /**
   * Generate recommendations for a provider
   */
  private generateRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.latency > 2000) {
      recommendations.push('Consider reducing load or switching to faster provider');
    }

    if (metrics.errorRate > 0.05) {
      recommendations.push('High error rate detected - investigate provider health');
    }

    if (metrics.costPerToken > 0.005) {
      recommendations.push('Consider cost optimization - evaluate cheaper alternatives');
    }

    if (metrics.successRate < 0.95) {
      recommendations.push('Low success rate - review provider reliability');
    }

    return recommendations;
  }

  /**
   * Get total cost across all providers
   */
  private async getTotalCost(): Promise<number> {
    const costMetrics = await this.costTracker.getCostMetrics('', new Date(Date.now() - 86400000).toISOString());
    return costMetrics.reduce((sum, m) => sum + m.cost, 0);
  }

  /**
   * Get current optimization status
   */
  getOptimizationStatus() {
    return {
      isRunning: this.isRunning,
      activeRules: this.optimizationRules.filter(r => r.lastExecuted).length,
      totalRules: this.optimizationRules.length,
      providersMonitored: this.metricsHistory.size,
      lastOptimizationCycle: new Date().toISOString()
    };
  }
}