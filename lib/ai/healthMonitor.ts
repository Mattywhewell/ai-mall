import { CostTracker } from './costTracker';
import { AIRouter } from './modelRouter';
import { OfflineModeManager } from './offlineModeManager';

export interface HealthStatus {
  provider: string;
  model: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  latency: number; // average latency in ms
  successRate: number; // 0-1
  lastChecked: string;
  errorCount: number;
  totalRequests: number;
  costPerRequest: number;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  providers: HealthStatus[];
  alerts: HealthAlert[];
  recommendations: string[];
  lastUpdated: string;
}

export interface HealthAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  provider?: string;
  model?: string;
  timestamp: string;
  resolved: boolean;
}

export interface FailoverConfig {
  enabled: boolean;
  automaticFailover: boolean;
  failoverThreshold: number; // success rate threshold (0-1)
  recoveryAttempts: number;
  recoveryIntervalMinutes: number;
  alertThresholds: {
    latency: number; // ms
    errorRate: number; // 0-1
    costIncrease: number; // percentage
  };
}

export class HealthMonitor {
  private static instance: HealthMonitor;
  private costTracker = CostTracker.getInstance();
  private router = AIRouter.getInstance();
  private offlineManager = OfflineModeManager.getInstance();

  private healthStatus: Map<string, HealthStatus> = new Map();
  private alerts: HealthAlert[] = [];
  private failoverConfig: FailoverConfig;
  private monitoringInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.failoverConfig = {
      enabled: true,
      automaticFailover: true,
      failoverThreshold: 0.8,
      recoveryAttempts: 3,
      recoveryIntervalMinutes: 5,
      alertThresholds: {
        latency: 5000, // 5 seconds
        errorRate: 0.2, // 20% error rate
        costIncrease: 0.5 // 50% cost increase
      }
    };

    this.startMonitoring();
  }

  static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor();
    }
    return HealthMonitor.instance;
  }

  /**
   * Start continuous health monitoring
   */
  private startMonitoring(): void {
    // Health check every 2 minutes
    this.monitoringInterval = setInterval(async () => {
      await this.performHealthCheck();
      await this.checkFailoverConditions();
      this.cleanupOldAlerts();
    }, 2 * 60 * 1000);

    // Initial health check
    this.performHealthCheck();
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<void> {
    const providers = ['openai', 'anthropic', 'azure-openai', 'grok', 'huggingface', 'local'];
    const models = {
      openai: ['gpt-4', 'gpt-3.5-turbo'],
      anthropic: ['claude-3-opus', 'claude-3-haiku'],
      'azure-openai': ['gpt-4'],
      grok: ['grok-1'],
      huggingface: ['Xenova/gpt2', 'Xenova/distilbart-cnn-6-6'],
      local: ['llama-3.1-8b', 'mistral-7b']
    };

    for (const provider of providers) {
      for (const model of models[provider as keyof typeof models]) {
        try {
          const health = await this.checkProviderHealth(provider, model);
          this.healthStatus.set(`${provider}_${model}`, health);
        } catch (error) {
          console.error(`Health check failed for ${provider}/${model}:`, error);
          this.recordUnhealthyStatus(provider, model, error);
        }
      }
    }

    // Update overall system health
    await this.updateSystemHealth();
  }

  /**
   * Check individual provider/model health
   */
  private async checkProviderHealth(provider: string, model: string): Promise<HealthStatus> {
    const key = `${provider}_${model}`;
    const existing = this.healthStatus.get(key);

    // Get recent metrics (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const metrics = await this.costTracker.getCostMetrics(provider, yesterday);

    const modelMetrics = metrics.filter(m => m.model === model);
    const totalRequests = modelMetrics.length;
    const successfulRequests = modelMetrics.filter(m => m.success).length;
    const successRate = totalRequests > 0 ? successfulRequests / totalRequests : 0;

    const avgLatency = totalRequests > 0
      ? modelMetrics.reduce((sum, m) => sum + m.latency, 0) / totalRequests
      : 0;

    const avgCost = totalRequests > 0
      ? modelMetrics.reduce((sum, m) => sum + m.cost, 0) / totalRequests
      : 0;

    const errorCount = totalRequests - successfulRequests;

    // Determine status
    let status: HealthStatus['status'] = 'unknown';
    if (totalRequests === 0) {
      status = 'unknown';
    } else if (successRate >= 0.95 && avgLatency < 2000) {
      status = 'healthy';
    } else if (successRate >= 0.8 && avgLatency < 5000) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      provider,
      model,
      status,
      latency: avgLatency,
      successRate,
      lastChecked: new Date().toISOString(),
      errorCount,
      totalRequests,
      costPerRequest: avgCost
    };
  }

  /**
   * Record unhealthy status
   */
  private recordUnhealthyStatus(provider: string, model: string, error: any): void {
    const key = `${provider}_${model}`;
    const existing = this.healthStatus.get(key);

    this.healthStatus.set(key, {
      provider,
      model,
      status: 'unhealthy',
      latency: existing?.latency || 0,
      successRate: 0,
      lastChecked: new Date().toISOString(),
      errorCount: (existing?.errorCount || 0) + 1,
      totalRequests: (existing?.totalRequests || 0) + 1,
      costPerRequest: existing?.costPerRequest || 0
    });
  }

  /**
   * Check for failover conditions
   */
  private async checkFailoverConditions(): Promise<void> {
    if (!this.failoverConfig.enabled || !this.failoverConfig.automaticFailover) {
      return;
    }

    const unhealthyProviders = Array.from(this.healthStatus.values())
      .filter(health => health.status === 'unhealthy' || health.successRate < this.failoverConfig.failoverThreshold);

    for (const health of unhealthyProviders) {
      await this.handleProviderFailure(health);
    }

    // Check for cost anomalies
    await this.checkCostAnomalies();
  }

  /**
   * Handle provider failure with failover logic
   */
  private async handleProviderFailure(health: HealthStatus): Promise<void> {
    const alertId = `failover_${health.provider}_${health.model}_${Date.now()}`;

    // Create alert
    const alert: HealthAlert = {
      id: alertId,
      severity: health.status === 'unhealthy' ? 'high' : 'medium',
      message: `${health.provider}/${health.model} is ${health.status} (success rate: ${(health.successRate * 100).toFixed(1)}%, latency: ${health.latency.toFixed(0)}ms)`,
      provider: health.provider,
      model: health.model,
      timestamp: new Date().toISOString(),
      resolved: false
    };

    this.alerts.push(alert);

    // Attempt recovery
    if (this.failoverConfig.recoveryAttempts > 0) {
      setTimeout(async () => {
        await this.attemptRecovery(health.provider, health.model, alertId);
      }, this.failoverConfig.recoveryIntervalMinutes * 60 * 1000);
    }

    // Update router to avoid this provider
    this.router.markProviderUnavailable(health.provider, health.model);
  }

  /**
   * Attempt to recover a failed provider
   */
  private async attemptRecovery(provider: string, model: string, alertId: string): Promise<void> {
    console.log(`Attempting recovery for ${provider}/${model}`);

    try {
      const health = await this.checkProviderHealth(provider, model);

      if (health.status === 'healthy' || health.status === 'degraded') {
        // Recovery successful
        this.router.markProviderAvailable(provider, model);

        // Resolve alert
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
          alert.resolved = true;
        }

        console.log(`Recovery successful for ${provider}/${model}`);
      } else {
        console.log(`Recovery failed for ${provider}/${model}, still ${health.status}`);
      }
    } catch (error) {
      console.error(`Recovery attempt failed for ${provider}/${model}:`, error);
    }
  }

  /**
   * Check for cost anomalies
   */
  private async checkCostAnomalies(): Promise<void> {
    const costSummary = await this.costTracker.getCostSummary();

    // Check for sudden cost increases
    const providers = Object.keys(costSummary.costByProvider);
    for (const provider of providers) {
      const budget = await this.costTracker.getBudgetStatus(provider);

      if (budget.dailyPercentage > 0.9) {
        this.createAlert({
          severity: 'medium',
          message: `${provider} daily budget ${(budget.dailyPercentage * 100).toFixed(1)}% used`,
          provider
        });
      }

      if (budget.monthlyPercentage > 0.9) {
        this.createAlert({
          severity: 'high',
          message: `${provider} monthly budget ${(budget.monthlyPercentage * 100).toFixed(1)}% used`,
          provider
        });
      }
    }
  }

  /**
   * Create a health alert
   */
  private createAlert(alert: Omit<HealthAlert, 'id' | 'timestamp' | 'resolved'>): void {
    const newAlert: HealthAlert = {
      ...alert,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      resolved: false
    };

    // Check if similar alert already exists
    const existing = this.alerts.find(a =>
      a.message === newAlert.message &&
      a.provider === newAlert.provider &&
      !a.resolved
    );

    if (!existing) {
      this.alerts.push(newAlert);
    }
  }

  /**
   * Update overall system health
   */
  private async updateSystemHealth(): Promise<void> {
    const allHealth = Array.from(this.healthStatus.values());

    if (allHealth.length === 0) return;

    const healthyCount = allHealth.filter(h => h.status === 'healthy').length;
    const degradedCount = allHealth.filter(h => h.status === 'degraded').length;
    const unhealthyCount = allHealth.filter(h => h.status === 'unhealthy').length;

    let overall: SystemHealth['overall'] = 'healthy';

    if (unhealthyCount > 0) {
      overall = 'critical';
    } else if (degradedCount > healthyCount) {
      overall = 'degraded';
    }

    // Generate recommendations
    const recommendations = await this.generateRecommendations(allHealth);
  }

  /**
   * Generate health recommendations
   */
  private async generateRecommendations(healthStatuses: HealthStatus[]): Promise<string[]> {
    const recommendations: string[] = [];

    const unhealthyProviders = healthStatuses.filter(h => h.status === 'unhealthy');
    if (unhealthyProviders.length > 0) {
      recommendations.push(`Consider switching away from: ${unhealthyProviders.map(h => `${h.provider}/${h.model}`).join(', ')}`);
    }

    const highLatency = healthStatuses.filter(h => h.latency > this.failoverConfig.alertThresholds.latency);
    if (highLatency.length > 0) {
      recommendations.push(`High latency detected for: ${highLatency.map(h => `${h.provider}/${h.model}`).join(', ')}`);
    }

    const offlineStatus = await this.offlineManager.isOfflineModeAvailable();
    if (!offlineStatus.available) {
      recommendations.push('Set up local models for offline fallback');
    }

    const costOptimizations = await this.costTracker.getCostOptimizations();
    const increaseRecommendations = costOptimizations.filter(opt => opt.recommendation === 'increase');
    if (increaseRecommendations.length > 0) {
      recommendations.push(`Consider increasing usage of cost-effective models: ${increaseRecommendations.map(opt => `${opt.provider}/${opt.model}`).join(', ')}`);
    }

    return recommendations;
  }

  /**
   * Clean up old resolved alerts
   */
  private cleanupOldAlerts(): void {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    this.alerts = this.alerts.filter(alert =>
      !alert.resolved || new Date(alert.timestamp).getTime() > oneWeekAgo
    );
  }

  /**
   * Get current system health status
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const providers = Array.from(this.healthStatus.values());
    const activeAlerts = this.alerts.filter(a => !a.resolved);

    const recommendations = await this.generateRecommendations(providers);

    let overall: SystemHealth['overall'] = 'healthy';
    const unhealthyCount = providers.filter(p => p.status === 'unhealthy').length;
    const degradedCount = providers.filter(p => p.status === 'degraded').length;

    if (unhealthyCount > 0) {
      overall = 'critical';
    } else if (degradedCount > providers.length / 2) {
      overall = 'degraded';
    }

    return {
      overall,
      providers,
      alerts: activeAlerts,
      recommendations,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get health dashboard data
   */
  async getHealthDashboard(): Promise<{
    systemHealth: SystemHealth;
    costSummary: any;
    offlineStatus: any;
    recentMetrics: any[];
    uptimeStats: Record<string, number>;
  }> {
    const systemHealth = await this.getSystemHealth();
    const costSummary = await this.costTracker.getCostSummary();
    const offlineStatus = await this.offlineManager.isOfflineModeAvailable();

    // Get recent metrics (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recentMetrics = await this.costTracker.getCostMetrics(undefined, oneHourAgo);

    // Calculate uptime stats
    const uptimeStats: Record<string, number> = {};
    const allHealth = Array.from(this.healthStatus.values());

    for (const health of allHealth) {
      const key = `${health.provider}/${health.model}`;
      uptimeStats[key] = health.successRate * 100;
    }

    return {
      systemHealth,
      costSummary,
      offlineStatus,
      recentMetrics,
      uptimeStats
    };
  }

  /**
   * Manually trigger health check
   */
  async triggerHealthCheck(): Promise<void> {
    await this.performHealthCheck();
  }

  /**
   * Update failover configuration
   */
  updateFailoverConfig(config: Partial<FailoverConfig>): void {
    this.failoverConfig = { ...this.failoverConfig, ...config };
  }

  /**
   * Get current failover configuration
   */
  getFailoverConfig(): FailoverConfig {
    return { ...this.failoverConfig };
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
    }
  }

  /**
   * Get all alerts
   */
  getAlerts(includeResolved: boolean = false): HealthAlert[] {
    return includeResolved ? [...this.alerts] : this.alerts.filter(a => !a.resolved);
  }

  /**
   * Stop monitoring (for testing)
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Get detailed health information for API
   */
  async getDetailedHealth(): Promise<HealthStatus[]> {
    // Force a health check update
    await this.performHealthChecks();

    return Array.from(this.healthStatus.values());
  }

  /**
   * Export health data for analysis
   */
  exportHealthData(): {
    healthStatus: HealthStatus[];
    alerts: HealthAlert[];
    config: FailoverConfig;
  } {
    return {
      healthStatus: Array.from(this.healthStatus.values()),
      alerts: [...this.alerts],
      config: { ...this.failoverConfig }
    };
  }
}