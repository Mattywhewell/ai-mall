import { callLocalModel } from './local/ollamaManager';
import { AIRouter } from './modelRouter';
import { CostTracker } from './costTracker';

export interface OfflineModeConfig {
  enabled: boolean;
  fallbackModels: string[]; // Local models to use as fallback
  maxRetries: number;
  timeoutMs: number;
  cacheEnabled: boolean;
  cacheTtlMinutes: number;
}

export interface OfflineCacheEntry {
  key: string;
  response: string;
  timestamp: number;
  taskType: string;
  model: string;
}

export class OfflineModeManager {
  private static instance: OfflineModeManager;
  private config: OfflineModeConfig;
  private cache: Map<string, OfflineCacheEntry> = new Map();
  private router = AIRouter.getInstance();
  private costTracker = CostTracker.getInstance();

  private constructor() {
    this.config = {
      enabled: true,
      fallbackModels: ['llama-3.1-8b', 'mistral-7b', 'codellama'],
      maxRetries: 3,
      timeoutMs: 10000,
      cacheEnabled: true,
      cacheTtlMinutes: 60
    };

    // Start cache cleanup interval
    setInterval(() => this.cleanupCache(), 5 * 60 * 1000); // Every 5 minutes
  }

  static getInstance(): OfflineModeManager {
    if (!OfflineModeManager.instance) {
      OfflineModeManager.instance = new OfflineModeManager();
    }
    return OfflineModeManager.instance;
  }

  /**
   * Execute a task with offline fallback capability
   */
  async executeWithOfflineFallback(
    prompt: string,
    systemPrompt: string,
    taskType: string = 'general',
    options: {
      maxCost?: number;
      timeoutMs?: number;
      useCache?: boolean;
    } = {}
  ): Promise<{
    response: string;
    source: 'cloud' | 'local' | 'cache';
    model: string;
    latency: number;
    cost: number;
  }> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(prompt, systemPrompt, taskType);

    // Check cache first
    if (options.useCache !== false && this.config.cacheEnabled) {
      const cached = this.getCachedResponse(cacheKey);
      if (cached) {
        return {
          response: cached.response,
          source: 'cache',
          model: cached.model,
          latency: Date.now() - startTime,
          cost: 0
        };
      }
    }

    // Try cloud providers first
    try {
      const cloudResult = await this.tryCloudProviders(prompt, systemPrompt, taskType, options);
      const latency = Date.now() - startTime;

      // Cache successful cloud response
      if (this.config.cacheEnabled && cloudResult.response) {
        this.cacheResponse(cacheKey, cloudResult.response, taskType, cloudResult.model);
      }

      return {
        ...cloudResult,
        latency
      };
    } catch (cloudError) {
      console.warn('Cloud providers failed, falling back to offline mode:', cloudError);

      // Fallback to local models
      const localResult = await this.tryLocalModels(prompt, systemPrompt, taskType);
      const latency = Date.now() - startTime;

      // Cache local response too
      if (this.config.cacheEnabled && localResult.response) {
        this.cacheResponse(cacheKey, localResult.response, taskType, localResult.model);
      }

      return {
        ...localResult,
        latency
      };
    }
  }

  /**
   * Try cloud providers with timeout and retry logic
   */
  private async tryCloudProviders(
    prompt: string,
    systemPrompt: string,
    taskType: string,
    options: { maxCost?: number; timeoutMs?: number }
  ): Promise<{ response: string; model: string; cost: number }> {
    const timeout = options.timeoutMs || this.config.timeoutMs;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        // Check budget before attempting
        if (options.maxCost) {
          const budgetCheck = await this.costTracker.shouldAllowRequest('openai', 0.01); // Rough estimate
          if (!budgetCheck.allowed) {
            throw new Error(`Budget constraint: ${budgetCheck.reason}`);
          }
        }

        // Route to appropriate cloud model
        const result = await this.router.routeTask({
          type: taskType as any,
          complexity: 'medium',
          priority: 'quality',
          maxCost: options.maxCost,
          timeout: timeout
        }, prompt, systemPrompt);

        return {
          response: result.response,
          model: result.model,
          cost: result.cost
        };

      } catch (error) {
        console.warn(`Cloud attempt ${attempt} failed:`, error);

        if (attempt === this.config.maxRetries) {
          throw new Error(`All cloud attempts failed: ${error}`);
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    throw new Error('Cloud providers unavailable');
  }

  /**
   * Try local models as fallback
   */
  private async tryLocalModels(
    prompt: string,
    systemPrompt: string,
    taskType: string
  ): Promise<{ response: string; model: string; cost: number }> {
    for (const model of this.config.fallbackModels) {
      try {
        console.log(`Trying local model: ${model}`);

        const response = await callLocalModel(
          model,
          systemPrompt,
          prompt
        );

        if (response && response.length > 10) { // Basic quality check
          return {
            response,
            model,
            cost: 0 // Local models have no API cost
          };
        }
      } catch (error) {
        console.warn(`Local model ${model} failed:`, error);
        continue;
      }
    }

    throw new Error('All local models failed or returned poor quality responses');
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(prompt: string, systemPrompt: string, taskType: string): string {
    // Create a hash of the input for caching
    const input = `${systemPrompt}|${prompt}|${taskType}`;
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Get cached response if available and not expired
   */
  private getCachedResponse(key: string): OfflineCacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    const maxAge = this.config.cacheTtlMinutes * 60 * 1000;

    if (age > maxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  /**
   * Cache a response
   */
  private cacheResponse(key: string, response: string, taskType: string, model: string): void {
    const entry: OfflineCacheEntry = {
      key,
      response,
      timestamp: Date.now(),
      taskType,
      model
    };

    this.cache.set(key, entry);

    // Limit cache size
    if (this.cache.size > 1000) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    const maxAge = this.config.cacheTtlMinutes * 60 * 1000;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > maxAge) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Check if offline mode is available
   */
  async isOfflineModeAvailable(): Promise<{
    available: boolean;
    availableModels: string[];
    cacheSize: number;
  }> {
    const availableModels: string[] = [];

    // Check which local models are available
    for (const model of this.config.fallbackModels) {
      try {
        // Quick test call
        const testResponse = await callLocalModel(
          model,
          'You are a test assistant.',
          'Respond with "OK" if you can understand this message.',
          0.1 // Very low temperature for consistent response
        );

        if (testResponse && testResponse.toLowerCase().includes('ok')) {
          availableModels.push(model);
        }
      } catch (error) {
        // Model not available
        continue;
      }
    }

    return {
      available: availableModels.length > 0,
      availableModels,
      cacheSize: this.cache.size
    };
  }

  /**
   * Get offline mode status
   */
  getOfflineStatus(): {
    enabled: boolean;
    cacheEnabled: boolean;
    cacheSize: number;
    cacheTtlMinutes: number;
    fallbackModels: string[];
    maxRetries: number;
    timeoutMs: number;
  } {
    return {
      enabled: this.config.enabled,
      cacheEnabled: this.config.cacheEnabled,
      cacheSize: this.cache.size,
      cacheTtlMinutes: this.config.cacheTtlMinutes,
      fallbackModels: [...this.config.fallbackModels],
      maxRetries: this.config.maxRetries,
      timeoutMs: this.config.timeoutMs
    };
  }

  /**
   * Update offline mode configuration
   */
  updateConfig(updates: Partial<OfflineModeConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Pre-warm cache with common queries
   */
  async prewarmCache(queries: Array<{ prompt: string; systemPrompt: string; taskType: string }>): Promise<void> {
    console.log(`Pre-warming cache with ${queries.length} queries...`);

    for (const query of queries) {
      try {
        const result = await this.executeWithOfflineFallback(
          query.prompt,
          query.systemPrompt,
          query.taskType,
          { useCache: false } // Don't use cache for pre-warming
        );

        console.log(`Pre-warmed: ${query.taskType} (${result.source})`);
      } catch (error) {
        console.warn(`Failed to pre-warm query:`, error);
      }
    }

    console.log(`Cache pre-warming complete. Cache size: ${this.cache.size}`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    totalRequests: number;
    averageAge: number;
    entriesByTaskType: Record<string, number>;
  } {
    const now = Date.now();
    let totalAge = 0;
    const entriesByTaskType: Record<string, number> = {};

    for (const entry of this.cache.values()) {
      totalAge += now - entry.timestamp;
      entriesByTaskType[entry.taskType] = (entriesByTaskType[entry.taskType] || 0) + 1;
    }

    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits separately
      totalRequests: 0, // Would need to track total requests
      averageAge: this.cache.size > 0 ? totalAge / this.cache.size : 0,
      entriesByTaskType
    };
  }

  /**
   * Export cache for backup
   */
  exportCache(): OfflineCacheEntry[] {
    return Array.from(this.cache.values());
  }

  /**
   * Import cache from backup
   */
  importCache(entries: OfflineCacheEntry[]): void {
    for (const entry of entries) {
      // Check if entry is still valid
      const age = Date.now() - entry.timestamp;
      const maxAge = this.config.cacheTtlMinutes * 60 * 1000;

      if (age <= maxAge) {
        this.cache.set(entry.key, entry);
      }
    }
  }

  /**
   * Force offline mode for testing
   */
  async forceOfflineMode(): Promise<void> {
    // Temporarily disable cloud routing
    const originalRoute = this.router.routeTask;
    this.router.routeTask = async () => {
      throw new Error('Forced offline mode');
    };

    // Restore after a delay
    setTimeout(() => {
      this.router.routeTask = originalRoute;
    }, 30000); // 30 seconds
  }
}