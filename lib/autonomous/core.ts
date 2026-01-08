/**
 * Autonomous Intelligence Core
 * This is the brain of the self-evolving mall system.
 * It orchestrates all autonomous operations and learning cycles.
 */

import { supabase } from '../supabaseClient';
import { callOpenAI } from '../ai/openaiClient';

export interface AutonomousTask {
  id: string;
  type: 'optimization' | 'content_generation' | 'analysis' | 'healing' | 'evolution';
  priority: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  schedule: string; // cron expression
  last_run?: string;
  next_run?: string;
  config: Record<string, any>;
  results?: Record<string, any>;
}

export interface LearningSignal {
  entity_type: 'product' | 'district' | 'vendor' | 'layout';
  entity_id: string;
  metric: string;
  value: number;
  context: Record<string, any>;
  timestamp: string;
}

export class AutonomousCore {
  private static instance: AutonomousCore;
  private isRunning: boolean = false;
  private tasks: Map<string, AutonomousTask> = new Map();

  private constructor() {
    this.initializeTasks();
  }

  static getInstance(): AutonomousCore {
    if (!AutonomousCore.instance) {
      AutonomousCore.instance = new AutonomousCore();
    }
    return AutonomousCore.instance;
  }

  /**
   * Initialize default autonomous tasks
   */
  private initializeTasks() {
    const defaultTasks: AutonomousTask[] = [
      {
        id: 'optimize_products',
        type: 'optimization',
        priority: 100,
        status: 'pending',
        schedule: '0 2 * * *', // Daily at 2 AM
        config: { batch_size: 50 },
      },
      {
        id: 'evolve_districts',
        type: 'evolution',
        priority: 90,
        status: 'pending',
        schedule: '0 3 * * 0', // Weekly on Sunday at 3 AM
        config: { threshold: 0.7 },
      },
      {
        id: 'generate_social_content',
        type: 'content_generation',
        priority: 80,
        status: 'pending',
        schedule: '0 8 * * 1', // Weekly on Monday at 8 AM
        config: { platforms: ['tiktok', 'instagram', 'twitter'] },
      },
      {
        id: 'self_heal',
        type: 'healing',
        priority: 100,
        status: 'pending',
        schedule: '*/30 * * * *', // Every 30 minutes
        config: { check_images: true, check_data: true },
      },
      {
        id: 'analyze_performance',
        type: 'analysis',
        priority: 85,
        status: 'pending',
        schedule: '0 */6 * * *', // Every 6 hours
        config: { generate_insights: true },
      },
    ];

    defaultTasks.forEach((task) => this.tasks.set(task.id, task));
  }

  /**
   * Start the autonomous system
   */
  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🤖 Autonomous Core: System activated');

    // Initialize learning cycle
    this.startLearningCycle();
    
    // Initialize task scheduler
    this.startTaskScheduler();
    
    // Initialize signal processing
    this.startSignalProcessor();
  }

  /**
   * Continuous learning cycle
   */
  private async startLearningCycle() {
    setInterval(async () => {
      try {
        await this.processLearningSignals();
      } catch (error) {
        console.error('Learning cycle error:', error);
      }
    }, 60000); // Every minute
  }

  /**
   * Process learning signals from the system
   */
  private async processLearningSignals() {
    // Fetch recent signals
    const { data: signals, error } = await supabase
      .from('learning_signals')
      .select('*')
      .eq('processed', false)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error || !signals || signals.length === 0) return;

    // Group signals by entity
    const groupedSignals = this.groupSignalsByEntity(signals);

    // Process each entity
    for (const [entityKey, entitySignals] of Object.entries(groupedSignals)) {
      await this.applyLearning(entityKey, entitySignals as LearningSignal[]);
    }

    // Mark signals as processed
    const signalIds = signals.map((s) => s.id);
    await supabase
      .from('learning_signals')
      .update({ processed: true })
      .in('id', signalIds);
  }

  /**
   * Apply learning from signals
   */
  private async applyLearning(entityKey: string, signals: LearningSignal[]) {
    const [entityType, entityId] = entityKey.split(':');

    // Calculate aggregate metrics
    const metrics = this.aggregateMetrics(signals);

    // Determine if optimization is needed
    if (this.shouldOptimize(metrics)) {
      await this.scheduleOptimization(entityType, entityId, metrics);
    }
  }

  /**
   * Schedule an optimization task
   */
  private async scheduleOptimization(
    entityType: string,
    entityId: string,
    metrics: Record<string, number>
  ) {
    await supabase.from('autonomous_tasks').insert({
      type: 'optimization',
      entity_type: entityType,
      entity_id: entityId,
      priority: this.calculatePriority(metrics),
      config: { metrics },
      status: 'pending',
    });
  }

  /**
   * Task scheduler
   */
  private startTaskScheduler() {
    setInterval(async () => {
      await this.executePendingTasks();
    }, 30000); // Every 30 seconds
  }

  /**
   * Execute pending tasks
   */
  private async executePendingTasks() {
    const { data: tasks, error } = await supabase
      .from('autonomous_tasks')
      .select('*')
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .limit(5);

    if (error || !tasks) return;

    for (const task of tasks) {
      await this.executeTask(task);
    }
  }

  /**
   * Execute a single task
   */
  private async executeTask(task: any) {
    try {
      // Mark as running
      await supabase
        .from('autonomous_tasks')
        .update({ status: 'running', started_at: new Date().toISOString() })
        .eq('id', task.id);

      let result;
      switch (task.type) {
        case 'optimization':
          result = await this.runOptimization(task);
          break;
        case 'evolution':
          result = await this.runEvolution(task);
          break;
        case 'content_generation':
          result = await this.runContentGeneration(task);
          break;
        case 'healing':
          result = await this.runHealing(task);
          break;
        case 'analysis':
          result = await this.runAnalysis(task);
          break;
      }

      // Mark as completed
      await supabase
        .from('autonomous_tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          results: result,
        })
        .eq('id', task.id);

      console.log(`✓ Task completed: ${task.type} for ${task.entity_type}:${task.entity_id}`);
    } catch (error) {
      console.error(`Task failed: ${task.id}`, error);
      await supabase
        .from('autonomous_tasks')
        .update({ status: 'failed', error: String(error) })
        .eq('id', task.id);
    }
  }

  /**
   * Run optimization task
   */
  private async runOptimization(task: any): Promise<any> {
    // Implementation will be in specific optimization modules
    return { optimized: true, timestamp: new Date().toISOString() };
  }

  /**
   * Run evolution task
   */
  private async runEvolution(task: any): Promise<any> {
    return { evolved: true, timestamp: new Date().toISOString() };
  }

  /**
   * Run content generation task
   */
  private async runContentGeneration(task: any): Promise<any> {
    return { generated: true, timestamp: new Date().toISOString() };
  }

  /**
   * Run healing task
   */
  private async runHealing(task: any): Promise<any> {
    return { healed: true, timestamp: new Date().toISOString() };
  }

  /**
   * Run analysis task
   */
  private async runAnalysis(task: any): Promise<any> {
    return { analyzed: true, timestamp: new Date().toISOString() };
  }

  /**
   * Signal processor for real-time events
   */
  private startSignalProcessor() {
    // Subscribe to real-time events
    supabase
      .channel('learning_signals')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'learning_signals' },
        (payload) => {
          this.handleSignal(payload.new as LearningSignal);
        }
      )
      .subscribe();
  }

  /**
   * Handle incoming signal
   */
  private async handleSignal(signal: LearningSignal) {
    // Process critical signals immediately
    if (this.isCriticalSignal(signal)) {
      await this.handleCriticalSignal(signal);
    }
  }

  /**
   * Helper methods
   */
  private groupSignalsByEntity(signals: any[]): Record<string, LearningSignal[]> {
    return signals.reduce((acc, signal) => {
      const key = `${signal.entity_type}:${signal.entity_id}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(signal);
      return acc;
    }, {});
  }

  private aggregateMetrics(signals: LearningSignal[]): Record<string, number> {
    const metrics: Record<string, number[]> = {};
    
    signals.forEach((signal) => {
      if (!metrics[signal.metric]) metrics[signal.metric] = [];
      metrics[signal.metric].push(signal.value);
    });

    return Object.entries(metrics).reduce((acc, [metric, values]) => {
      acc[metric] = values.reduce((sum, v) => sum + v, 0) / values.length;
      return acc;
    }, {} as Record<string, number>);
  }

  private shouldOptimize(metrics: Record<string, number>): boolean {
    // Optimize if conversion rate is low or engagement is declining
    return (
      (metrics.conversion_rate !== undefined && metrics.conversion_rate < 0.02) ||
      (metrics.engagement_rate !== undefined && metrics.engagement_rate < 0.1) ||
      (metrics.bounce_rate !== undefined && metrics.bounce_rate > 0.7)
    );
  }

  private calculatePriority(metrics: Record<string, number>): number {
    let priority = 50;
    
    if (metrics.conversion_rate !== undefined) {
      priority += (0.05 - metrics.conversion_rate) * 1000;
    }
    
    if (metrics.engagement_rate !== undefined) {
      priority += (0.2 - metrics.engagement_rate) * 500;
    }
    
    return Math.max(0, Math.min(100, priority));
  }

  private isCriticalSignal(signal: LearningSignal): boolean {
    return (
      (signal.metric === 'error_rate' && signal.value > 0.1) ||
      (signal.metric === 'load_time' && signal.value > 5000) ||
      (signal.metric === 'crash_detected' && signal.value > 0)
    );
  }

  private async handleCriticalSignal(signal: LearningSignal) {
    console.error('🚨 Critical signal detected:', signal);
    // Immediate healing action
    await this.scheduleOptimization(signal.entity_type, signal.entity_id, {
      [signal.metric]: signal.value,
    });
  }

  /**
   * Stop the autonomous system
   */
  stop() {
    this.isRunning = false;
    console.log('🤖 Autonomous Core: System deactivated');
  }
}

/**
 * Emit a learning signal
 */
export async function emitLearningSignal(signal: Omit<LearningSignal, 'timestamp'>) {
  await supabase.from('learning_signals').insert({
    ...signal,
    timestamp: new Date().toISOString(),
    processed: false,
  });
}

/**
 * Get autonomous insights
 */
export async function getAutonomousInsights(entityType?: string, entityId?: string) {
  let query = supabase
    .from('autonomous_insights')
    .select('*')
    .order('created_at', { ascending: false });

  if (entityType) query = query.eq('entity_type', entityType);
  if (entityId) query = query.eq('entity_id', entityId);

  const { data, error } = await query.limit(50);
  return data || [];
}
