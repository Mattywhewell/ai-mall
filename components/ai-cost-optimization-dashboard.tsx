'use client';

/**
 * AI Cost Optimization Dashboard Component
 * Real-time cost monitoring and optimization controls
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DollarSign,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Zap,
  Target,
  BarChart3,
  Settings
} from 'lucide-react';

interface CostMetrics {
  totalCost: number;
  costPerRequest: number;
  providerCosts: Record<string, number>;
  requestVolume: number;
  cacheHitRate: number;
  localVsCloudRatio: number;
  wastedSpend: number;
  projectedMonthlyCost: number;
}

interface CostOptimization {
  ruleId: string;
  potentialSavings: number;
  implementationEffort: 'low' | 'medium' | 'high';
  risk: 'low' | 'medium' | 'high';
  description: string;
  action: () => Promise<boolean>;
}

interface CostDashboardData {
  metrics: CostMetrics;
  optimizations: CostOptimization[];
  budgetStatus: {
    dailyUsed: number;
    dailyRemaining: number;
    monthlyUsed: number;
    monthlyRemaining: number;
    dailyPercentage: number;
    monthlyPercentage: number;
  };
  history: Array<{
    timestamp: string;
    ruleId: string;
    savings: number;
    success: boolean;
  }>;
  recommendations: {
    immediate: CostOptimization[];
    highImpact: CostOptimization[];
    lowRisk: CostOptimization[];
  };
}

export function CostOptimizationDashboard() {
  const [data, setData] = useState<CostDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [budgetInputs, setBudgetInputs] = useState({ daily: '', monthly: '' });

  useEffect(() => {
    fetchCostData();
    const interval = setInterval(fetchCostData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchCostData = async () => {
    try {
      const response = await fetch('/api/ai/cost-optimization');
      if (!response.ok) throw new Error('Failed to fetch cost data');
      const result = await response.json();
      setData(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const executeOptimization = async (optimization: CostOptimization) => {
    setExecuting(optimization.ruleId);
    try {
      const response = await fetch('/api/ai/cost-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          optimizationId: optimization.ruleId
        })
      });

      if (!response.ok) throw new Error('Failed to execute optimization');

      // Refresh data after execution
      await fetchCostData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute optimization');
    } finally {
      setExecuting(null);
    }
  };

  const updateBudgetLimits = async () => {
    try {
      const response = await fetch('/api/ai/cost-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_budget',
          budgetLimits: {
            daily: parseFloat(budgetInputs.daily),
            monthly: parseFloat(budgetInputs.monthly)
          }
        })
      });

      if (!response.ok) throw new Error('Failed to update budget limits');

      await fetchCostData();
      setBudgetInputs({ daily: '', monthly: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update budget');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error || 'Failed to load cost data'}
        </AlertDescription>
      </Alert>
    );
  }

  const { metrics, optimizations, budgetStatus, history, recommendations } = data;

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-orange-500';
      default: return 'bg-red-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cost Optimization Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time cost monitoring and automated optimization
          </p>
        </div>
        <Button onClick={fetchCostData} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Budget Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Daily Budget</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Used: ${budgetStatus.dailyUsed.toFixed(2)}</span>
                <span>Remaining: ${budgetStatus.dailyRemaining.toFixed(2)}</span>
              </div>
              <Progress value={budgetStatus.dailyPercentage} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {budgetStatus.dailyPercentage.toFixed(1)}% of daily limit
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Monthly Budget</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Used: ${budgetStatus.monthlyUsed.toFixed(2)}</span>
                <span>Remaining: ${budgetStatus.monthlyRemaining.toFixed(2)}</span>
              </div>
              <Progress value={budgetStatus.monthlyPercentage} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {budgetStatus.monthlyPercentage.toFixed(1)}% of monthly limit
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Budget Settings</span>
          </CardTitle>
          <CardDescription>
            Set daily and monthly spending limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="daily-budget">Daily Budget ($)</Label>
              <Input
                id="daily-budget"
                type="number"
                placeholder="50"
                value={budgetInputs.daily}
                onChange={(e) => setBudgetInputs(prev => ({ ...prev, daily: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="monthly-budget">Monthly Budget ($)</Label>
              <Input
                id="monthly-budget"
                type="number"
                placeholder="1500"
                value={budgetInputs.monthly}
                onChange={(e) => setBudgetInputs(prev => ({ ...prev, monthly: e.target.value }))}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={updateBudgetLimits} className="w-full">
                Update Budget
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Cost Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost/Request</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.costPerRequest.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">
              Average per request
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Local vs Cloud</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics.localVsCloudRatio * 100).toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              Local model usage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics.cacheHitRate * 100).toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              Response cache efficiency
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projected Monthly</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.projectedMonthlyCost.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              Estimated cost
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Provider Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Cost Breakdown</CardTitle>
          <CardDescription>
            Cost distribution across AI providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(metrics.providerCosts).map(([provider, cost]) => (
              <div key={provider} className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{provider}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm">${cost.toFixed(2)}</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(cost / metrics.totalCost) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Optimization Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Recommendations</CardTitle>
          <CardDescription>
            Automated suggestions to reduce costs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {optimizations.length === 0 ? (
            <p className="text-muted-foreground">No optimizations available at this time.</p>
          ) : (
            <div className="space-y-3">
              {optimizations.slice(0, 5).map((opt, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium">{opt.description}</span>
                      <Badge className={getEffortColor(opt.implementationEffort)}>
                        {opt.implementationEffort} effort
                      </Badge>
                      <Badge className={getRiskColor(opt.risk)}>
                        {opt.risk} risk
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Potential savings: ${opt.potentialSavings.toFixed(2)}/month
                    </div>
                  </div>
                  <Button
                    onClick={() => executeOptimization(opt)}
                    disabled={executing === opt.ruleId}
                    size="sm"
                    variant="outline"
                  >
                    {executing === opt.ruleId ? 'Executing...' : 'Apply'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Immediate optimizations with high impact
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {recommendations.immediate.length}
              </div>
              <p className="text-sm text-muted-foreground">Immediate Actions</p>
              <p className="text-xs">Low effort, low risk</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {recommendations.highImpact.length}
              </div>
              <p className="text-sm text-muted-foreground">High Impact</p>
              <p className="text-xs">&gt;$100/month savings</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {recommendations.lowRisk.length}
              </div>
              <p className="text-sm text-muted-foreground">Low Risk</p>
              <p className="text-xs">Safe optimizations</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optimization History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Optimizations</CardTitle>
          <CardDescription>
            History of applied cost optimizations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {history.slice(0, 5).map((action, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-2">
                  {action.success ?
                    <CheckCircle className="h-4 w-4 text-green-500" /> :
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  }
                  <span className="text-sm capitalize">
                    {action.ruleId.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    ${action.savings.toFixed(2)} saved
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(action.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}