/**
 * Inventory Synchronization Management
 * Control stock levels across connected sales channels
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Package, RefreshCw, AlertTriangle, CheckCircle, Search, Filter } from 'lucide-react';

interface InventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  local_stock: number;
  channel_connection_id: string;
  channel_name: string;
  channel_stock: number;
  channel_product_id: string;
  channel_sku: string;
  sync_enabled: boolean;
  last_sync: string;
  sync_status: 'synced' | 'pending' | 'error';
  stock_threshold: number;
}

interface InventorySyncProps {
  onUpdate: () => void;
}

export function InventorySync({ onUpdate }: InventorySyncProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setErrorMessage(null);
    setLoading(true);

    // Test hook: when ?test_seed=inventory is present we short-circuit network calls and use deterministic seeded data.
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('test_seed') === 'inventory') {
          // Import seeded data (kept outside to avoid shipping heavy test assets accidentally)
          const { seededInventory, seededChannels } = await import('@/lib/test/seeds');
          setInventory(seededInventory as any[]);
          setChannels(seededChannels as any[]);
          setLoading(false);
          return;
        }
      }

      const [inventoryRes, channelsRes] = await Promise.all([
        fetch('/api/seller/inventory'),
        fetch('/api/seller/channels?active=true')
      ]);

      if (!inventoryRes.ok || !channelsRes.ok) {
        const text = await Promise.resolve((!inventoryRes.ok ? inventoryRes.text() : channelsRes.text())).catch(() => '');
        throw new Error(`Server error: ${text}`);
      }

      const inventoryData = await inventoryRes.json();
      const channelsData = await channelsRes.json();

      setInventory(inventoryData.inventory || []);
      setChannels(channelsData.connections || []);
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      setErrorMessage('Failed to load inventory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSync = async (inventoryId: string, enabled: boolean) => {
    try {
      await fetch(`/api/seller/inventory/${inventoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sync_enabled: enabled })
      });
      fetchData();
      onUpdate();
    } catch (error) {
      console.error('Failed to update sync setting:', error);
    }
  };

  const handleSyncInventory = async (inventoryId?: string) => {
    setSyncing(inventoryId || 'all');

    try {
      const url = inventoryId
        ? `/api/seller/inventory/${inventoryId}/sync`
        : '/api/seller/inventory/sync';

      const response = await fetch(url, {
        method: 'POST'
      });

      if (response.ok) {
        fetchData();
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to sync inventory:', error);
    } finally {
      setSyncing(null);
    }
  };

  const handleUpdateStock = async (inventoryId: string, newStock: number) => {
    try {
      await fetch(`/api/seller/inventory/${inventoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_stock: newStock })
      });
      fetchData();
      onUpdate();
    } catch (error) {
      console.error('Failed to update stock:', error);
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getStockStatus = (localStock: number, channelStock: number, threshold: number) => {
    if (localStock <= threshold) return { status: 'low', color: 'text-red-600 bg-red-100' };
    if (Math.abs(localStock - channelStock) > 5) return { status: 'out_of_sync', color: 'text-yellow-600 bg-yellow-100' };
    return { status: 'in_sync', color: 'text-green-600 bg-green-100' };
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = searchTerm === '' ||
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.channel_sku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesChannel = filterChannel === 'all' ||
      item.channel_connection_id === filterChannel;

    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'enabled' && item.sync_enabled) ||
      (filterStatus === 'disabled' && !item.sync_enabled) ||
      (filterStatus === 'low_stock' && item.local_stock <= item.stock_threshold) ||
      (filterStatus === 'out_of_sync' && Math.abs(item.local_stock - item.channel_stock) > 5);

    return matchesSearch && matchesChannel && matchesStatus;
  });

  const lowStockCount = inventory.filter(item => item.local_stock <= item.stock_threshold).length;
  const outOfSyncCount = inventory.filter(item => Math.abs(item.local_stock - item.channel_stock) > 5).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" aria-hidden="true"></div>
        <span className="sr-only">Loading inventory...</span>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div data-testid="error-alert-inventory" className="p-4 bg-red-50 border border-red-200 rounded" role="alert" aria-live="assertive">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <div>
            <p className="font-medium text-red-800">{errorMessage}</p>
            <p className="text-sm text-red-700 mt-2">If the problem persists, contact support or try again later.</p>
            <div className="mt-3">
              <Button onClick={fetchData} aria-label="Retry loading inventory">Retry</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold">{inventory.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold">{lowStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <RefreshCw className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Out of Sync</p>
                <p className="text-2xl font-bold">{outOfSyncCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Synced</p>
                <p className="text-2xl font-bold">
                  {inventory.filter(item => item.sync_status === 'synced').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Synchronization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" aria-hidden="true" />
                <Input
                  aria-label="Search inventory"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterChannel} onValueChange={setFilterChannel}>
              <SelectTrigger aria-label="Filter by channel" className="w-full lg:w-48">
                <Filter className="w-4 h-4 mr-2" aria-hidden="true" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                {channels.map((channel) => (
                  <SelectItem key={channel.id} value={channel.id}>
                    {channel.channel_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="enabled">Sync Enabled</SelectItem>
                <SelectItem value="disabled">Sync Disabled</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="out_of_sync">Out of Sync</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                onClick={() => handleSyncInventory()}
                disabled={syncing === 'all'}
                className="whitespace-nowrap"
                aria-label="Sync all inventory"
              >
                {syncing === 'all' ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                )}
                {syncing === 'all' ? 'Syncing...' : 'Sync All'}
              </Button>
            </div>
          </div>

          {/* Inventory Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Local Stock</TableHead>
                <TableHead>Channel Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sync Status</TableHead>
                <TableHead>Auto Sync</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.map((item) => {
                const stockStatus = getStockStatus(item.local_stock, item.channel_stock, item.stock_threshold);
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.product_name}</div>
                        <div className="text-sm text-gray-500">
                          SKU: {item.product_sku} | Channel SKU: {item.channel_sku}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{item.channel_name}</TableCell>
                    <TableCell>
                      <span className={item.local_stock <= item.stock_threshold ? 'text-red-600 font-medium' : ''}>
                        {item.local_stock}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.channel_stock}
                        onChange={(e) => {
                          const newStock = parseInt(e.target.value) || 0;
                          handleUpdateStock(item.id, newStock);
                        }}
                        className="w-20"
                        min="0"
                      />
                    </TableCell>
                    <TableCell>
                      <Badge className={stockStatus.color}>
                        {stockStatus.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getSyncStatusColor(item.sync_status)}>
                        {item.sync_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={item.sync_enabled}
                        onCheckedChange={(checked) => handleToggleSync(item.id, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSyncInventory(item.id)}
                        disabled={syncing === item.id}
                        aria-label={`Sync inventory item ${item.id}`}
                      >
                        {syncing === item.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {filteredInventory.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No inventory items found</p>
              <p className="text-sm">Map products to channels to manage inventory</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}