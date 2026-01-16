/**
 * Channel Connections Management
 * Add, configure, and manage sales channel integrations
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
import { Plus, Settings, Trash2, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface SupportedChannel {
  id: string;
  channel_type: string;
  channel_name: string;
  description: string;
  logo_url?: string;
  requires_oauth: boolean;
  is_implemented: boolean;
}

interface ChannelConnection {
  id: string;
  channel_type: string;
  channel_name: string;
  is_active: boolean;
  connection_status: 'connected' | 'disconnected' | 'error';
  store_url?: string;
  last_error_message?: string;
}

interface ChannelConnectionsProps {
  onUpdate: () => void;
}

export function ChannelConnections({ onUpdate }: ChannelConnectionsProps) {
  const [connections, setConnections] = useState<ChannelConnection[]>([]);
  const [supportedChannels, setSupportedChannels] = useState<SupportedChannel[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<SupportedChannel | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form state for new connection
  const [formData, setFormData] = useState({
    channel_name: '',
    store_url: '',
    api_key: '',
    api_secret: '',
    access_token: '',
    store_id: '',
    marketplace_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setErrorMessage(null);
    setLoading(true);

    try {
      const [connectionsRes, channelsRes] = await Promise.all([
        fetch('/api/seller/channels'),
        fetch('/api/seller/channels/supported')
      ]);

      if (!connectionsRes.ok || !channelsRes.ok) {
        const text = await Promise.resolve(connectionsRes.ok ? channelsRes.text() : connectionsRes.text()).catch(() => '');
        throw new Error(`Server error: ${text}`);
      }

      const connectionsData = await connectionsRes.json();
      const channelsData = await channelsRes.json();

      setConnections(connectionsData.connections || []);
      setSupportedChannels(channelsData.channels || []);
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      setErrorMessage('Failed to load channel data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddChannel = async () => {
    if (!selectedChannel) return;

    try {
      const response = await fetch('/api/seller/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_type: selectedChannel.channel_type,
          channel_name: formData.channel_name || selectedChannel.channel_name,
          ...formData
        })
      });

      if (response.ok) {
        setShowAddDialog(false);
        setFormData({
          channel_name: '',
          store_url: '',
          api_key: '',
          api_secret: '',
          access_token: '',
          store_id: '',
          marketplace_id: ''
        });
        fetchData();
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to add channel:', error);
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (!confirm('Are you sure you want to disconnect this channel?')) return;

    try {
      await fetch(`/api/seller/channels/${channelId}`, {
        method: 'DELETE'
      });
      fetchData();
      onUpdate();
    } catch (error) {
      console.error('Failed to delete channel:', error);
    }
  };

  const handleTestConnection = async (channelId: string) => {
    try {
      const response = await fetch(`/api/seller/channels/${channelId}/test`);
      const result = await response.json();

      if (result.success) {
        alert('Connection successful!');
      } else {
        alert(`Connection failed: ${result.error}`);
      }

      fetchData();
      onUpdate();
    } catch (error) {
      console.error('Failed to test connection:', error);
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
      <div className="flex items-center justify-center h-64" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" aria-hidden="true"></div>
        <span className="sr-only">Loading channels...</span>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div data-testid="error-alert-channels" className="p-4 bg-red-50 border border-red-200 rounded" role="alert" aria-live="assertive">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <div>
            <p className="font-medium text-red-800">{errorMessage}</p>
            <p className="text-sm text-red-700 mt-2">If the problem persists, contact support or try again later.</p>
            <div className="mt-3">
              <Button onClick={fetchData} aria-label="Retry loading channels">Retry</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connected Channels */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Connected Channels</CardTitle>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button aria-label="Add channel">
                <Plus className="w-4 h-4 mr-2" />
                Add Channel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Sales Channel</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Select Channel</Label>
                  <Select onValueChange={(value) => {
                    const channel = supportedChannels.find(c => c.id === value);
                    setSelectedChannel(channel || null);
                  }}>
                    <SelectTrigger aria-label="Select channel to add">
                      <SelectValue placeholder="Choose a platform..." />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedChannels
                        .filter(channel => channel.is_implemented)
                        .map((channel) => (
                        <SelectItem key={channel.id} value={channel.id}>
                          {channel.channel_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedChannel && (
                  <>
                    <div>
                      <Label>Channel Name</Label>
                      <Input
                        value={formData.channel_name}
                        onChange={(e) => setFormData({...formData, channel_name: e.target.value})}
                        placeholder={selectedChannel.channel_name}
                      />
                    </div>

                    <div>
                      <Label>Store URL</Label>
                      <Input
                        value={formData.store_url}
                        onChange={(e) => setFormData({...formData, store_url: e.target.value})}
                        placeholder="https://yourstore.com"
                      />
                    </div>

                    {selectedChannel.requires_oauth ? (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">This channel requires OAuth. Click to connect your store.</p>
                        <div className="flex gap-2">
                          <Input
                            placeholder="your-store.myshopify.com"
                            value={formData.store_url}
                            onChange={(e) => setFormData({...formData, store_url: e.target.value})}
                          />
                          <Button onClick={() => {
                            if (!formData.store_url) return alert('Enter your store domain (e.g., your-store.myshopify.com)');
                            const url = `/api/seller/channels/shopify/connect?shop=${encodeURIComponent(formData.store_url)}`;
                            window.open(url, '_blank');
                          }}>
                            Connect with {selectedChannel.channel_name}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>
                          <Label>API Key</Label>
                          <Input
                            type="password"
                            value={formData.api_key}
                            onChange={(e) => setFormData({...formData, api_key: e.target.value})}
                          />
                        </div>

                        <div>
                          <Label>API Secret</Label>
                          <Input
                            type="password"
                            value={formData.api_secret}
                            onChange={(e) => setFormData({...formData, api_secret: e.target.value})}
                          />
                        </div>
                      </>
                    )}

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddChannel}>
                        Add Channel
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connections.map((connection) => (
              <div key={connection.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {connection.channel_name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium">{connection.channel_name}</h3>
                      <p className="text-sm text-gray-500">{connection.channel_type}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(connection.connection_status)}>
                    {getStatusIcon(connection.connection_status)}
                    <span className="ml-1 capitalize">{connection.connection_status}</span>
                  </Badge>
                </div>

                {connection.store_url && (
                  <p className="text-sm text-gray-600 mb-3">{connection.store_url}</p>
                )}

                {connection.last_error_message && (
                  <div className="bg-red-50 border border-red-200 rounded p-2 mb-3">
                    <p className="text-sm text-red-700">{connection.last_error_message}</p>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestConnection(connection.id)}
                    aria-label={`Test connection for ${connection.channel_name}`}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Test
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteChannel(connection.id)}
                    aria-label={`Remove connection for ${connection.channel_name}`}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {connections.length === 0 && (
            <div className="text-center py-8 text-gray-500" role="status" aria-live="polite">
              <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" aria-hidden="true" />
              <p>No channels connected yet</p>
              <p className="text-sm">Add your first sales channel to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-2">Use the mock channel to demo the full flow without external credentials.</p>
          <div className="flex gap-2">
            <Button onClick={async () => {
              try {
                const res = await fetch('/api/seller/channels/mock/connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ store_name: 'Demo Mock Store' }) });
                const data = await res.json();
                if (res.ok) {
                  alert('Mock channel connected');
                  fetchData();
                  onUpdate();
                } else {
                  alert('Failed to connect mock channel: ' + (data.error || JSON.stringify(data)));
                }
              } catch (err) {
                console.error('Mock connect error', err);
                alert('Failed to connect mock channel');
              }
            }}>
              Connect Mock Channel
            </Button>
            <Button variant="outline" onClick={async () => {
              // Enqueue an orders sync job for demo
              try {
                const res = await fetch('/api/seller/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ job_type: 'orders_sync', payload: {} }) });
                const data = await res.json();
                if (res.ok) {
                  alert('Orders sync job enqueued');
                } else {
                  alert('Failed to enqueue job: ' + (data.error || JSON.stringify(data)));
                }
              } catch (err) {
                console.error('Enqueue job error', err);
                alert('Failed to enqueue job');
              }
            }}>
              Enqueue Demo Sync
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Available Channels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {supportedChannels
              .filter(channel => !channel.is_implemented)
              .map((channel) => (
              <div key={channel.id} className="border rounded-lg p-4 opacity-60">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {channel.channel_name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-medium">{channel.channel_name}</h3>
                </div>
                <p className="text-sm text-gray-500 mb-3">{channel.description}</p>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}