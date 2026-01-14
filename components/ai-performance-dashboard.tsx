/**
 * Advanced AI Performance Monitoring Dashboard
 * Phase 3: Real-time optimization and monitoring
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Activity,
  DollarSign,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Settings
} from 'lucide-react';

interface HealthData {
  system: {
    overall: 'healthy' | 'degraded' | 'critical' | 'unknown';
    totalTasks: number;
    successRate: number;
    totalCost: number;
    avgLatency: number;
    providers: number;
    lastUpdated: string;
  };
  providers: Array<{
    provider: string;
    status: 'healthy' | 'degraded' | 'down';
    latency: number;
    errorRate: number;
    tasksExecuted: number;
    totalCost: number;
    avgCostPerTask: number;
  }>;
  optimizations: Array<{
    provider: string;
    model: string;
    efficiency: number;
    avgLatency: number;
    successRate: number;
    recommendation: 'keep' | 'reduce' | 'increase' | 'replace';
    reason: string;
  }>;
  recentTasks: Array<{
    id: string;
    type: string;
    provider: string;
    latency: number;
    cost: number;
    result: 'success' | 'failure';
    timestamp: string;
  }>;
  budgetStatus: Array<{
    provider: string;
    currentDaily: number;
    currentMonthly: number;
    dailyLimit: number;
    monthlyLimit: number;
    status: 'ok' | 'warning' | 'exceeded';
  }>;
}

export default function AIPerformanceDashboard() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchHealthData = async () => {
    try {
      const response = await fetch('/api/ai/health');
      if (!response.ok) throw new Error('Failed to fetch health data');
      const data = await response.json();
      setHealthData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical':
      case 'down': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !healthData) {
    return (
      <Alert className="max-w-4xl mx-auto">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Monitoring Error</AlertTitle>
        <AlertDescription>
          {error || 'Unable to load AI performance data'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Performance Dashboard</h1>
          <p className="text-gray-600">Phase 3: Advanced Monitoring & Optimization</p>
        </div>
        <Button onClick={fetchHealthData} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            {getStatusIcon(healthData.system.overall)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{healthData.system.overall}</div>
            <p className="text-xs text-gray-600">
              {healthData.system.providers} providers active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthData.system.successRate.toFixed(1)}%</div>
            <Progress value={healthData.system.successRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost (24h)</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${healthData.system.totalCost.toFixed(4)}</div>
            <p className="text-xs text-gray-600">
              {healthData.system.totalTasks} tasks executed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <Zap className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthData.system.avgLatency}ms</div>
            <p className="text-xs text-gray-600">
              Across all providers
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="providers">Provider Status</TabsTrigger>
          <TabsTrigger value="tasks">Recent Tasks</TabsTrigger>
          <TabsTrigger value="optimizations">Optimizations</TabsTrigger>
          <TabsTrigger value="budget">Budget Status</TabsTrigger>
        </TabsList>

        <TabsContent value="providers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {healthData.providers.map((provider) => (
              <Card key={provider.provider}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="capitalize">{provider.provider.replace('-', ' ')}</span>
                    {getStatusIcon(provider.status)}
                  </CardTitle>
                  <CardDescription>
                    Status: <span className={getStatusColor(provider.status)}>{provider.status}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Latency:</span>
                    <span>{provider.latency}ms</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Error Rate:</span>
                    <span>{(provider.errorRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tasks:</span>
                    <span>{provider.tasksExecuted}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Cost:</span>
                    <span>${provider.totalCost.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg Cost/Task:</span>
                    <span>${provider.avgCostPerTask.toFixed(6)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Task Executions</CardTitle>
              <CardDescription>Last 10 tasks processed by the routing system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {healthData.recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-3">
                      {task.result === 'success' ?
                        <CheckCircle className="h-4 w-4 text-green-600" /> :
                        <XCircle className="h-4 w-4 text-red-600" />
                      }
                      <div>
                        <div className="font-medium">{task.id}</div>
                        <div className="text-sm text-gray-600">
                          {task.type} • {task.provider} • {task.latency}ms • ${task.cost.toFixed(6)}
                        </div>
                      </div>
                    </div>
                    <Badge variant={task.result === 'success' ? 'default' : 'destructive'}>
                      {task.result}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimizations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Optimization Recommendations</CardTitle>
              <CardDescription>AI-powered suggestions to reduce costs and improve performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {healthData.optimizations.map((opt, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{opt.provider} - {opt.model}</h4>
                      <Badge variant={
                        opt.recommendation === 'keep' ? 'default' :
                        opt.recommendation === 'reduce' ? 'secondary' :
                        opt.recommendation === 'increase' ? 'outline' : 'destructive'
                      }>
                        {opt.recommendation}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{opt.reason}</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>Efficiency: {opt.efficiency.toFixed(2)} tokens/$</div>
                      <div>Avg Latency: {opt.avgLatency}ms</div>
                      <div>Success Rate: {(opt.successRate * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {healthData.budgetStatus.map((budget) => (
              <Card key={budget.provider}>
                <CardHeader>
                  <CardTitle className="capitalize">{budget.provider.replace('-', ' ')} Budget</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Daily Usage</span>
                      <span>${budget.currentDaily.toFixed(4)} / ${budget.dailyLimit}</span>
                    </div>
                    <Progress
                      value={(budget.currentDaily / budget.dailyLimit) * 100}
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Monthly Usage</span>
                      <span>${budget.currentMonthly.toFixed(4)} / ${budget.monthlyLimit}</span>
                    </div>
                    <Progress
                      value={(budget.currentMonthly / budget.monthlyLimit) * 100}
                      className="h-2"
                    />
                  </div>
                  <Badge variant={
                    budget.status === 'ok' ? 'default' :
                    budget.status === 'warning' ? 'secondary' : 'destructive'
                  }>
                    {budget.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}