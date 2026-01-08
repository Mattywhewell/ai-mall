/**
 * Product Mappings Management
 * Map local products to channel-specific listings
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Link, Unlink, Search, Filter } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
}

interface ChannelConnection {
  id: string;
  channel_name: string;
  channel_type: string;
}

interface ProductMapping {
  id: string;
  product_id: string;
  channel_connection_id: string;
  channel_product_id: string;
  channel_product_name: string;
  channel_sku: string;
  channel_price: number;
  is_active: boolean;
  last_sync: string;
  sync_status: 'synced' | 'pending' | 'error';
}

interface ProductMappingsProps {
  onUpdate: () => void;
}

export function ProductMappings({ onUpdate }: ProductMappingsProps) {
  const [mappings, setMappings] = useState<ProductMapping[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [channels, setChannels] = useState<ChannelConnection[]>([]);
  const [showMapDialog, setShowMapDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<ChannelConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChannel, setFilterChannel] = useState<string>('all');

  // Form state for new mapping
  const [mappingData, setMappingData] = useState({
    channel_product_id: '',
    channel_product_name: '',
    channel_sku: '',
    channel_price: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setErrorMessage(null);
    setLoading(true);

    try {
      const [mappingsRes, productsRes, channelsRes] = await Promise.all([
        fetch('/api/seller/product-mappings'),
        fetch('/api/seller/products'),
        fetch('/api/seller/channels?active=true')
      ]);

      if (!mappingsRes.ok || !productsRes.ok || !channelsRes.ok) {
        const text = await Promise.resolve((!mappingsRes.ok ? mappingsRes.text() : productsRes.ok ? channelsRes.text() : productsRes.text())).catch(() => '');
        throw new Error(`Server error: ${text}`);
      }

      const mappingsData = await mappingsRes.json();
      const productsData = await productsRes.json();
      const channelsData = await channelsRes.json();

      setMappings(mappingsData.mappings || []);
      setProducts(productsData.products || []);
      setChannels(channelsData.connections || []);
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      setErrorMessage('Failed to load product mappings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMapping = async () => {
    if (!selectedProduct || !selectedChannel) return;

    try {
      const response = await fetch('/api/seller/product-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          channel_connection_id: selectedChannel.id,
          ...mappingData
        })
      });

      if (response.ok) {
        setShowMapDialog(false);
        setMappingData({
          channel_product_id: '',
          channel_product_name: '',
          channel_sku: '',
          channel_price: ''
        });
        fetchData();
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to create mapping:', error);
    }
  };

  const handleDeleteMapping = async (mappingId: string) => {
    if (!confirm('Are you sure you want to remove this product mapping?')) return;

    try {
      await fetch(`/api/seller/product-mappings/${mappingId}`, {
        method: 'DELETE'
      });
      fetchData();
      onUpdate();
    } catch (error) {
      console.error('Failed to delete mapping:', error);
    }
  };

  const handleSyncMapping = async (mappingId: string) => {
    try {
      await fetch(`/api/seller/product-mappings/${mappingId}/sync`, {
        method: 'POST'
      });
      fetchData();
      onUpdate();
    } catch (error) {
      console.error('Failed to sync mapping:', error);
    }
  };

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const filteredMappings = mappings.filter(mapping => {
    const matchesSearch = searchTerm === '' ||
      mapping.channel_product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapping.channel_sku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesChannel = filterChannel === 'all' ||
      mapping.channel_connection_id === filterChannel;

    return matchesSearch && matchesChannel;
  });

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown Product';
  };

  const getChannelName = (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    return channel ? channel.channel_name : 'Unknown Channel';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" aria-hidden="true"></div>
        <span className="sr-only">Loading product mappings...</span>
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
              <Button onClick={fetchData} aria-label="Retry loading product mappings">Retry</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Product Mappings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  aria-label="Search mappings"
                  placeholder="Search mappings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterChannel} onValueChange={setFilterChannel}>
              <SelectTrigger aria-label="Filter by channel" className="w-full sm:w-48">
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
            <Dialog open={showMapDialog} onOpenChange={setShowMapDialog}>
              <DialogTrigger asChild>
                <Button aria-label="Map product">
                  <Plus className="w-4 h-4 mr-2" />
                  Map Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Map Product to Channel</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Select Product</Label>
                      <Select onValueChange={(value) => {
                        const product = products.find(p => p.id === value);
                        setSelectedProduct(product || null);
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose product..." />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} ({product.sku})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Select Channel</Label>
                      <Select onValueChange={(value) => {
                        const channel = channels.find(c => c.id === value);
                        setSelectedChannel(channel || null);
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose channel..." />
                        </SelectTrigger>
                        <SelectContent>
                          {channels.map((channel) => (
                            <SelectItem key={channel.id} value={channel.id}>
                              {channel.channel_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {selectedProduct && selectedChannel && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Channel Product ID</Label>
                          <Input
                            value={mappingData.channel_product_id}
                            onChange={(e) => setMappingData({...mappingData, channel_product_id: e.target.value})}
                            placeholder="e.g., 12345"
                          />
                        </div>

                        <div>
                          <Label>Channel SKU</Label>
                          <Input
                            value={mappingData.channel_sku}
                            onChange={(e) => setMappingData({...mappingData, channel_sku: e.target.value})}
                            placeholder="Channel-specific SKU"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Channel Product Name</Label>
                        <Input
                          value={mappingData.channel_product_name}
                          onChange={(e) => setMappingData({...mappingData, channel_product_name: e.target.value})}
                          placeholder="Product name on this channel"
                        />
                      </div>

                      <div>
                        <Label>Channel Price</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={mappingData.channel_price}
                          onChange={(e) => setMappingData({...mappingData, channel_price: e.target.value})}
                          placeholder="Price on this channel"
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowMapDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateMapping}>
                          Create Mapping
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Mappings Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Local Product</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Channel Product</TableHead>
                <TableHead>Channel SKU</TableHead>
                <TableHead>Channel Price</TableHead>
                <TableHead>Sync Status</TableHead>
                <TableHead>Last Sync</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMappings.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{getProductName(mapping.product_id)}</div>
                      <div className="text-sm text-gray-500">ID: {mapping.product_id}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getChannelName(mapping.channel_connection_id)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{mapping.channel_product_name}</div>
                      <div className="text-sm text-gray-500">ID: {mapping.channel_product_id}</div>
                    </div>
                  </TableCell>
                  <TableCell>{mapping.channel_sku}</TableCell>
                  <TableCell>${mapping.channel_price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className={getSyncStatusColor(mapping.sync_status)}>
                      {mapping.sync_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {mapping.last_sync ? new Date(mapping.last_sync).toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSyncMapping(mapping.id)}
                        aria-label={`Sync mapping for ${getProductName(mapping.product_id)}`}
                      >
                        Sync
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteMapping(mapping.id)}
                        aria-label={`Remove mapping for ${getProductName(mapping.product_id)}`}
                      >
                        <Unlink className="w-4 h-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredMappings.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Link className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No product mappings found</p>
              <p className="text-sm">Map your products to sales channels to start selling</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}