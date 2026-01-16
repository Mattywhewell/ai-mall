/**
 * Price Synchronization Management
 * Control pricing across connected sales channels
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
import { DollarSign, RefreshCw, TrendingUp, TrendingDown, Search, Filter, Percent } from 'lucide-react';

interface PriceItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  base_price: number;
  channel_connection_id: string;
  channel_name: string;
  channel_price: number;
  channel_currency: string;
  markup_percentage: number;
  sync_enabled: boolean;
  last_sync: string;
  sync_status: 'synced' | 'pending' | 'error';
  price_rule: 'fixed' | 'markup' | 'margin';
}

interface PriceSyncProps {
  onUpdate: () => void;
}

export function PriceSync({ onUpdate }: PriceSyncProps) {
  const [prices, setPrices] = useState<PriceItem[]>([]);
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

    try {
      const [pricesRes, channelsRes] = await Promise.all([
        fetch('/api/seller/prices'),
        fetch('/api/seller/channels?active=true')
      ]);

      if (!pricesRes.ok || !channelsRes.ok) {
        const text = await Promise.resolve((!pricesRes.ok ? pricesRes.text() : channelsRes.text())).catch(() => '');
        throw new Error(`Server error: ${text}`);
      }

      const pricesData = await pricesRes.json();
      const channelsData = await channelsRes.json();

      setPrices(pricesData.prices || []);
      setChannels(channelsData.connections || []);
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      setErrorMessage('Failed to load prices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSync = async (priceId: string, enabled: boolean) => {
    try {
      await fetch(`/api/seller/prices/${priceId}`, {
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

  const handleSyncPrices = async (priceId?: string) => {
    setSyncing(priceId || 'all');

    try {
      const url = priceId
        ? `/api/seller/prices/${priceId}/sync`
        : '/api/seller/prices/sync';

      const response = await fetch(url, {
        method: 'POST'
      });

      if (response.ok) {
        fetchData();
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to sync prices:', error);
    } finally {
      setSyncing(null);
    }
  };

  const handleUpdatePrice = async (priceId: string, newPrice: number) => {
    try {
      await fetch(`/api/seller/prices/${priceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_price: newPrice })
      });
      fetchData();
      onUpdate();
    } catch (error) {
      console.error('Failed to update price:', error);
    }
  };

  const handleUpdateMarkup = async (priceId: string, newMarkup: number) => {
    try {
      await fetch(`/api/seller/prices/${priceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markup_percentage: newMarkup })
      });
      fetchData();
      onUpdate();
    } catch (error) {
      console.error('Failed to update markup:', error);
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const getPriceDifference = (basePrice: number, channelPrice: number) => {
    const diff = ((channelPrice - basePrice) / basePrice) * 100;
    return {
      percentage: diff,
      isIncrease: diff > 0,
      color: diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-600'
    };
  };

  const filteredPrices = prices.filter(item => {
    const matchesSearch = searchTerm === '' ||
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.product_sku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesChannel = filterChannel === 'all' ||
      item.channel_connection_id === filterChannel;

    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'enabled' && item.sync_enabled) ||
      (filterStatus === 'disabled' && !item.sync_enabled) ||
      (filterStatus === 'out_of_sync' && item.sync_status !== 'synced');

    return matchesSearch && matchesChannel && matchesStatus;
  });

  const totalProducts = prices.length;
  const syncedProducts = prices.filter(item => item.sync_status === 'synced').length;
  const avgMarkup = prices.reduce((sum, item) => sum + item.markup_percentage, 0) / prices.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" aria-hidden="true"></div>
        <span className="sr-only">Loading prices...</span>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div data-testid="error-alert-prices" className="p-4 bg-red-50 border border-red-200 rounded" role="alert" aria-live="assertive">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 text-red-600">!</div>
          <div>
            <p className="font-medium text-red-800">{errorMessage}</p>
            <p className="text-sm text-red-700 mt-2">If the problem persists, contact support or try again later.</p>
            <div className="mt-3">
              <Button onClick={fetchData} aria-label="Retry loading prices">Retry</Button>
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
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold">{totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Synced Prices</p>
                <p className="text-2xl font-bold">{syncedProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Percent className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Markup</p>
                <p className="text-2xl font-bold">{avgMarkup.toFixed(1)}%</p>
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
                <p className="text-sm font-medium text-gray-600">Pending Sync</p>
                <p className="text-2xl font-bold">
                  {prices.filter(item => item.sync_status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Price Synchronization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" aria-hidden="true" />
                <Input
                  aria-label="Search prices"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterChannel} onValueChange={setFilterChannel}>
              <SelectTrigger className="w-full lg:w-48">
                <Filter className="w-4 h-4 mr-2" />
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
                <SelectItem value="out_of_sync">Out of Sync</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                onClick={() => handleSyncPrices()}
                disabled={syncing === 'all'}
                className="whitespace-nowrap"
                aria-label="Sync all prices"
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

          {/* Prices Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Base Price</TableHead>
                <TableHead>Channel Price</TableHead>
                <TableHead>Markup</TableHead>
                <TableHead>Difference</TableHead>
                <TableHead>Sync Status</TableHead>
                <TableHead>Auto Sync</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrices.map((item) => {
                const priceDiff = getPriceDifference(item.base_price, item.channel_price);
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.product_name}</div>
                        <div className="text-sm text-gray-500">SKU: {item.product_sku}</div>
                      </div>
                    </TableCell>
                    <TableCell>{item.channel_name}</TableCell>
                    <TableCell>${item.base_price.toFixed(2)}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.channel_price}
                        onChange={(e) => {
                          const newPrice = parseFloat(e.target.value) || 0;
                          handleUpdatePrice(item.id, newPrice);
                        }}
                        className="w-24"
                        min="0"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          step="0.1"
                          value={item.markup_percentage}
                          onChange={(e) => {
                            const newMarkup = parseFloat(e.target.value) || 0;
                            handleUpdateMarkup(item.id, newMarkup);
                          }}
                          className="w-20"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center ${priceDiff.color}`}>
                        {priceDiff.isIncrease ? (
                          <TrendingUp className="w-4 h-4 mr-1" />
                        ) : (
                          <TrendingDown className="w-4 h-4 mr-1" />
                        )}
                        {Math.abs(priceDiff.percentage).toFixed(1)}%
                      </div>
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
                        onClick={() => handleSyncPrices(item.id)}
                        disabled={syncing === item.id}
                        aria-label={`Sync price ${item.id}`}
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

          {filteredPrices.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No price items found</p>
              <p className="text-sm">Map products to channels to manage pricing</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}