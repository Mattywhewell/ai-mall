'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Box,
  Map,
  ShoppingBag,
  Users,
  BarChart3,
  Settings,
  Upload,
  Edit,
  Trash2,
  Eye,
  Plus
} from 'lucide-react';

// Import admin tool components
import { AssetManager } from './admin/AssetManager';
import { SceneManager } from './admin/SceneManager';
import { ShopTourManager } from './admin/ShopTourManager';
import { SpatialCommonsAdmin } from './admin/SpatialCommonsAdmin';
import { PerformanceMonitor } from './admin/PerformanceMonitor';
import { UserAnalytics } from './admin/UserAnalytics';

interface Admin3DDashboardProps {
  className?: string;
}

export function Admin3DDashboard({ className = '' }: Admin3DDashboardProps) {
  const [activeTab, setActiveTab] = useState('assets');

  const adminTools = [
    {
      id: 'assets',
      label: '3D Assets',
      icon: Box,
      description: 'Manage 3D models, textures, and materials',
      component: AssetManager
    },
    {
      id: 'scenes',
      label: 'Scenes',
      icon: Map,
      description: 'Create and edit 3D scenes and environments',
      component: SceneManager
    },
    {
      id: 'shops',
      label: 'Shop Tours',
      icon: ShoppingBag,
      description: 'Manage immersive 3D shop experiences',
      component: ShopTourManager
    },
    {
      id: 'commons',
      label: 'Spatial Commons',
      icon: Users,
      description: 'Manage districts, citizens, and interactions',
      component: SpatialCommonsAdmin
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: BarChart3,
      description: 'Monitor 3D rendering performance and optimization',
      component: PerformanceMonitor
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: Eye,
      description: 'Track user interactions in 3D spaces',
      component: UserAnalytics
    }
  ];

  return (
    <div className={`w-full h-full bg-gray-50 ${className}`}>
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">3D Admin Tools</h1>
          <p className="text-gray-600">
            Manage and optimize the 3D spatial environment, assets, and user experiences
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Box className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Assets</p>
                  <p className="text-2xl font-bold">247</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Map className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Active Scenes</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Shop Tours</p>
                  <p className="text-2xl font-bold">8</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Daily Visitors</p>
                  <p className="text-2xl font-bold">1.2K</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Admin Interface */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle>3D Management Console</CardTitle>
            <CardDescription>
              Comprehensive tools for managing the spatial environment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                {adminTools.map((tool) => (
                  <TabsTrigger key={tool.id} value={tool.id} className="flex items-center space-x-2">
                    <tool.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tool.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {adminTools.map((tool) => (
                <TabsContent key={tool.id} value={tool.id} className="mt-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold flex items-center space-x-2">
                      <tool.icon className="w-5 h-5" />
                      <span>{tool.label}</span>
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{tool.description}</p>
                  </div>
                  <tool.component />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}