/**
 * Listing Manager - Sales Channel Integrations
 * Main dashboard for managing multi-channel selling
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Settings, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { ChannelConnections } from '@/components/seller/ChannelConnections';
import { ProductMappings } from '@/components/seller/ProductMappings';
import { OrderSync } from '@/components/seller/OrderSync';
import { InventorySync } from '@/components/seller/InventorySync';
import { PriceSync } from '@/components/seller/PriceSync';

interface ChannelConnection {
  id: string;
  channel_type: string;
  channel_name: string;
  is_active: boolean;
  connection_status: 'connected' | 'disconnected' | 'error';
  last_order_sync?: string;
  last_inventory_sync?: string;
  last_error_message?: string;
}

interface DashboardStats {
  totalConnections: number;
  activeConnections: number;
  pendingOrders: number;
  syncErrors: number;
}

export default function ListingManagerPage() {
  const [connections, setConnections] = useState<ChannelConnection[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalConnections: 0,
    activeConnections: 0,
    pendingOrders: 0,
    syncErrors: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [connectionsRes, statsRes] = await Promise.all([
        fetch('/api/seller/channels'),
        fetch('/api/seller/channels/stats')
      ]);

      const connectionsData = await connectionsRes.json();
      const statsData = await statsRes.json();

      setConnections(connectionsData.connections || []);
      setStats(statsData.stats || stats);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Listing Manager</h1>
          <p className="text-gray-600">Manage your sales channels and multi-channel selling</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Channel
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Connections</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConnections}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeConnections} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sync Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.syncErrors}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Channels</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeConnections}</div>
            <p className="text-xs text-muted-foreground">
              Syncing automatically
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Channel Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Channel Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connections.map((connection) => (
              <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {connection.channel_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{connection.channel_name}</p>
                    <p className="text-sm text-gray-500">{connection.channel_type}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(connection.connection_status)}>
                  {getStatusIcon(connection.connection_status)}
                  <span className="ml-1 capitalize">{connection.connection_status}</span>
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="channels" className="space-y-4">
        <TabsList>
          <TabsTrigger value="channels">Channel Connections</TabsTrigger>
          <TabsTrigger value="products">Product Mappings</TabsTrigger>
          <TabsTrigger value="orders">Order Sync</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Sync</TabsTrigger>
          <TabsTrigger value="prices">Price Sync</TabsTrigger>
        </TabsList>

        <TabsContent value="channels">
          <ChannelConnections onUpdate={fetchDashboardData} />
        </TabsContent>

        <TabsContent value="products">
          <ProductMappings onUpdate={fetchDashboardData} />
        </TabsContent>

        <TabsContent value="orders">
          <OrderSync onUpdate={fetchDashboardData} />
        </TabsContent>

        <TabsContent value="inventory">
          <InventorySync onUpdate={fetchDashboardData} />
        </TabsContent>

        <TabsContent value="prices">
          <PriceSync onUpdate={fetchDashboardData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}