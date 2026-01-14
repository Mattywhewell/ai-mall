'use client';

/**
 * AI Scaling Dashboard Component
 * Real-time scaling metrics and controls
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Activity,
  TrendingUp,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle,
  Zap,
  Users
} from 'lucide-react';

interface ScalingMetrics {
  currentLoad: number;
  maxCapacity: number;
  queueDepth: number;
  providerUtilization: Record<string, number>;
  responseTime: number;
  errorRate: number;
  costPerRequest: number;
}

interface ScalingRecommendation {
  action: 'scale_up' | 'scale_down' | 'rebalance' | 'add_provider' | 'optimize';
  target: string;
  reason: string;
  impact: {
    cost: number;
    performance: number;
    reliability: number;
  };
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

interface ScalingDashboardData {
  metrics: ScalingMetrics;
  recommendations: ScalingRecommendation[];
  history: Array<{
    timestamp: string;
    action: string;
    metrics: ScalingMetrics;
    result: 'success' | 'failure';
  }>;
  predictions: {
    nextHourLoad: number;
    recommendedCapacity: number;
    costProjection: number;
  };
}

export function ScalingDashboard() {
  const [data, setData] = useState<ScalingDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchScalingData();
    const interval = setInterval(fetchScalingData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchScalingData = async () => {
    try {
      const response = await fetch('/api/ai/scaling');
      if (!response.ok) throw new Error('Failed to fetch scaling data');
      const result = await response.json();
      setData(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const executeRecommendation = async (recommendation: ScalingRecommendation) => {
    setExecuting(`${recommendation.action}_${recommendation.target}`);
    try {
      const response = await fetch('/api/ai/scaling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: recommendation.action,
          target: recommendation.target
        })
      });

      if (!response.ok) throw new Error('Failed to execute scaling action');

      // Refresh data after execution
      await fetchScalingData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute action');
    } finally {
      setExecuting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error || 'Failed to load scaling data'}
        </AlertDescription>
      </Alert>
    );
  }

  const { metrics, recommendations, history, predictions } = data;
  const utilizationPercent = (metrics.currentLoad / metrics.maxCapacity) * 100;

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'scale_up': return <TrendingUp className="h-4 w-4" />;
      case 'scale_down': return <TrendingUp className="h-4 w-4 rotate-180" />;
      case 'rebalance': return <Activity className="h-4 w-4" />;
      case 'add_provider': return <Zap className="h-4 w-4" />;
      case 'optimize': return <DollarSign className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Scaling Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time scaling metrics and automated optimization
          </p>
        </div>
        <Button onClick={fetchScalingData} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Load</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.currentLoad}</div>
            <p className="text-xs text-muted-foreground">
              of {metrics.maxCapacity} capacity
            </p>
            <Progress value={utilizationPercent} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.responseTime.toFixed(0)}ms</div>
            <p className="text-xs text-muted-foreground">
              Average latency
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost/Request</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.costPerRequest.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">
              Per request cost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics.errorRate * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Request failure rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Provider Utilization */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Utilization</CardTitle>
          <CardDescription>
            Current load distribution across AI providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(metrics.providerUtilization).map(([provider, utilization]) => (
              <div key={provider} className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{provider}</span>
                <div className="flex items-center space-x-2">
                  <Progress value={utilization * 100} className="w-24" />
                  <span className="text-sm text-muted-foreground w-12">
                    {(utilization * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Scaling Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Scaling Recommendations</CardTitle>
          <CardDescription>
            Automated suggestions for optimizing performance and cost
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recommendations.length === 0 ? (
            <p className="text-muted-foreground">No scaling actions needed at this time.</p>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getActionIcon(rec.action)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium capitalize">
                          {rec.action.replace('_', ' ')} {rec.target}
                        </span>
                        <Badge className={getUrgencyColor(rec.urgency)}>
                          {rec.urgency}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.reason}</p>
                      <div className="flex space-x-4 mt-1 text-xs">
                        <span>Cost: {rec.impact.cost > 0 ? '+' : ''}{(rec.impact.cost * 100).toFixed(0)}%</span>
                        <span>Perf: {rec.impact.performance > 0 ? '+' : ''}{(rec.impact.performance * 100).toFixed(0)}%</span>
                        <span>Rel: {rec.impact.reliability > 0 ? '+' : ''}{(rec.impact.reliability * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => executeRecommendation(rec)}
                    disabled={executing === `${rec.action}_${rec.target}`}
                    size="sm"
                  >
                    {executing === `${rec.action}_${rec.target}` ? 'Executing...' : 'Execute'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Predictions */}
      <Card>
        <CardHeader>
          <CardTitle>Load Predictions</CardTitle>
          <CardDescription>
            Forecasted load and recommended capacity for the next hour
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{predictions.nextHourLoad}</div>
              <p className="text-sm text-muted-foreground">Predicted Load</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{predictions.recommendedCapacity}</div>
              <p className="text-sm text-muted-foreground">Recommended Capacity</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">${predictions.costProjection.toFixed(2)}</div>
              <p className="text-sm text-muted-foreground">Projected Cost/Hour</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Scaling History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Scaling Actions</CardTitle>
          <CardDescription>
            History of automated scaling decisions and their outcomes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {history.slice(0, 5).map((action, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-2">
                  {action.result === 'success' ?
                    <CheckCircle className="h-4 w-4 text-green-500" /> :
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  }
                  <span className="text-sm">
                    {action.action.replace('_', ' ')} - {new Date(action.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <Badge variant={action.result === 'success' ? 'default' : 'destructive'}>
                  {action.result}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}