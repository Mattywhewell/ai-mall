export interface AITask {
  id: string;
  type: 'text_generation' | 'embedding' | 'analysis' | 'creative' | 'factual' | 'conversational';
  content: string;
  context?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface RoutingDecision {
  provider: 'openai' | 'anthropic' | 'azure-openai' | 'grok' | 'llama' | 'mistral' | 'huggingface';
  model: string;
  reasoning: string;
  estimatedCost: number;
  estimatedLatency: number;
  fallbackProviders: string[];
  confidence: number; // 0-1
}

export interface ProviderHealth {
  provider: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  errorRate: number;
  lastChecked: number;
}

export class AIRouter {
  private static instance: AIRouter;
  private providerHealth: Map<string, ProviderHealth> = new Map();
  private taskHistory: Array<{ task: AITask; decision: RoutingDecision; result: 'success' | 'failure' }> = [];

  private constructor() {
    this.initializeHealthMonitoring();
  }

  static getInstance(): AIRouter {
    if (!AIRouter.instance) {
      AIRouter.instance = new AIRouter();
    }
    return AIRouter.instance;
  }

  private initializeHealthMonitoring(): void {
    // Initialize health status for all providers
    const providers = ['openai', 'anthropic', 'azure-openai', 'grok', 'llama', 'mistral', 'huggingface'];
    providers.forEach(provider => {
      this.providerHealth.set(provider, {
        provider,
        status: 'healthy',
        latency: 1000, // default 1s
        errorRate: 0,
        lastChecked: Date.now()
      });
    });

    // Start health monitoring
    setInterval(() => this.checkProviderHealth(), 60000); // Check every minute
  }

  private async checkProviderHealth(): Promise<void> {
    const providers = Array.from(this.providerHealth.keys());

    for (const provider of providers) {
      try {
        const startTime = Date.now();
        // Simple health check - try a basic API call
        await this.performHealthCheck(provider);
        const latency = Date.now() - startTime;

        this.providerHealth.set(provider, {
          ...this.providerHealth.get(provider)!,
          status: 'healthy',
          latency,
          lastChecked: Date.now()
        });
      } catch (error) {
        this.providerHealth.set(provider, {
          ...this.providerHealth.get(provider)!,
          status: 'degraded',
          errorRate: (this.providerHealth.get(provider)?.errorRate || 0) + 0.1,
          lastChecked: Date.now()
        });
      }
    }
  }

  private async performHealthCheck(provider: string): Promise<void> {
    // Simple health checks for each provider
    switch (provider) {
      case 'openai':
        const { callOpenAI } = await import('./openaiClient');
        await callOpenAI('You are a helpful assistant.', 'Hello', 0.1);
        break;
      case 'anthropic':
        const { callAnthropic } = await import('./anthropicClient');
        await callAnthropic('You are a helpful assistant.', 'Hello', 0.1);
        break;
      case 'azure-openai':
        try {
          const { callAzureOpenAI } = await import('./azureClient');
          await callAzureOpenAI('You are a helpful assistant.', 'Hello', 0.1);
        } catch {
          // Azure might not be configured, skip
        }
        break;
      case 'grok':
        try {
          const { callGrok } = await import('./grokClient');
          await callGrok('You are a helpful assistant.', 'Hello', 0.1);
        } catch {
          // Grok might not be configured, skip
        }
        break;
      case 'huggingface':
        try {
          const { callHuggingFace } = await import('./local/huggingFaceClient');
          await callHuggingFace('You are a helpful assistant.', 'Hello', 0.1);
        } catch {
          // Hugging Face might not be available, skip
        }
        break;
      case 'llama':
      case 'mistral':
        // Local models - check if Ollama is running
        const { OllamaManager } = await import('./local/ollamaManager');
        const ollama = OllamaManager.getInstance();
        await ollama.listModels();
        break;
    }
  }

  async routeTask(task: AITask): Promise<RoutingDecision> {
    const candidates = await this.evaluateProviders(task);

    if (candidates.length === 0) {
      throw new Error('No AI providers available for this task');
    }

    // Sort by score (higher is better)
    candidates.sort((a, b) => b.score - a.score);

    const bestCandidate = candidates[0];
    const fallbackProviders = candidates.slice(1, 4).map(c => c.provider);

    return {
      provider: bestCandidate.provider,
      model: bestCandidate.model,
      reasoning: bestCandidate.reasoning,
      estimatedCost: bestCandidate.cost,
      estimatedLatency: bestCandidate.latency,
      fallbackProviders,
      confidence: bestCandidate.score / 10 // Normalize to 0-1
    };
  }

  private async evaluateProviders(task: AITask): Promise<Array<{
    provider: 'openai' | 'anthropic' | 'azure-openai' | 'grok' | 'llama' | 'mistral' | 'huggingface';
    model: string;
    score: number;
    cost: number;
    latency: number;
    reasoning: string;
  }>> {
    const candidates: Array<{
      provider: 'openai' | 'anthropic' | 'azure-openai' | 'grok' | 'llama' | 'mistral' | 'huggingface';
      model: string;
      score: number;
      cost: number;
      latency: number;
      reasoning: string;
    }> = [];

    // Evaluate each provider
    const providers: Array<'openai' | 'anthropic' | 'azure-openai' | 'grok' | 'llama' | 'mistral' | 'huggingface'> = ['openai', 'anthropic', 'azure-openai', 'grok', 'llama', 'mistral', 'huggingface'];

    for (const provider of providers) {
      try {
        const health = this.providerHealth.get(provider);
        if (!health || health.status === 'down') continue;

        const evaluation = await this.evaluateProvider(provider, task, health);
        if (evaluation) {
          candidates.push(evaluation);
        }
      } catch (error) {
        console.warn(`Failed to evaluate provider ${provider}:`, error);
      }
    }

    return candidates;
  }

  private async evaluateProvider(
    provider: 'openai' | 'anthropic' | 'azure-openai' | 'grok' | 'llama' | 'mistral' | 'huggingface',
    task: AITask,
    health: ProviderHealth
  ): Promise<{
    provider: 'openai' | 'anthropic' | 'azure-openai' | 'grok' | 'llama' | 'mistral' | 'huggingface';
    model: string;
    score: number;
    cost: number;
    latency: number;
    reasoning: string;
  } | null> {
    let score = 0;
    let cost = 0;
    let latency = health.latency;
    let model = '';
    let reasoning = '';

    // Base health score (0-2 points)
    if (health.status === 'healthy') score += 2;
    else if (health.status === 'degraded') score += 1;

    // Task type specialization (0-3 points)
    switch (task.type) {
      case 'creative':
        if (provider === 'anthropic') {
          score += 3;
          model = 'claude-3-5-sonnet-20241022';
          cost = 0.015;
          reasoning = 'Claude excels at creative writing and has strong reasoning capabilities';
        } else if (provider === 'openai') {
          score += 2.5;
          model = 'gpt-4';
          cost = 0.03;
          reasoning = 'GPT-4 is versatile for creative tasks';
        } else if (provider === 'grok') {
          score += 2;
          model = 'grok-beta';
          cost = 0.01;
          reasoning = 'Grok has unique creative perspectives';
        }
        break;

      case 'factual':
      case 'analysis':
        if (provider === 'openai') {
          score += 3;
          model = 'gpt-4';
          cost = 0.03;
          reasoning = 'GPT-4 provides accurate, well-researched responses';
        } else if (provider === 'anthropic') {
          score += 2.5;
          model = 'claude-3-5-sonnet-20241022';
          cost = 0.015;
          reasoning = 'Claude is excellent at analytical reasoning';
        } else if (provider === 'azure-openai') {
          score += 2;
          model = 'gpt-4';
          cost = 0.025;
          reasoning = 'Azure OpenAI provides reliable factual responses';
        } else if (provider === 'huggingface') {
          score += 1.5;
          model = 'Xenova/gpt2';
          cost = 0.0; // Free, runs locally
          reasoning = 'Hugging Face provides local inference with no API costs';
        }
        break;

      case 'conversational':
        if (provider === 'anthropic') {
          score += 3;
          model = 'claude-3-5-sonnet-20241022';
          cost = 0.015;
          reasoning = 'Claude provides natural, helpful conversations';
        } else if (provider === 'grok') {
          score += 2.5;
          model = 'grok-beta';
          cost = 0.01;
          reasoning = 'Grok has engaging conversational style';
        } else if (provider === 'openai') {
          score += 2;
          model = 'gpt-4';
          cost = 0.03;
          reasoning = 'GPT-4 handles conversations well';
        }
        break;

      case 'embedding':
        if (provider === 'openai') {
          score += 3;
          model = 'text-embedding-3-small';
          cost = 0.00002;
          reasoning = 'OpenAI provides the best embedding quality';
        } else if (provider === 'azure-openai') {
          score += 2.5;
          model = 'text-embedding-ada-002';
          cost = 0.00002;
          reasoning = 'Azure provides good embedding capabilities';
        }
        break;
    }

    // Local model preferences for cost optimization
    if (provider === 'llama' || provider === 'mistral') {
      if (task.priority !== 'critical') {
        score += 1; // Bonus for cost savings
        cost = 0; // No API costs for local models
        latency += 500; // Local models are slower
        reasoning += ' (cost-effective local processing)';
      }
    }

    // Priority adjustments
    if (task.priority === 'critical' && (provider === 'openai' || provider === 'anthropic')) {
      score += 1; // Prefer established providers for critical tasks
    }

    // Error rate penalty
    score -= health.errorRate * 2;

    // Only return if score is reasonable
    if (score >= 2) {
      return {
        provider,
        model,
        score,
        cost: cost * (task.maxTokens || 1000) / 1000, // Estimate cost
        latency,
        reasoning
      };
    }

    return null;
  }

  async executeTask(task: AITask): Promise<string> {
    const decision = await this.routeTask(task);

    try {
      let result: string;

      switch (decision.provider) {
        case 'openai':
          const { callOpenAI } = await import('./openaiClient');
          result = await callOpenAI(
            task.systemPrompt || 'You are a helpful assistant.',
            task.content,
            task.temperature
          );
          break;

        case 'anthropic':
          const { callAnthropic } = await import('./anthropicClient');
          result = await callAnthropic(
            task.systemPrompt || 'You are a helpful assistant.',
            task.content,
            task.temperature
          );
          break;

        case 'azure-openai':
          const { callAzureOpenAI } = await import('./azureClient');
          result = await callAzureOpenAI(
            task.systemPrompt || 'You are a helpful assistant.',
            task.content,
            task.temperature
          );
          break;

        case 'grok':
          const { callGrok } = await import('./grokClient');
          result = await callGrok(
            task.systemPrompt || 'You are a helpful assistant.',
            task.content,
            task.temperature,
            decision.model
          );
          break;

        case 'llama':
          const { callLlama, ensureLlamaModel } = await import('./local/llamaClient');
          await ensureLlamaModel(decision.model);
          result = await callLlama(
            task.systemPrompt || 'You are a helpful assistant.',
            task.content,
            task.temperature,
            decision.model
          );
          break;

        case 'mistral':
          const { callMistral, ensureMistralModel } = await import('./local/mistralClient');
          await ensureMistralModel(decision.model);
          result = await callMistral(
            task.systemPrompt || 'You are a helpful assistant.',
            task.content,
            task.temperature,
            decision.model
          );
          break;

        case 'huggingface':
          const { callHuggingFace } = await import('./local/huggingFaceClient');
          result = await callHuggingFace(
            task.systemPrompt || 'You are a helpful assistant.',
            task.content,
            task.temperature,
            decision.model
          );
          break;

        default:
          throw new Error(`Unsupported provider: ${decision.provider}`);
      }

      // Record success
      this.taskHistory.push({ task, decision, result: 'success' });

      return result;

    } catch (error) {
      console.error(`Task execution failed with ${decision.provider}:`, error);

      // Record failure
      this.taskHistory.push({ task, decision, result: 'failure' });

      // Try fallback providers
      for (const fallbackProvider of decision.fallbackProviders) {
        try {
          console.log(`Trying fallback provider: ${fallbackProvider}`);
          const fallbackDecision: RoutingDecision = { ...decision, provider: fallbackProvider as 'openai' | 'anthropic' | 'azure-openai' | 'grok' | 'llama' | 'mistral' };
          // This is a simplified fallback - in production you'd re-route
          return await this.executeTaskWithProvider(task, fallbackDecision);
        } catch (fallbackError) {
          console.error(`Fallback ${fallbackProvider} also failed:`, fallbackError);
        }
      }

      throw error;
    }
  }

  private async executeTaskWithProvider(task: AITask, decision: RoutingDecision): Promise<string> {
    // Simplified fallback execution
    switch (decision.provider) {
      case 'openai':
        const { callOpenAI } = await import('./openaiClient');
        return await callOpenAI(
          task.systemPrompt || 'You are a helpful assistant.',
          task.content,
          task.temperature
        );
      case 'anthropic':
        const { callAnthropic } = await import('./anthropicClient');
        return await callAnthropic(
          task.systemPrompt || 'You are a helpful assistant.',
          task.content,
          task.temperature
        );
      default:
        throw new Error(`Fallback provider ${decision.provider} not implemented`);
    }
  }

  getHealthStatus(): Record<string, ProviderHealth> {
    return Object.fromEntries(this.providerHealth);
  }

  getTaskHistory(limit: number = 100): Array<{ task: AITask; decision: RoutingDecision; result: string }> {
    return this.taskHistory.slice(-limit);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // For embeddings, prefer OpenAI for quality, fallback to others
    try {
      const { generateEmbedding } = await import('./openaiClient');
      return generateEmbedding(text);
    } catch (error) {
      console.warn('OpenAI embedding failed, trying alternatives...');
      try {
        const { generateAzureEmbedding } = await import('./azureClient');
        return generateAzureEmbedding(text);
      } catch {
        // Final fallback - simple hash (not recommended for production)
        console.warn('All embedding providers failed, using fallback hash');
        return this.simpleHashEmbedding(text);
      }
    }
  }

  private simpleHashEmbedding(text: string): number[] {
    // Very basic fallback - not suitable for production
    const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return Array.from({ length: 1536 }, (_, i) => (hash + i) % 1000 / 1000);
  }
}