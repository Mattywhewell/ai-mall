/**
 * Order Synchronization Management
 * Download and manage orders from connected sales channels
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, RefreshCw, Eye, Search, Filter, Calendar } from 'lucide-react';

interface ChannelOrder {
  id: string;
  channel_connection_id: string;
  channel_order_id: string;
  order_date: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  currency: string;
  status: string;
  items_count: number;
  channel_name: string;
  sync_status: 'synced' | 'pending' | 'error';
  last_sync: string;
}

interface OrderSyncProps {
  onUpdate: () => void;
}

export function OrderSync({ onUpdate }: OrderSyncProps) {
  const [orders, setOrders] = useState<ChannelOrder[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setErrorMessage(null);
    setLoading(true);

    try {
      const [ordersRes, channelsRes] = await Promise.all([
        fetch('/api/seller/orders'),
        fetch('/api/seller/channels?active=true')
      ]);

      if (!ordersRes.ok || !channelsRes.ok) {
        const text = await Promise.resolve((!ordersRes.ok ? ordersRes.text() : channelsRes.text())).catch(() => '');
        throw new Error(`Server error: ${text}`);
      }

      const ordersData = await ordersRes.json();
      const channelsData = await channelsRes.json();

      setOrders(ordersData.orders || []);
      setChannels(channelsData.connections || []);
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      setErrorMessage('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncOrders = async (channelId?: string) => {
    setSyncing(channelId || 'all');

    try {
      const url = channelId
        ? `/api/seller/orders/sync?channel=${channelId}`
        : '/api/seller/orders/sync';

      const response = await fetch(url, {
        method: 'POST'
      });

      if (response.ok) {
        fetchData();
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to sync orders:', error);
    } finally {
      setSyncing(null);
    }
  };

  const handleViewOrder = (orderId: string) => {
    // Open order details modal or navigate to order page
    console.log('View order:', orderId);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'shipped':
        return 'text-green-600 bg-green-100';
      case 'pending':
      case 'processing':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
      case 'refunded':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' ||
      order.channel_order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesChannel = filterChannel === 'all' ||
      order.channel_connection_id === filterChannel;

    const matchesStatus = filterStatus === 'all' ||
      order.status.toLowerCase() === filterStatus.toLowerCase();

    const matchesDate = (!dateRange.start || new Date(order.order_date) >= new Date(dateRange.start)) &&
      (!dateRange.end || new Date(order.order_date) <= new Date(dateRange.end));

    return matchesSearch && matchesChannel && matchesStatus && matchesDate;
  });

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total_amount, 0);
  const totalOrders = filteredOrders.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" aria-hidden="true"></div>
        <span className="sr-only">Loading orders...</span>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded" role="alert" aria-live="assertive">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 text-red-600">!</div>
          <div>
            <p className="font-medium text-red-800">{errorMessage}</p>
            <p className="text-sm text-red-700 mt-2">If the problem persists, contact support or try again later.</p>
            <div className="mt-3">
              <Button onClick={fetchData} aria-label="Retry loading orders">Retry</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold">{totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <RefreshCw className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Channels</p>
                <p className="text-2xl font-bold">{channels.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Order Synchronization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" aria-hidden="true" />
                <Input
                  aria-label="Search orders"
                  placeholder="Search orders..."
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
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                onClick={() => handleSyncOrders()}
                disabled={syncing === 'all'}
                className="whitespace-nowrap"
                aria-label="Sync all orders"
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

          {/* Orders Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Sync Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.channel_order_id}</div>
                      <div className="text-sm text-gray-500">ID: {order.id}</div>
                    </div>
                  </TableCell>
                  <TableCell>{order.channel_name}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.customer_name}</div>
                      <div className="text-sm text-gray-500">{order.customer_email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(order.order_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.items_count}</TableCell>
                  <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className={getSyncStatusColor(order.sync_status)}>
                      {order.sync_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewOrder(order.id)}
                        aria-label={`View order ${order.channel_order_id}`}
                      >
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSyncOrders(order.channel_connection_id)}
                        disabled={syncing === order.channel_connection_id}
                        aria-label={`Sync orders for ${order.channel_name}`}
                      >
                        {syncing === order.channel_connection_id ? (
                          <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <RefreshCw className="w-4 h-4" aria-hidden="true" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Download className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No orders found</p>
              <p className="text-sm">Sync orders from your connected channels</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}