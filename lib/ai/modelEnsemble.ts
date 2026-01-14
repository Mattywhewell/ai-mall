import { callOpenAI } from './openaiClient';
import { callAnthropic } from './anthropicClient';
import { callAzureOpenAI } from './azureClient';
import { callGrok } from './grokClient';
import { callLocalModel } from './local/ollamaManager';
import { CostTracker } from './costTracker';

export interface EnsembleMember {
  provider: string;
  model: string;
  weight: number; // 0-1, contribution to final result
  specialty: string[]; // types of tasks this model excels at
  cost: number; // estimated cost per request
  latency: number; // estimated latency in ms
}

export interface EnsembleTask {
  type: 'creative' | 'analytical' | 'conversational' | 'factual' | 'coding' | 'summarization';
  complexity: 'simple' | 'medium' | 'complex';
  priority: 'speed' | 'quality' | 'cost';
  maxCost?: number;
  maxLatency?: number;
}

export interface EnsembleResult {
  finalAnswer: string;
  confidence: number; // 0-1
  sources: Array<{
    provider: string;
    model: string;
    response: string;
    score: number; // individual model score
    cost: number;
    latency: number;
  }>;
  metadata: {
    totalCost: number;
    totalLatency: number;
    ensembleMethod: string;
    taskType: string;
  };
}

export class ModelEnsemble {
  private static instance: ModelEnsemble;
  private costTracker = CostTracker.getInstance();

  private ensembleMembers: EnsembleMember[] = [
    {
      provider: 'openai',
      model: 'gpt-4',
      weight: 0.4,
      specialty: ['analytical', 'coding', 'complex'],
      cost: 0.03,
      latency: 2000
    },
    {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      weight: 0.2,
      specialty: ['conversational', 'simple', 'summarization'],
      cost: 0.002,
      latency: 800
    },
    {
      provider: 'anthropic',
      model: 'claude-3-opus',
      weight: 0.35,
      specialty: ['creative', 'analytical', 'complex'],
      cost: 0.015,
      latency: 1800
    },
    {
      provider: 'anthropic',
      model: 'claude-3-haiku',
      weight: 0.15,
      specialty: ['simple', 'factual', 'summarization'],
      cost: 0.00025,
      latency: 600
    },
    {
      provider: 'grok',
      model: 'grok-1',
      weight: 0.25,
      specialty: ['conversational', 'creative', 'factual'],
      cost: 0.01,
      latency: 1200
    },
    {
      provider: 'azure-openai',
      model: 'gpt-4',
      weight: 0.3,
      specialty: ['analytical', 'coding', 'enterprise'],
      cost: 0.03,
      latency: 2200
    },
    {
      provider: 'local',
      model: 'llama-3.1-8b',
      weight: 0.1,
      specialty: ['simple', 'factual', 'cost-effective'],
      cost: 0, // No API cost
      latency: 1500
    },
    {
      provider: 'local',
      model: 'mistral-7b',
      weight: 0.1,
      specialty: ['analytical', 'coding', 'efficient'],
      cost: 0,
      latency: 1200
    }
  ];

  private constructor() {}

  static getInstance(): ModelEnsemble {
    if (!ModelEnsemble.instance) {
      ModelEnsemble.instance = new ModelEnsemble();
    }
    return ModelEnsemble.instance;
  }

  /**
   * Execute a task using the optimal model ensemble
   */
  async executeEnsembleTask(
    prompt: string,
    systemPrompt: string,
    task: EnsembleTask
  ): Promise<EnsembleResult> {
    // Select optimal ensemble members
    const selectedMembers = this.selectEnsembleMembers(task);

    if (selectedMembers.length === 0) {
      throw new Error('No suitable models available for this task');
    }

    // Check budget constraints
    const totalEstimatedCost = selectedMembers.reduce((sum, member) => sum + member.cost, 0);
    if (task.maxCost && totalEstimatedCost > task.maxCost) {
      // Fallback to cheaper models
      const cheapMembers = this.selectEnsembleMembers({
        ...task,
        priority: 'cost',
        maxCost: task.maxCost
      });
      if (cheapMembers.length > 0) {
        return this.executeWithMembers(prompt, systemPrompt, cheapMembers, task);
      }
      throw new Error(`Estimated cost $${totalEstimatedCost.toFixed(3)} exceeds budget $${task.maxCost}`);
    }

    return this.executeWithMembers(prompt, systemPrompt, selectedMembers, task);
  }

  /**
   * Select the best ensemble members for a task
   */
  private selectEnsembleMembers(task: EnsembleTask): EnsembleMember[] {
    let candidates = this.ensembleMembers.filter(member =>
      member.specialty.includes(task.type)
    );

    if (candidates.length === 0) {
      // Fallback to all members if no specialty match
      candidates = [...this.ensembleMembers];
    }

    // Sort by priority
    switch (task.priority) {
      case 'speed':
        candidates.sort((a, b) => a.latency - b.latency);
        break;
      case 'cost':
        candidates.sort((a, b) => a.cost - b.cost);
        break;
      case 'quality':
      default:
        candidates.sort((a, b) => b.weight - a.weight);
        break;
    }

    // Limit based on complexity
    const maxMembers = task.complexity === 'simple' ? 2 :
                      task.complexity === 'medium' ? 3 : 4;

    // Ensure diversity - don't use multiple models from same provider
    const selected: EnsembleMember[] = [];
    const usedProviders = new Set<string>();

    for (const member of candidates) {
      if (selected.length >= maxMembers) break;
      if (!usedProviders.has(member.provider)) {
        selected.push(member);
        usedProviders.add(member.provider);
      }
    }

    return selected;
  }

  /**
   * Execute task with selected ensemble members
   */
  private async executeWithMembers(
    prompt: string,
    systemPrompt: string,
    members: EnsembleMember[],
    task: EnsembleTask
  ): Promise<EnsembleResult> {
    const sources: EnsembleResult['sources'] = [];
    const startTime = Date.now();

    // Execute all member requests in parallel
    const promises = members.map(async (member) => {
      try {
        const result = await this.callProvider(
          member.provider,
          member.model,
          prompt,
          systemPrompt,
          task
        );

        const costMetrics = {
          provider: member.provider,
          model: member.model,
          inputTokens: this.estimateTokens(prompt + systemPrompt),
          outputTokens: this.estimateTokens(result.response),
          totalTokens: this.estimateTokens(prompt + systemPrompt + result.response),
          cost: member.cost,
          timestamp: new Date().toISOString(),
          taskType: task.type,
          success: true,
          latency: result.latency
        };

        await this.costTracker.recordCost(costMetrics);

        return {
          member,
          result: {
            response: result.response,
            score: result.score,
            latency: result.latency
          }
        };
      } catch (error) {
        console.error(`Ensemble member ${member.provider}/${member.model} failed:`, error);

        // Record failed cost metrics
        const costMetrics = {
          provider: member.provider,
          model: member.model,
          inputTokens: this.estimateTokens(prompt + systemPrompt),
          outputTokens: 0,
          totalTokens: this.estimateTokens(prompt + systemPrompt),
          cost: 0, // No cost for failed requests
          timestamp: new Date().toISOString(),
          taskType: task.type,
          success: false,
          latency: 0
        };

        await this.costTracker.recordCost(costMetrics);

        return {
          member,
          result: {
            response: '',
            score: 0,
            latency: 0
          }
        };
      }
    });

    const results = await Promise.all(promises);

    // Process results
    for (const { member, result } of results) {
      if (result.response) {
        sources.push({
          provider: member.provider,
          model: member.model,
          response: result.response,
          score: result.score,
          cost: member.cost,
          latency: result.latency
        });
      }
    }

    if (sources.length === 0) {
      throw new Error('All ensemble members failed');
    }

    // Combine results using ensemble method
    const ensembleResult = this.combineResults(sources, task);
    const totalLatency = Date.now() - startTime;
    const totalCost = sources.reduce((sum, source) => sum + source.cost, 0);

    return {
      finalAnswer: ensembleResult.answer,
      confidence: ensembleResult.confidence,
      sources,
      metadata: {
        totalCost,
        totalLatency,
        ensembleMethod: 'weighted_voting',
        taskType: task.type
      }
    };
  }

  /**
   * Call individual provider
   */
  private async callProvider(
    provider: string,
    model: string,
    prompt: string,
    systemPrompt: string,
    task: EnsembleTask
  ): Promise<{ response: string; score: number; latency: number }> {
    const startTime = Date.now();

    let response: string;

    switch (provider) {
      case 'openai':
        response = await callOpenAI(systemPrompt, prompt, 0.7);
        break;
      case 'anthropic':
        response = await callAnthropic(systemPrompt, prompt, 0.7);
        break;
      case 'azure-openai':
        response = await callAzureOpenAI(systemPrompt, prompt, 0.7);
        break;
      case 'grok':
        response = await callGrok(systemPrompt, prompt, 0.7);
        break;
      case 'local':
        response = await callLocalModel(model, systemPrompt, prompt);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }

    const latency = Date.now() - startTime;
    const score = this.scoreResponse(response, task);

    return { response, score, latency };
  }

  /**
   * Score individual response quality
   */
  private scoreResponse(response: string, task: EnsembleTask): number {
    if (!response || response.length < 10) return 0.1;

    let score = 0.5; // Base score

    // Length appropriateness
    const wordCount = response.split(' ').length;
    const idealLength = task.complexity === 'simple' ? 50 :
                       task.complexity === 'medium' ? 150 : 300;

    if (Math.abs(wordCount - idealLength) < idealLength * 0.5) {
      score += 0.2;
    }

    // Task-specific scoring
    switch (task.type) {
      case 'creative':
        // Check for creative elements
        const creativeWords = ['imagine', 'create', 'innovative', 'unique', 'design'];
        const creativeMatches = creativeWords.filter(word =>
          response.toLowerCase().includes(word)
        ).length;
        score += creativeMatches * 0.1;
        break;

      case 'analytical':
        // Check for structured analysis
        const hasStructure = response.includes('\n') || response.includes('- ') || response.includes('1.');
        if (hasStructure) score += 0.2;
        break;

      case 'coding':
        // Check for code-like content
        const hasCode = response.includes('```') || response.includes('function') || response.includes('class');
        if (hasCode) score += 0.3;
        break;

      case 'factual':
        // Check for factual indicators
        const factualWords = ['according to', 'research shows', 'data indicates', 'studies'];
        const factualMatches = factualWords.filter(word =>
          response.toLowerCase().includes(word)
        ).length;
        score += factualMatches * 0.1;
        break;
    }

    return Math.min(1.0, Math.max(0.0, score));
  }

  /**
   * Combine multiple responses into final answer
   */
  private combineResults(
    sources: EnsembleResult['sources'],
    task: EnsembleTask
  ): { answer: string; confidence: number } {
    if (sources.length === 1) {
      return {
        answer: sources[0].response,
        confidence: sources[0].score
      };
    }

    // Weighted voting based on scores
    const totalWeight = sources.reduce((sum, source) => sum + source.score, 0);

    if (task.type === 'creative') {
      // For creative tasks, use the highest-scoring response
      const bestSource = sources.reduce((best, current) =>
        current.score > best.score ? current : best
      );
      return {
        answer: bestSource.response,
        confidence: bestSource.score
      };
    }

    if (task.type === 'factual' || task.type === 'analytical') {
      // For factual tasks, combine and synthesize
      return this.synthesizeResponses(sources, totalWeight);
    }

    // Default: weighted combination
    return this.weightedCombination(sources, totalWeight);
  }

  private synthesizeResponses(
    sources: EnsembleResult['sources'],
    totalWeight: number
  ): { answer: string; confidence: number } {
    // Use the highest-scoring response as base
    const bestSource = sources.reduce((best, current) =>
      current.score > best.score ? current : best
    );

    // If multiple high-scoring responses, combine key points
    const highScoring = sources.filter(s => s.score > 0.7);
    if (highScoring.length > 1) {
      const combinedAnswer = this.combineKeyPoints(highScoring);
      return {
        answer: combinedAnswer,
        confidence: totalWeight / sources.length
      };
    }

    return {
      answer: bestSource.response,
      confidence: bestSource.score
    };
  }

  private combineKeyPoints(sources: EnsembleResult['sources']): string {
    const allText = sources.map(s => s.response).join(' ');

    // Simple extraction of key sentences
    const sentences = allText.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const uniqueSentences = [...new Set(sentences.map(s => s.trim()))];

    // Return top 3 most representative sentences
    return uniqueSentences.slice(0, 3).join('. ') + '.';
  }

  private weightedCombination(
    sources: EnsembleResult['sources'],
    totalWeight: number
  ): { answer: string; confidence: number } {
    // For simple combination, use the response with highest weight
    const bestSource = sources.reduce((best, current) =>
      (current.score / totalWeight) > (best.score / totalWeight) ? current : best
    );

    return {
      answer: bestSource.response,
      confidence: totalWeight / sources.length
    };
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Get ensemble statistics
   */
  getEnsembleStats(): {
    totalMembers: number;
    membersByProvider: Record<string, number>;
    averageWeights: Record<string, number>;
    specialtyCoverage: Record<string, number>;
  } {
    const membersByProvider: Record<string, number> = {};
    const averageWeights: Record<string, number> = {};
    const specialtyCoverage: Record<string, number> = {};

    this.ensembleMembers.forEach(member => {
      membersByProvider[member.provider] = (membersByProvider[member.provider] || 0) + 1;

      if (!averageWeights[member.provider]) {
        averageWeights[member.provider] = 0;
      }
      averageWeights[member.provider] += member.weight;

      member.specialty.forEach(specialty => {
        specialtyCoverage[specialty] = (specialtyCoverage[specialty] || 0) + 1;
      });
    });

    // Calculate averages
    Object.keys(averageWeights).forEach(provider => {
      const count = membersByProvider[provider];
      averageWeights[provider] /= count;
    });

    return {
      totalMembers: this.ensembleMembers.length,
      membersByProvider,
      averageWeights,
      specialtyCoverage
    };
  }

  /**
   * Update member weights based on performance
   */
  updateMemberWeights(provider: string, model: string, performanceScore: number): void {
    const member = this.ensembleMembers.find(m => m.provider === provider && m.model === model);
    if (member) {
      // Adjust weight based on performance (0-1 scale)
      const adjustment = (performanceScore - 0.5) * 0.1; // Small adjustments
      member.weight = Math.max(0.05, Math.min(0.5, member.weight + adjustment));
    }
  }

  /**
   * Add new ensemble member
   */
  addEnsembleMember(member: EnsembleMember): void {
    // Check if member already exists
    const existing = this.ensembleMembers.find(m =>
      m.provider === member.provider && m.model === member.model
    );

    if (existing) {
      Object.assign(existing, member);
    } else {
      this.ensembleMembers.push(member);
    }
  }

  /**
   * Remove ensemble member
   */
  removeEnsembleMember(provider: string, model: string): void {
    const index = this.ensembleMembers.findIndex(m =>
      m.provider === provider && m.model === model
    );
    if (index !== -1) {
      this.ensembleMembers.splice(index, 1);
    }
  }
}