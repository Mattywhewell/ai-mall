#!/usr/bin/env tsx

/**
 * AI Scaling Test Suite
 * Comprehensive testing for scaling capabilities
 */

import { AIRouter } from '../lib/ai/modelRouter';
import { AIScalingManager } from '../lib/ai/scaling-manager';
import { PerformanceOptimizer } from '../lib/ai/performance-optimizer';

interface ScalingTestResult {
  testName: string;
  duration: number;
  requestsProcessed: number;
  averageLatency: number;
  errorRate: number;
  costPerRequest: number;
  peakConcurrency: number;
  success: boolean;
}

class ScalingTester {
  private router: AIRouter;
  private scalingManager: AIScalingManager;
  private optimizer: PerformanceOptimizer;

  constructor() {
    this.router = AIRouter.getInstance();
    this.scalingManager = AIScalingManager.getInstance();
    this.optimizer = PerformanceOptimizer.getInstance();
  }

  /**
   * Test concurrent request handling
   */
  async testConcurrentRequests(concurrency: number, duration: number = 60000): Promise<ScalingTestResult> {
    console.log(`🧪 Testing ${concurrency} concurrent requests for ${duration}ms`);

    const startTime = Date.now();
    const requests: Promise<any>[] = [];
    const results: Array<{ latency: number; success: boolean; cost?: number }> = [];

    // Generate concurrent requests
    for (let i = 0; i < concurrency; i++) {
      const request = this.simulateAIRequest(i);
      requests.push(request);
    }

    // Execute requests with timing
    const startExecution = Date.now();
    const responses = await Promise.allSettled(requests);
    const endExecution = Date.now();

    // Process results
    responses.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push({
          latency: result.value.latency,
          success: true,
          cost: result.value.cost
        });
      } else {
        results.push({
          latency: endExecution - startExecution,
          success: false
        });
      }
    });

    const successfulRequests = results.filter(r => r.success).length;
    const averageLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;
    const errorRate = (results.length - successfulRequests) / results.length;
    const totalCost = results.reduce((sum, r) => sum + (r.cost || 0), 0);
    const costPerRequest = totalCost / successfulRequests;

    return {
      testName: `Concurrent_${concurrency}`,
      duration: endExecution - startTime,
      requestsProcessed: successfulRequests,
      averageLatency,
      errorRate,
      costPerRequest,
      peakConcurrency: concurrency,
      success: errorRate < 0.1 // Less than 10% error rate
    };
  }

  /**
   * Test load ramp-up scenario
   */
  async testLoadRampUp(maxConcurrency: number, steps: number = 10): Promise<ScalingTestResult[]> {
    console.log(`📈 Testing load ramp-up to ${maxConcurrency} concurrent requests`);

    const results: ScalingTestResult[] = [];
    const stepSize = Math.floor(maxConcurrency / steps);

    for (let i = 1; i <= steps; i++) {
      const concurrency = i * stepSize;
      const result = await this.testConcurrentRequests(concurrency, 10000); // 10 second test per step
      results.push(result);

      // Brief pause between steps
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return results;
  }

  /**
   * Test provider failover scenario
   */
  async testProviderFailover(): Promise<ScalingTestResult> {
    console.log('🔄 Testing provider failover');

    const startTime = Date.now();
    let requestsProcessed = 0;
    let totalLatency = 0;
    let errors = 0;

    // Simulate primary provider failure
    const originalHealth = this.router.getHealthStatus();
    // Temporarily mark OpenAI as unhealthy
    (this.router as any).healthStatus.openai = { status: 'unhealthy', latency: 10000 };

    try {
      // Run requests during "failure"
      const testDuration = 30000; // 30 seconds
      const endTime = startTime + testDuration;

      while (Date.now() < endTime) {
        const requestStart = Date.now();
        try {
          await this.simulateAIRequest(Date.now());
          const latency = Date.now() - requestStart;
          totalLatency += latency;
          requestsProcessed++;
        } catch (error) {
          errors++;
        }

        // Small delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } finally {
      // Restore original health status
      (this.router as any).healthStatus = originalHealth;
    }

    const averageLatency = totalLatency / Math.max(requestsProcessed, 1);
    const errorRate = errors / (requestsProcessed + errors);

    return {
      testName: 'Provider_Failover',
      duration: Date.now() - startTime,
      requestsProcessed,
      averageLatency,
      errorRate,
      costPerRequest: 0, // Would need cost tracking integration
      peakConcurrency: 1, // Sequential requests
      success: errorRate < 0.2 // Allow higher error rate during failover
    };
  }

  /**
   * Test scaling manager recommendations
   */
  async testScalingManager(): Promise<{
    recommendations: any[];
    executionResults: boolean[];
  }> {
    console.log('⚖️ Testing scaling manager');

    const recommendations = await this.scalingManager.evaluateScalingNeeds();
    const executionResults: boolean[] = [];

    for (const rec of recommendations.slice(0, 2)) { // Test first 2 recommendations
      const success = await this.scalingManager.executeScalingAction(rec);
      executionResults.push(success);
    }

    return { recommendations, executionResults };
  }

  /**
   * Simulate an AI request for testing
   */
  private async simulateAIRequest(id: number): Promise<{ latency: number; cost: number }> {
    const startTime = Date.now();

    // Simulate different types of AI requests
    const requestTypes = ['chat', 'embedding', 'completion', 'analysis'];
    const requestType = requestTypes[id % requestTypes.length];

    const result = await this.router.routeRequest({
      type: requestType,
      prompt: `Test ${requestType} request ${id}`,
      maxTokens: 100,
      temperature: 0.7
    });

    const latency = Date.now() - startTime;
    const cost = this.estimateCost(requestType, 100);

    return { latency, cost };
  }

  /**
   * Estimate cost for a request (simplified)
   */
  private estimateCost(type: string, tokens: number): number {
    const rates = {
      chat: 0.002,
      embedding: 0.0001,
      completion: 0.002,
      analysis: 0.003
    };

    return (rates[type as keyof typeof rates] || 0.001) * (tokens / 1000);
  }

  /**
   * Run comprehensive scaling test suite
   */
  async runFullTestSuite(): Promise<{
    results: ScalingTestResult[];
    summary: {
      totalTests: number;
      passedTests: number;
      averageLatency: number;
      maxThroughput: number;
      costEfficiency: number;
    };
  }> {
    console.log('🚀 Starting comprehensive scaling test suite');

    const results: ScalingTestResult[] = [];

    // Test 1: Baseline performance
    console.log('\n📊 Test 1: Baseline Performance');
    const baseline = await this.testConcurrentRequests(10, 10000);
    results.push(baseline);

    // Test 2: Load ramp-up
    console.log('\n📈 Test 2: Load Ramp-up');
    const rampUpResults = await this.testLoadRampUp(50, 5);
    results.push(...rampUpResults);

    // Test 3: High concurrency
    console.log('\n⚡ Test 3: High Concurrency');
    const highConcurrency = await this.testConcurrentRequests(100, 20000);
    results.push(highConcurrency);

    // Test 4: Provider failover
    console.log('\n🔄 Test 4: Provider Failover');
    const failover = await this.testProviderFailover();
    results.push(failover);

    // Test 5: Scaling manager
    console.log('\n⚖️ Test 5: Scaling Manager');
    const scalingTest = await this.testScalingManager();
    console.log(`Found ${scalingTest.recommendations.length} recommendations`);
    console.log(`Executed ${scalingTest.executionResults.filter(r => r).length}/${scalingTest.executionResults.length} actions successfully`);

    // Calculate summary
    const passedTests = results.filter(r => r.success).length;
    const averageLatency = results.reduce((sum, r) => sum + r.averageLatency, 0) / results.length;
    const maxThroughput = Math.max(...results.map(r => r.requestsProcessed / (r.duration / 1000)));
    const totalCost = results.reduce((sum, r) => sum + (r.costPerRequest * r.requestsProcessed), 0);
    const totalRequests = results.reduce((sum, r) => sum + r.requestsProcessed, 0);
    const costEfficiency = totalRequests > 0 ? totalCost / totalRequests : 0;

    const summary = {
      totalTests: results.length,
      passedTests,
      averageLatency,
      maxThroughput,
      costEfficiency
    };

    console.log('\n📋 Test Summary:');
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed Tests: ${summary.passedTests}`);
    console.log(`Average Latency: ${summary.averageLatency.toFixed(2)}ms`);
    console.log(`Max Throughput: ${summary.maxThroughput.toFixed(2)} req/sec`);
    console.log(`Cost Efficiency: $${summary.costEfficiency.toFixed(4)}/request`);

    return { results, summary };
  }
}

// Run tests if executed directly
if (require.main === module) {
  const tester = new ScalingTester();

  tester.runFullTestSuite()
    .then(({ results, summary }) => {
      console.log('\n✅ Scaling tests completed');
      process.exit(summary.passedTests === summary.totalTests ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Scaling tests failed:', error);
      process.exit(1);
    });
}

export { ScalingTester, ScalingTestResult };