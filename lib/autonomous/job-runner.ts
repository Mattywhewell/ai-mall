/**
 * Background Job Runner for Autonomous Systems
 * Continuously runs AI optimization cycles
 */

import { AutonomousCore } from './core';
import { ProductIntelligence } from './product-intelligence';
import { MerchandisingEngine } from './merchandising-engine';
import { DistrictEvolution } from './district-evolution';
import { SelfHealingSystem } from './self-healing';
import { SocialMediaEngine } from './social-media-engine';
import { AIAnalytics } from './ai-analytics';
import { PersonalizationEngine } from './personalization-engine';
import { PluginSystem } from './plugin-system';
import { supabase } from '../supabaseClient';

export class AutonomousJobRunner {
  private static isRunning = false;
  private static intervals: NodeJS.Timeout[] = [];

  /**
   * Start all autonomous background jobs
   */
  static async start() {
    if (this.isRunning) {
      console.log('⚠️  Job runner already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting autonomous job runner...');

    // Initialize systems
    await PluginSystem.initialize();
    await AutonomousCore.getInstance().start();

    // Schedule recurring jobs
    this.scheduleJobs();

    console.log('✓ Autonomous job runner started');
  }

  /**
   * Stop all background jobs
   */
  static stop() {
    console.log('🛑 Stopping autonomous job runner...');
    
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    this.isRunning = false;

    console.log('✓ Job runner stopped');
  }

  /**
   * Schedule recurring autonomous jobs
   */
  private static scheduleJobs() {
    // Product Intelligence - Analyze and optimize products every 10 minutes (was 30)
    this.intervals.push(
      setInterval(async () => {
        try {
          console.log('🧠 Running product intelligence cycle...');
          await ProductIntelligence.analyzeProducts();
        } catch (error) {
          console.error('Product intelligence error:', error);
        }
      }, 10 * 60 * 1000) // 10 minutes
    );

    // Merchandising Optimization - Update product ordering every 5 minutes (was 15)
    this.intervals.push(
      setInterval(async () => {
        try {
          console.log('🎯 Running merchandising optimization...');
          const { data: districts } = await supabase
            .from('microstores')
            .select('id, slug')
            .limit(10);

          if (districts) {
            for (const district of districts) {
              await MerchandisingEngine.autoGenerateRules();
            }
          }
        } catch (error) {
          console.error('Merchandising optimization error:', error);
        }
      }, 5 * 60 * 1000) // 5 minutes
    );

    // District Evolution - Evolve districts every 2 hours (was 6)
    this.intervals.push(
      setInterval(async () => {
        try {
          console.log('🧬 Running district evolution...');
          const { data: districts } = await supabase
            .from('microstores')
            .select('slug')
            .limit(5);

          if (districts) {
            for (const district of districts) {
              await DistrictEvolution.evolveDistrict(district.slug);
            }
          }
        } catch (error) {
          console.error('District evolution error:', error);
        }
      }, 2 * 60 * 60 * 1000) // 2 hours
    );

    // Self-Healing - Health checks every hour
    this.intervals.push(
      setInterval(async () => {
        try {
          console.log('⚕️  Running health check...');
          await SelfHealingSystem.runHealthCheck();
        } catch (error) {
          console.error('Health check error:', error);
        }
      }, 60 * 60 * 1000) // 1 hour
    );

    // Social Media - Generate weekly calendars every Monday
    this.intervals.push(
      setInterval(async () => {
        const today = new Date();
        if (today.getDay() === 1) { // Monday
          try {
            console.log('📱 Generating social media calendars...');
            const { data: districts } = await supabase
              .from('microstores')
              .select('slug')
              .limit(10);

            if (districts) {
              for (const district of districts) {
                await SocialMediaEngine.generateWeeklyCalendar(district.slug);
              }
            }
          } catch (error) {
            console.error('Social media generation error:', error);
          }
        }
      }, 24 * 60 * 60 * 1000) // Daily check
    );

    // Analytics Narratives - Generate daily summaries
    this.intervals.push(
      setInterval(async () => {
        try {
          console.log('📊 Generating analytics narratives...');
          const { data: districts } = await supabase
            .from('microstores')
            .select('id')
            .limit(10);

          if (districts) {
            for (const district of districts) {
              await AIAnalytics.generateNarrative(district.id, 'day');
            }
          }
        } catch (error) {
          console.error('Analytics narrative error:', error);
        }
      }, 24 * 60 * 60 * 1000) // Daily
    );

    // Anomaly Detection - Check every 2 hours
    this.intervals.push(
      setInterval(async () => {
        try {
          console.log('🔍 Detecting anomalies...');
          const { data: districts } = await supabase
            .from('microstores')
            .select('id')
            .limit(10);

          if (districts) {
            for (const district of districts) {
              await AIAnalytics.detectAnomalies(district.id);
            }
          }
        } catch (error) {
          console.error('Anomaly detection error:', error);
        }
      }, 2 * 60 * 60 * 1000) // 2 hours
    );

    // A/B Test Analysis - Check every 4 hours
    this.intervals.push(
      setInterval(async () => {
        try {
          console.log('🧪 Analyzing A/B tests...');
          const { data: runningTests } = await supabase
            .from('ab_tests')
            .select('*')
            .eq('status', 'running');

          if (runningTests) {
            for (const test of runningTests) {
              const results: any = await MerchandisingEngine.analyzeABTest(test.id);
              if (results && typeof results === 'object' && 'winner' in results && results.winner) {
                console.log(`✓ Test ${test.test_name} winner: ${results.winner}`);
              }
            }
          }
        } catch (error) {
          console.error('A/B test analysis error:', error);
        }
      }, 4 * 60 * 60 * 1000) // 4 hours
    );

    // User Profile Updates - Process active users every 5 minutes
    this.intervals.push(
      setInterval(async () => {
        try {
          console.log('👤 Updating user profiles...');
          
          // Get recently active users
          const { data: recentUsers } = await supabase
            .from('analytics')
            .select('user_id')
            .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false });

          if (recentUsers) {
            const uniqueUsers = [...new Set(recentUsers.map(u => u.user_id))];
            
            for (const userId of uniqueUsers.slice(0, 20)) {
              if (userId) {
                await PersonalizationEngine.buildUserProfile(userId);
              }
            }
          }
        } catch (error) {
          console.error('User profile update error:', error);
        }
      }, 5 * 60 * 1000) // 5 minutes
    );

    // Plugin Hooks - Execute optimization hooks every 20 minutes
    this.intervals.push(
      setInterval(async () => {
        try {
          console.log('🔌 Executing plugin hooks...');
          await PluginSystem.executeHook('onOptimizationCycle');
        } catch (error) {
          console.error('Plugin execution error:', error);
        }
      }, 20 * 60 * 1000) // 20 minutes
    );

    console.log(`✓ Scheduled ${this.intervals.length} autonomous jobs`);
  }

  /**
   * Run one-time optimization
   */
  static async runOptimization() {
    console.log('⚡ Running one-time optimization...');

    try {
      await ProductIntelligence.analyzeProducts();
      await SelfHealingSystem.runHealthCheck();
      
      const { data: districts } = await supabase
        .from('microstores')
        .select('id, slug')
        .limit(5);

      if (districts) {
        for (const district of districts) {
          await MerchandisingEngine.autoGenerateRules();
          await AIAnalytics.generateNarrative(district.id, 'week');
        }
      }

      console.log('✓ Optimization complete');
    } catch (error) {
      console.error('Optimization error:', error);
    }
  }

  /**
   * Get runner status
   */
  static getStatus() {
    return {
      isRunning: this.isRunning,
      activeJobs: this.intervals.length,
      uptime: process.uptime(),
    };
  }
}

// Auto-start in production (can be disabled via env var)
// Temporarily disabled for testing
// if (process.env.NODE_ENV === 'production' && process.env.DISABLE_AUTO_JOBS !== 'true') {
//   AutonomousJobRunner.start().catch(console.error);
// }
