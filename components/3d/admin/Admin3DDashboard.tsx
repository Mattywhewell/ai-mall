'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  Map,
  Users,
  Settings,
  Activity,
  BarChart3,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { AssetManager } from './AssetManager';
import { SceneManager } from './SceneManager';
import { ShopTourManager } from './ShopTourManager';
import { SpatialCommonsAdmin } from './SpatialCommonsAdmin';
import { PerformanceMonitor } from './PerformanceMonitor';
import { UserAnalytics } from './UserAnalytics';

interface SystemStatus {
  assets: 'healthy' | 'warning' | 'error';
  scenes: 'healthy' | 'warning' | 'error';
  commons: 'healthy' | 'warning' | 'error';
  performance: 'healthy' | 'warning' | 'error';
}

export function Admin3DDashboard() {
  const [activeTab, setActiveTab] = useState('assets');
  const [systemStatus] = useState<SystemStatus>({
    assets: 'healthy',
    scenes: 'healthy',
    commons: 'warning',
    performance: 'healthy'
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const quickStats = [
    {
      label: 'Total Assets',
      value: '1,247',
      change: '+12%',
      icon: <Package className="w-5 h-5" />
    },
    {
      label: 'Active Scenes',
      value: '8',
      change: '+2',
      icon: <Map className="w-5 h-5" />
    },
    {
      label: 'Online Citizens',
      value: '1,250',
      change: '+8%',
      icon: <Users className="w-5 h-5" />
    },
    {
      label: 'Avg Performance',
      value: '58 FPS',
      change: '+5%',
      icon: <Activity className="w-5 h-5" />
    }
  ];

  const tabs = [
    {
      id: 'assets',
      label: 'Assets',
      icon: <Package className="w-4 h-4" />,
      component: <AssetManager />,
      status: systemStatus.assets
    },
    {
      id: 'scenes',
      label: 'Scenes',
      icon: <Map className="w-4 h-4" />,
      component: <SceneManager />,
      status: systemStatus.scenes
    },
    {
      id: 'tours',
      label: 'Shop Tours',
      icon: <Play className="w-4 h-4" />,
      component: <ShopTourManager />,
      status: 'healthy' as const
    },
    {
      id: 'commons',
      label: 'Spatial Commons',
      icon: <Users className="w-4 h-4" />,
      component: <SpatialCommonsAdmin />,
      status: systemStatus.commons
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: <Activity className="w-4 h-4" />,
      component: <PerformanceMonitor />,
      status: systemStatus.performance
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="w-4 h-4" />,
      component: <UserAnalytics />,
      status: 'healthy' as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">3D Admin Dashboard</h2>
          <p className="text-gray-600">Comprehensive management tools for your 3D spatial environment</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>System Online</span>
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {quickStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="text-blue-600">{stat.icon}</div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-green-600">
                  {stat.change}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Current health of all 3D systems and services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tabs.map((tab) => (
              <div key={tab.id} className="flex items-center space-x-2">
                {getStatusIcon(tab.status)}
                <div>
                  <p className="font-medium capitalize">{tab.label}</p>
                  <Badge className={`text-xs ${getStatusColor(tab.status)}`}>
                    {tab.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Admin Interface */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b px-6 py-4">
              <TabsList className="grid w-full grid-cols-6">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center space-x-2"
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {tabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="p-6">
                {tab.component}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}