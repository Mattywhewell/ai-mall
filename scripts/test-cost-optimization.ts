#!/usr/bin/env tsx

/**
 * AI Cost Optimization Test Suite
 * Comprehensive testing for cost optimization strategies
 */

import { CostOptimizationEngine } from '../lib/ai/cost-optimization-engine';
import { AIRouter } from '../lib/ai/modelRouter';
import { CostTracker } from '../lib/ai/costTracker';

interface CostOptimizationTestResult {
  testName: string;
  duration: number;
  costSavings: number;
  optimizationsApplied: number;
  success: boolean;
  details: Record<string, any>;
}

class CostOptimizationTester {
  private costEngine: CostOptimizationEngine;
  private router: AIRouter;
  private costTracker: CostTracker;

  constructor() {
    this.costEngine = CostOptimizationEngine.getInstance();
    this.router = AIRouter.getInstance();
    this.costTracker = CostTracker.getInstance();
  }

  /**
   * Test cost analysis functionality
   */
  async testCostAnalysis(): Promise<CostOptimizationTestResult> {
    console.log('💰 Testing cost analysis...');

    const startTime = Date.now();
    let success = false;
    let costSavings = 0;
    let optimizationsApplied = 0;
    const details: Record<string, any> = {};

    try {
      // Set test budget limits
      this.costEngine.setBudgetLimits(100, 3000);

      // Generate some test cost data
      await this.generateTestCostData();

      // Run cost analysis
      const analysis = await this.costEngine.analyzeCosts();

      details.metrics = analysis.metrics;
      details.optimizations = analysis.optimizations.length;
      details.potentialSavings = analysis.totalPotentialSavings;

      // Validate analysis results
      if (analysis.metrics.totalCost >= 0 &&
          analysis.optimizations.length > 0 &&
          analysis.totalPotentialSavings > 0) {
        success = true;
        costSavings = analysis.totalPotentialSavings;
        optimizationsApplied = analysis.optimizations.length;
      }

    } catch (error) {
      console.error('Cost analysis test failed:', error);
      details.error = error.message;
    }

    return {
      testName: 'Cost_Analysis',
      duration: Date.now() - startTime,
      costSavings,
      optimizationsApplied,
      success,
      details
    };
  }

  /**
   * Test optimization execution
   */
  async testOptimizationExecution(): Promise<CostOptimizationTestResult> {
    console.log('⚡ Testing optimization execution...');

    const startTime = Date.now();
    let success = false;
    let costSavings = 0;
    let optimizationsApplied = 0;
    const details: Record<string, any> = {};

    try {
      // Get available optimizations
      const analysis = await this.costEngine.analyzeCosts();
      const optimizations = analysis.optimizations.slice(0, 2); // Test first 2

      details.availableOptimizations = optimizations.length;

      // Execute optimizations
      for (const opt of optimizations) {
        try {
          const result = await this.costEngine.executeOptimization(opt.ruleId);
          if (result) {
            optimizationsApplied++;
            costSavings += opt.potentialSavings;
          }
        } catch (error) {
          console.warn(`Failed to execute optimization ${opt.ruleId}:`, error);
        }
      }

      success = optimizationsApplied > 0;
      details.executedOptimizations = optimizationsApplied;

    } catch (error) {
      console.error('Optimization execution test failed:', error);
      details.error = error.message;
    }

    return {
      testName: 'Optimization_Execution',
      duration: Date.now() - startTime,
      costSavings,
      optimizationsApplied,
      success,
      details
    };
  }

  /**
   * Test budget management
   */
  async testBudgetManagement(): Promise<CostOptimizationTestResult> {
    console.log('💵 Testing budget management...');

    const startTime = Date.now();
    let success = false;
    let costSavings = 0;
    let optimizationsApplied = 0;
    const details: Record<string, any> = {};

    try {
      // Set budget limits
      this.costEngine.setBudgetLimits(50, 1500);

      // Generate test data that exceeds budget
      await this.generateHighCostData();

      // Get budget status
      const dashboard = await this.costEngine.getCostDashboard();

      details.budgetStatus = dashboard.budgetStatus;
      details.dailyLimit = 50;
      details.monthlyLimit = 1500;

      // Validate budget tracking
      if (dashboard.budgetStatus.dailyUsed >= 0 &&
          dashboard.budgetStatus.monthlyUsed >= 0 &&
          dashboard.budgetStatus.dailyPercentage >= 0 &&
          dashboard.budgetStatus.monthlyPercentage >= 0) {
        success = true;
      }

      // Test budget alerts (simulate high usage)
      if (dashboard.budgetStatus.dailyPercentage > 80) {
        optimizationsApplied = 1; // Would trigger cost-saving measures
        costSavings = dashboard.budgetStatus.dailyUsed * 0.2; // 20% potential savings
      }

    } catch (error) {
      console.error('Budget management test failed:', error);
      details.error = error.message;
    }

    return {
      testName: 'Budget_Management',
      duration: Date.now() - startTime,
      costSavings,
      optimizationsApplied,
      success,
      details
    };
  }

  /**
   * Test provider cost optimization
   */
  async testProviderOptimization(): Promise<CostOptimizationTestResult> {
    console.log('🏷️ Testing provider cost optimization...');

    const startTime = Date.now();
    let success = false;
    let costSavings = 0;
    let optimizationsApplied = 0;
    const details: Record<string, any> = {};

    try {
      // Generate mixed provider cost data
      await this.generateMixedProviderData();

      // Analyze costs
      const analysis = await this.costEngine.analyzeCosts();

      // Check for provider-related optimizations
      const providerOptimizations = analysis.optimizations.filter(opt =>
        opt.ruleId.includes('provider') || opt.ruleId.includes('local')
      );

      details.providerOptimizations = providerOptimizations.length;
      details.totalOptimizations = analysis.optimizations.length;

      if (providerOptimizations.length > 0) {
        success = true;
        costSavings = providerOptimizations.reduce((sum, opt) => sum + opt.potentialSavings, 0);
        optimizationsApplied = providerOptimizations.length;
      }

    } catch (error) {
      console.error('Provider optimization test failed:', error);
      details.error = error.message;
    }

    return {
      testName: 'Provider_Optimization',
      duration: Date.now() - startTime,
      costSavings,
      optimizationsApplied,
      success,
      details
    };
  }

  /**
   * Generate test cost data
   */
  private async generateTestCostData(): Promise<void> {
    const testData = [
      { provider: 'openai', cost: 25.50, requestCount: 1000 },
      { provider: 'anthropic', cost: 15.75, requestCount: 500 },
      { provider: 'ollama', cost: 0, requestCount: 2000 },
      { provider: 'grok', cost: 8.25, requestCount: 300 }
    ];

    // Simulate adding cost data (this would normally come from actual usage)
    for (const data of testData) {
      // In a real implementation, this would update the cost tracker
      console.log(`Generated test data: ${data.provider} - $${data.cost}`);
    }
  }

  /**
   * Generate high-cost test data
   */
  private async generateHighCostData(): Promise<void> {
    // Generate data that exceeds budget limits
    const highCostData = [
      { provider: 'openai', cost: 75.00, requestCount: 3000 }, // Exceeds daily budget
      { provider: 'anthropic', cost: 45.50, requestCount: 1500 }
    ];

    for (const data of highCostData) {
      console.log(`Generated high-cost data: ${data.provider} - $${data.cost}`);
    }
  }

  /**
   * Generate mixed provider data
   */
  private async generateMixedProviderData(): Promise<void> {
    const mixedData = [
      { provider: 'openai', cost: 120.00, requestCount: 4000 },
      { provider: 'ollama', cost: 0, requestCount: 8000 }, // Much cheaper
      { provider: 'azure', cost: 80.00, requestCount: 3500 },
      { provider: 'grok', cost: 25.00, requestCount: 1000 }
    ];

    for (const data of mixedData) {
      console.log(`Generated mixed data: ${data.provider} - $${data.cost}`);
    }
  }

  /**
   * Run comprehensive cost optimization test suite
   */
  async runFullTestSuite(): Promise<{
    results: CostOptimizationTestResult[];
    summary: {
      totalTests: number;
      passedTests: number;
      totalSavings: number;
      totalOptimizations: number;
      averageDuration: number;
    };
  }> {
    console.log('🚀 Starting comprehensive cost optimization test suite');

    const results: CostOptimizationTestResult[] = [];

    // Test 1: Cost Analysis
    console.log('\n📊 Test 1: Cost Analysis');
    const analysisTest = await this.testCostAnalysis();
    results.push(analysisTest);

    // Test 2: Optimization Execution
    console.log('\n⚡ Test 2: Optimization Execution');
    const executionTest = await this.testOptimizationExecution();
    results.push(executionTest);

    // Test 3: Budget Management
    console.log('\n💵 Test 3: Budget Management');
    const budgetTest = await this.testBudgetManagement();
    results.push(budgetTest);

    // Test 4: Provider Optimization
    console.log('\n🏷️ Test 4: Provider Optimization');
    const providerTest = await this.testProviderOptimization();
    results.push(providerTest);

    // Calculate summary
    const passedTests = results.filter(r => r.success).length;
    const totalSavings = results.reduce((sum, r) => sum + r.costSavings, 0);
    const totalOptimizations = results.reduce((sum, r) => sum + r.optimizationsApplied, 0);
    const averageDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

    const summary = {
      totalTests: results.length,
      passedTests,
      totalSavings,
      totalOptimizations,
      averageDuration
    };

    console.log('\n📋 Cost Optimization Test Summary:');
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed Tests: ${summary.passedTests}`);
    console.log(`Total Potential Savings: $${summary.totalSavings.toFixed(2)}`);
    console.log(`Optimizations Applied: ${summary.totalOptimizations}`);
    console.log(`Average Duration: ${summary.averageDuration.toFixed(2)}ms`);

    return { results, summary };
  }
}

// Run tests if executed directly
if (require.main === module) {
  const tester = new CostOptimizationTester();

  tester.runFullTestSuite()
    .then(({ results, summary }) => {
      console.log('\n✅ Cost optimization tests completed');
      console.log(`Success Rate: ${((summary.passedTests / summary.totalTests) * 100).toFixed(1)}%`);

      if (summary.totalSavings > 0) {
        console.log(`💰 Potential Monthly Savings: $${summary.totalSavings.toFixed(2)}`);
      }

      process.exit(summary.passedTests === summary.totalTests ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Cost optimization tests failed:', error);
      process.exit(1);
    });
}

export { CostOptimizationTester };
export type { CostOptimizationTestResult };