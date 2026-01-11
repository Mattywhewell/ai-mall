'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Cpu,
  HardDrive,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Monitor,
  Smartphone,
  Globe,
  Users,
  Clock,
  RefreshCw
} from 'lucide-react';

interface PerformanceMetrics {
  timestamp: string;
  fps: number;
  frameTime: number;
  memoryUsage: number;
  drawCalls: number;
  triangles: number;
  textures: number;
  shaders: number;
  cpuUsage: number;
  gpuUsage: number;
  networkLatency: number;
  activeUsers: number;
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: string;
  resolved: boolean;
  metric: string;
  threshold: number;
  current: number;
}

interface OptimizationSuggestion {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'easy' | 'medium' | 'hard';
  category: 'rendering' | 'memory' | 'network' | 'assets';
  implemented: boolean;
}

const mockMetrics: PerformanceMetrics[] = [
  {
    timestamp: '2024-01-15T14:30:00Z',
    fps: 58,
    frameTime: 17.2,
    memoryUsage: 85,
    drawCalls: 1247,
    triangles: 45632,
    textures: 89,
    shaders: 23,
    cpuUsage: 45,
    gpuUsage: 67,
    networkLatency: 23,
    activeUsers: 1250
  },
  {
    timestamp: '2024-01-15T14:29:00Z',
    fps: 62,
    frameTime: 16.1,
    memoryUsage: 82,
    drawCalls: 1189,
    triangles: 44321,
    textures: 87,
    shaders: 22,
    cpuUsage: 42,
    gpuUsage: 63,
    networkLatency: 21,
    activeUsers: 1245
  },
  {
    timestamp: '2024-01-15T14:28:00Z',
    fps: 55,
    frameTime: 18.2,
    memoryUsage: 88,
    drawCalls: 1321,
    triangles: 46890,
    textures: 92,
    shaders: 25,
    cpuUsage: 48,
    gpuUsage: 71,
    networkLatency: 25,
    activeUsers: 1260
  }
];

const mockAlerts: PerformanceAlert[] = [
  {
    id: '1',
    type: 'warning',
    message: 'Frame rate dropped below 55 FPS',
    timestamp: '2024-01-15T14:28:00Z',
    resolved: false,
    metric: 'fps',
    threshold: 55,
    current: 52
  },
  {
    id: '2',
    type: 'error',
    message: 'Memory usage exceeded 90%',
    timestamp: '2024-01-15T14:25:00Z',
    resolved: true,
    metric: 'memoryUsage',
    threshold: 90,
    current: 95
  },
  {
    id: '3',
    type: 'info',
    message: 'High network latency detected',
    timestamp: '2024-01-15T14:20:00Z',
    resolved: false,
    metric: 'networkLatency',
    threshold: 50,
    current: 67
  }
];

const mockSuggestions: OptimizationSuggestion[] = [
  {
    id: '1',
    title: 'Implement Level of Detail (LOD)',
    description: 'Add LOD system to reduce polygon count for distant objects',
    impact: 'high',
    effort: 'medium',
    category: 'rendering',
    implemented: false
  },
  {
    id: '2',
    title: 'Texture Compression',
    description: 'Compress textures to reduce memory usage and improve loading times',
    impact: 'high',
    effort: 'easy',
    category: 'assets',
    implemented: true
  },
  {
    id: '3',
    title: 'Occlusion Culling',
    description: 'Implement occlusion culling to avoid rendering hidden objects',
    impact: 'medium',
    effort: 'hard',
    category: 'rendering',
    implemented: false
  },
  {
    id: '4',
    title: 'Asset Streaming',
    description: 'Stream assets on-demand to reduce initial load times',
    impact: 'medium',
    effort: 'medium',
    category: 'network',
    implemented: false
  },
  {
    id: '5',
    title: 'Shader Optimization',
    description: 'Optimize shader complexity and reduce shader variants',
    impact: 'low',
    effort: 'medium',
    category: 'rendering',
    implemented: false
  }
];

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>(mockMetrics);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>(mockAlerts);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>(mockSuggestions);
  const [isRealTime, setIsRealTime] = useState(true);

  // Simulate real-time updates
  useEffect(() => {
    if (!isRealTime) return;

    const interval = setInterval(() => {
      const newMetric: PerformanceMetrics = {
        timestamp: new Date().toISOString(),
        fps: Math.floor(Math.random() * 20) + 50, // 50-70 FPS
        frameTime: Math.random() * 5 + 14, // 14-19ms
        memoryUsage: Math.floor(Math.random() * 20) + 70, // 70-90%
        drawCalls: Math.floor(Math.random() * 200) + 1100,
        triangles: Math.floor(Math.random() * 5000) + 42000,
        textures: Math.floor(Math.random() * 10) + 85,
        shaders: Math.floor(Math.random() * 5) + 20,
        cpuUsage: Math.floor(Math.random() * 20) + 35,
        gpuUsage: Math.floor(Math.random() * 20) + 55,
        networkLatency: Math.floor(Math.random() * 20) + 15,
        activeUsers: Math.floor(Math.random() * 100) + 1200
      };

      setMetrics(prev => [newMetric, ...prev.slice(0, 9)]); // Keep last 10
    }, 5000);

    return () => clearInterval(interval);
  }, [isRealTime]);

  const currentMetrics = metrics[0] || mockMetrics[0];
  const previousMetrics = metrics[1] || mockMetrics[0];

  const getMetricChange = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      color: change > 5 ? 'text-red-600' : change < -5 ? 'text-green-600' : 'text-gray-600'
    };
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'info': return <CheckCircle className="w-4 h-4 text-blue-600" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'easy': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'hard': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Performance Monitor</h3>
          <p className="text-sm text-gray-600">Real-time 3D rendering performance and optimization tools</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={isRealTime ? "default" : "outline"}
            size="sm"
            onClick={() => setIsRealTime(!isRealTime)}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRealTime ? 'animate-spin' : ''}`} />
            {isRealTime ? 'Live' : 'Paused'}
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Real-time Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Monitor className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{currentMetrics.fps}</p>
                  <p className="text-sm text-gray-600">FPS</p>
                </div>
              </div>
              <div className={`flex items-center space-x-1 ${getMetricChange(currentMetrics.fps, previousMetrics.fps).color}`}>
                {getMetricChange(currentMetrics.fps, previousMetrics.fps).direction === 'up' && <TrendingUp className="w-4 h-4" />}
                {getMetricChange(currentMetrics.fps, previousMetrics.fps).direction === 'down' && <TrendingDown className="w-4 h-4" />}
                <span className="text-sm">{getMetricChange(currentMetrics.fps, previousMetrics.fps).value.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HardDrive className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{currentMetrics.memoryUsage}%</p>
                  <p className="text-sm text-gray-600">Memory</p>
                </div>
              </div>
              <Progress value={currentMetrics.memoryUsage} className="flex-1 mx-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{currentMetrics.activeUsers.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Active Users</p>
                </div>
              </div>
              <div className={`flex items-center space-x-1 ${getMetricChange(currentMetrics.activeUsers, previousMetrics.activeUsers).color}`}>
                {getMetricChange(currentMetrics.activeUsers, previousMetrics.activeUsers).direction === 'up' && <TrendingUp className="w-4 h-4" />}
                {getMetricChange(currentMetrics.activeUsers, previousMetrics.activeUsers).direction === 'down' && <TrendingDown className="w-4 h-4" />}
                <span className="text-sm">{getMetricChange(currentMetrics.activeUsers, previousMetrics.activeUsers).value.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{currentMetrics.networkLatency}ms</p>
                  <p className="text-sm text-gray-600">Latency</p>
                </div>
              </div>
              <Badge variant={currentMetrics.networkLatency > 50 ? "destructive" : "default"}>
                {currentMetrics.networkLatency > 50 ? 'High' : 'Good'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">Detailed Metrics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts ({alerts.filter(a => !a.resolved).length})</TabsTrigger>
          <TabsTrigger value="optimizations">Optimizations</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rendering Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Monitor className="w-5 h-5" />
                  <span>Rendering Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Frame Time:</span>
                    <div className="font-medium">{currentMetrics.frameTime.toFixed(1)}ms</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Draw Calls:</span>
                    <div className="font-medium">{currentMetrics.drawCalls.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Triangles:</span>
                    <div className="font-medium">{currentMetrics.triangles.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Textures:</span>
                    <div className="font-medium">{currentMetrics.textures}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Shaders:</span>
                    <div className="font-medium">{currentMetrics.shaders}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">GPU Usage:</span>
                    <div className="font-medium">{currentMetrics.gpuUsage}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Cpu className="w-5 h-5" />
                  <span>System Resources</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>CPU Usage</span>
                      <span>{currentMetrics.cpuUsage}%</span>
                    </div>
                    <Progress value={currentMetrics.cpuUsage} />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>GPU Usage</span>
                      <span>{currentMetrics.gpuUsage}%</span>
                    </div>
                    <Progress value={currentMetrics.gpuUsage} />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Memory Usage</span>
                      <span>{currentMetrics.memoryUsage}%</span>
                    </div>
                    <Progress value={currentMetrics.memoryUsage} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance History Chart Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Performance History</CardTitle>
              <CardDescription>Last 10 minutes of performance data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Performance chart visualization</p>
                  <p className="text-sm text-gray-500">Chart component would be implemented here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card key={alert.id} className={alert.resolved ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium">{alert.message}</h4>
                        {alert.resolved && (
                          <Badge variant="outline" className="text-green-600">
                            Resolved
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{alert.metric}: {alert.current} (threshold: {alert.threshold})</span>
                        <span>{new Date(alert.timestamp).toLocaleString()}</span>
                      </div>
                    </div>

                    {!alert.resolved && (
                      <Button variant="outline" size="sm">
                        Resolve
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="optimizations" className="space-y-4">
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <Card key={suggestion.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium">{suggestion.title}</h4>
                        <Badge variant="outline" className="capitalize">
                          {suggestion.category}
                        </Badge>
                        {suggestion.implemented && (
                          <Badge className="bg-green-100 text-green-800">
                            Implemented
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>

                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <span className="text-gray-600">Impact:</span>
                          <span className={`font-medium capitalize ${getImpactColor(suggestion.impact)}`}>
                            {suggestion.impact}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-gray-600">Effort:</span>
                          <span className={`font-medium capitalize ${getEffortColor(suggestion.effort)}`}>
                            {suggestion.effort}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!suggestion.implemented && (
                      <Button variant="outline" size="sm">
                        Implement
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}