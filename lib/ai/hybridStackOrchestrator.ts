import { AIRouter } from './modelRouter';
import { ModelEnsemble } from './modelEnsemble';
import { CostTracker } from './costTracker';
import { OfflineModeManager } from './offlineModeManager';
import { HealthMonitor } from './healthMonitor';
import { UserBehaviorModel } from './fine-tuning/userBehaviorModel';
import { ProductDomainAdapter } from './fine-tuning/productDomainAdapter';
import { CitizenPersonalityTuner } from './fine-tuning/citizenPersonalityTuner';

export interface HybridStackConfig {
  enableEnsemble: boolean;
  enableOfflineMode: boolean;
  enableCostTracking: boolean;
  enableHealthMonitoring: boolean;
  enableFineTuning: boolean;
  defaultPriority: 'speed' | 'quality' | 'cost';
  maxRetries: number;
  timeoutMs: number;
}

export interface TaskRequest {
  prompt: string;
  systemPrompt?: string;
  taskType: 'creative' | 'analytical' | 'conversational' | 'factual' | 'coding' | 'summarization' | 'recommendation' | 'personality';
  complexity?: 'simple' | 'medium' | 'complex';
  priority?: 'speed' | 'quality' | 'cost';
  maxCost?: number;
  userId?: string; // For personalized responses
  context?: Record<string, any>; // Additional context
}

export interface TaskResult {
  response: string;
  model: string;
  provider: string;
  cost: number;
  latency: number;
  confidence?: number;
  source: 'single' | 'ensemble' | 'cache' | 'offline';
  metadata: {
    taskType: string;
    fineTuned: boolean;
    personalized: boolean;
    ensembleSize?: number;
  };
}

export class HybridStackOrchestrator {
  private static instance: HybridStackOrchestrator;
  private config: HybridStackConfig;

  // Core components
  private router = AIRouter.getInstance();
  private ensemble = ModelEnsemble.getInstance();
  private costTracker = CostTracker.getInstance();
  private offlineManager = OfflineModeManager.getInstance();
  private healthMonitor = HealthMonitor.getInstance();

  // Fine-tuning components
  private userBehaviorModel = UserBehaviorModel.getInstance();
  private productAdapter = ProductDomainAdapter.getInstance();
  private personalityTuner = CitizenPersonalityTuner.getInstance();

  private constructor() {
    this.config = {
      enableEnsemble: true,
      enableOfflineMode: true,
      enableCostTracking: true,
      enableHealthMonitoring: true,
      enableFineTuning: true,
      defaultPriority: 'quality',
      maxRetries: 3,
      timeoutMs: 30000
    };
  }

  static getInstance(): HybridStackOrchestrator {
    if (!HybridStackOrchestrator.instance) {
      HybridStackOrchestrator.instance = new HybridStackOrchestrator();
    }
    return HybridStackOrchestrator.instance;
  }

  /**
   * Execute a task using the full hybrid AI stack
   */
  async executeTask(request: TaskRequest): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      // Validate request
      this.validateTaskRequest(request);

      // Enhance prompt with fine-tuning if enabled
      const enhancedRequest = await this.enhanceWithFineTuning(request);

      // Route task based on configuration
      const result = await this.routeTaskExecution(enhancedRequest);

      const latency = Date.now() - startTime;

      // Record metrics
      if (this.config.enableCostTracking) {
        await this.recordTaskMetrics(result, latency);
      }

      return {
        ...result,
        latency
      };

    } catch (error) {
      console.error('Task execution failed:', error);

      // Fallback to offline mode if enabled
      if (this.config.enableOfflineMode) {
        try {
          const offlineResult = await this.offlineManager.executeWithOfflineFallback(
            request.prompt,
            request.systemPrompt || '',
            request.taskType
          );

          return {
            response: offlineResult.response,
            model: offlineResult.model,
            provider: 'local',
            cost: offlineResult.cost,
            latency: Date.now() - startTime,
            source: 'offline',
            metadata: {
              taskType: request.taskType,
              fineTuned: false,
              personalized: false
            }
          };
        } catch (offlineError) {
          console.error('Offline fallback also failed:', offlineError);
        }
      }

      throw error;
    }
  }

  /**
   * Validate task request
   */
  private validateTaskRequest(request: TaskRequest): void {
    if (!request.prompt || request.prompt.trim().length === 0) {
      throw new Error('Prompt is required');
    }

    if (!request.taskType) {
      throw new Error('Task type is required');
    }

    const validTaskTypes = ['creative', 'analytical', 'conversational', 'factual', 'coding', 'summarization', 'recommendation', 'personality'];
    if (!validTaskTypes.includes(request.taskType)) {
      throw new Error(`Invalid task type: ${request.taskType}`);
    }

    if (request.maxCost && request.maxCost < 0) {
      throw new Error('Max cost must be positive');
    }
  }

  /**
   * Enhance request with fine-tuning capabilities
   */
  private async enhanceWithFineTuning(request: TaskRequest): Promise<TaskRequest> {
    if (!this.config.enableFineTuning) {
      return request;
    }

    let enhancedPrompt = request.prompt;
    let enhancedSystemPrompt = request.systemPrompt || '';

    // Apply user behavior personalization
    if (request.userId && request.taskType === 'recommendation') {
      try {
        const userInsights = await this.userBehaviorModel.predictUserInterests(request.userId);
        enhancedPrompt += `\n\nUser preferences: ${userInsights.predictedCategories.join(', ')}`;
        enhancedSystemPrompt += '\nConsider the user\'s predicted interests and behavior patterns.';
      } catch (error) {
        console.warn('User behavior prediction failed:', error);
      }
    }

    // Apply product domain adaptation
    if (request.taskType === 'recommendation' || request.context?.product) {
      try {
        const domainAdapted = await this.productAdapter.adaptPromptForDomain(
          enhancedPrompt,
          request.context?.product || 'general'
        );
        enhancedPrompt = domainAdapted;
      } catch (error) {
        console.warn('Product domain adaptation failed:', error);
      }
    }

    // Apply personality tuning for citizen interactions
    if (request.taskType === 'personality' || request.context?.citizen) {
      try {
        const personalityAdapted = await this.personalityTuner.adaptForPersonality(
          enhancedPrompt,
          request.context?.citizen || 'neutral'
        );
        enhancedPrompt = personalityAdapted;
      } catch (error) {
        console.warn('Personality tuning failed:', error);
      }
    }

    return {
      ...request,
      prompt: enhancedPrompt,
      systemPrompt: enhancedSystemPrompt
    };
  }

  /**
   * Route task execution based on configuration
   */
  private async routeTaskExecution(request: TaskRequest): Promise<TaskResult> {
    const priority = request.priority || this.config.defaultPriority;

    // Use ensemble for complex tasks if enabled
    if (this.config.enableEnsemble &&
        request.complexity === 'complex' &&
        request.taskType !== 'personality') {

      const ensembleResult = await this.ensemble.executeEnsembleTask(
        request.prompt,
        request.systemPrompt || '',
        {
          type: request.taskType,
          complexity: request.complexity || 'medium',
          priority,
          maxCost: request.maxCost
        }
      );

      return {
        response: ensembleResult.finalAnswer,
        model: 'ensemble',
        provider: 'multiple',
        cost: ensembleResult.metadata.totalCost,
        latency: ensembleResult.metadata.totalLatency,
        confidence: ensembleResult.confidence,
        source: 'ensemble',
        metadata: {
          taskType: request.taskType,
          fineTuned: true,
          personalized: !!request.userId,
          ensembleSize: ensembleResult.sources.length
        }
      };
    }

    // Use single model routing
    const routingResult = await this.router.routeTask(
      {
        type: request.taskType,
        complexity: request.complexity || 'medium',
        priority,
        maxCost: request.maxCost,
        timeout: this.config.timeoutMs
      },
      request.prompt,
      request.systemPrompt || ''
    );

    return {
      response: routingResult.response,
      model: routingResult.model,
      provider: routingResult.provider,
      cost: routingResult.cost,
      latency: routingResult.latency,
      source: 'single',
      metadata: {
        taskType: request.taskType,
        fineTuned: this.config.enableFineTuning,
        personalized: !!request.userId
      }
    };
  }

  /**
   * Record task execution metrics
   */
  private async recordTaskMetrics(result: TaskResult, totalLatency: number): Promise<void> {
    if (!this.config.enableCostTracking) return;

    const metrics = {
      provider: result.provider,
      model: result.model,
      inputTokens: this.estimateTokens(result.metadata.taskType === 'coding' ? result.response : 'sample input'),
      outputTokens: this.estimateTokens(result.response),
      totalTokens: this.estimateTokens(result.response) + 50, // Rough estimate
      cost: result.cost,
      timestamp: new Date().toISOString(),
      taskType: result.metadata.taskType,
      success: true,
      latency: result.latency
    };

    await this.costTracker.recordCost(metrics);
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Get system status and health
   */
  async getSystemStatus(): Promise<{
    config: HybridStackConfig;
    health: any;
    costs: any;
    offline: any;
    ensemble: any;
  }> {
    const [health, costs, offline] = await Promise.all([
      this.config.enableHealthMonitoring ? this.healthMonitor.getSystemHealth() : null,
      this.config.enableCostTracking ? this.costTracker.getCostSummary() : null,
      this.config.enableOfflineMode ? this.offlineManager.getOfflineStatus() : null
    ]);

    const ensemble = this.config.enableEnsemble ? this.ensemble.getEnsembleStats() : null;

    return {
      config: { ...this.config },
      health,
      costs,
      offline,
      ensemble
    };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<HybridStackConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(timeRange: 'hour' | 'day' | 'week' = 'day'): Promise<{
    totalTasks: number;
    averageLatency: number;
    totalCost: number;
    successRate: number;
    tasksByType: Record<string, number>;
    costsByProvider: Record<string, number>;
    cacheHitRate?: number;
  }> {
    const hours = timeRange === 'hour' ? 1 : timeRange === 'day' ? 24 : 168;
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const metrics = await this.costTracker.getCostMetrics(undefined, startTime);

    const totalTasks = metrics.length;
    const successfulTasks = metrics.filter(m => m.success).length;
    const successRate = totalTasks > 0 ? successfulTasks / totalTasks : 0;

    const averageLatency = totalTasks > 0
      ? metrics.reduce((sum, m) => sum + m.latency, 0) / totalTasks
      : 0;

    const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0);

    const tasksByType: Record<string, number> = {};
    const costsByProvider: Record<string, number> = {};

    metrics.forEach(metric => {
      tasksByType[metric.taskType] = (tasksByType[metric.taskType] || 0) + 1;
      costsByProvider[metric.provider] = (costsByProvider[metric.provider] || 0) + metric.cost;
    });

    const result: any = {
      totalTasks,
      averageLatency,
      totalCost,
      successRate,
      tasksByType,
      costsByProvider
    };

    // Add cache metrics if offline mode enabled
    if (this.config.enableOfflineMode) {
      const cacheStats = this.offlineManager.getCacheStats();
      result.cacheHitRate = cacheStats.hitRate;
    }

    return result;
  }

  /**
   * Batch execute multiple tasks
   */
  async executeBatchTasks(requests: TaskRequest[]): Promise<TaskResult[]> {
    const results: TaskResult[] = [];

    // Process in parallel with concurrency limit
    const concurrencyLimit = 5;
    for (let i = 0; i < requests.length; i += concurrencyLimit) {
      const batch = requests.slice(i, i + concurrencyLimit);
      const batchPromises = batch.map(request => this.executeTask(request));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Warm up the system with common queries
   */
  async warmupSystem(): Promise<void> {
    console.log('Warming up hybrid AI stack...');

    const warmupQueries = [
      {
        prompt: 'Hello, how are you?',
        systemPrompt: 'You are a helpful assistant.',
        taskType: 'conversational' as const
      },
      {
        prompt: 'What is the capital of France?',
        systemPrompt: 'You are a factual assistant.',
        taskType: 'factual' as const
      },
      {
        prompt: 'Write a short story about a robot.',
        systemPrompt: 'You are a creative writer.',
        taskType: 'creative' as const
      }
    ];

    try {
      await this.offlineManager.prewarmCache(warmupQueries);
      console.log('System warmup complete');
    } catch (error) {
      console.warn('System warmup failed:', error);
    }
  }

  /**
   * Emergency shutdown - switch to offline-only mode
   */
  emergencyShutdown(): void {
    console.log('Emergency shutdown initiated - switching to offline mode only');
    this.config.enableEnsemble = false;
    this.config.enableHealthMonitoring = false;
    this.config.enableCostTracking = false;
    this.config.enableFineTuning = false;
  }

  /**
   * Restore full functionality
   */
  restoreFullFunctionality(): void {
    console.log('Restoring full hybrid AI stack functionality');
    this.config.enableEnsemble = true;
    this.config.enableOfflineMode = true;
    this.config.enableCostTracking = true;
    this.config.enableHealthMonitoring = true;
    this.config.enableFineTuning = true;
  }

  /**
   * Get system health status
   */
  async getHealthStatus(): Promise<SystemHealth> {
    if (this.config.enableHealthMonitoring) {
      return await this.healthMonitor.getSystemHealth();
    }

    // Return basic health if monitoring is disabled
    return {
      overall: 'unknown',
      providers: [],
      alerts: [],
      recommendations: ['Enable health monitoring for detailed status'],
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Export system configuration and state
   */
  exportSystemState(): {
    config: HybridStackConfig;
    healthData: any;
    costData: any;
    cacheData: any;
    timestamp: string;
  } {
    return {
      config: { ...this.config },
      healthData: this.config.enableHealthMonitoring ? this.healthMonitor.exportHealthData() : null,
      costData: this.config.enableCostTracking ? 'Cost data export not implemented' : null,
      cacheData: this.config.enableOfflineMode ? this.offlineManager.exportCache() : null,
      timestamp: new Date().toISOString()
    };
  }
}