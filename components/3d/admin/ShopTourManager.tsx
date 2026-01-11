'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Link,
  Settings,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

interface ShopTour {
  id: string;
  name: string;
  description: string;
  matterportId: string;
  status: 'active' | 'processing' | 'failed' | 'draft';
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
  duration: number;
  views: number;
  engagement: number;
  hotspots: number;
  integration: {
    apiKey: string;
    webhookUrl?: string;
    autoSync: boolean;
  };
  settings: {
    autoplay: boolean;
    loop: boolean;
    quality: 'low' | 'medium' | 'high';
    controls: boolean;
  };
  analytics: {
    totalViews: number;
    avgWatchTime: number;
    completionRate: number;
    hotspotsClicked: number;
  };
}

const mockShopTours: ShopTour[] = [
  {
    id: '1',
    name: 'Memory Bazaar Virtual Tour',
    description: 'Complete 3D tour of our digital art marketplace',
    matterportId: 'abc123def456',
    status: 'active',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15',
    thumbnail: '/tours/memory-bazaar.jpg',
    duration: 180,
    views: 1250,
    engagement: 78,
    hotspots: 12,
    integration: {
      apiKey: 'mp_abc123def456',
      webhookUrl: 'https://api.ai-mall.com/webhooks/matterport',
      autoSync: true
    },
    settings: {
      autoplay: false,
      loop: false,
      quality: 'high',
      controls: true
    },
    analytics: {
      totalViews: 1250,
      avgWatchTime: 145,
      completionRate: 68,
      hotspotsClicked: 890
    }
  },
  {
    id: '2',
    name: 'Tech Hub Showcase',
    description: 'Interactive tour of cutting-edge technology products',
    matterportId: 'xyz789ghi012',
    status: 'processing',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-12',
    duration: 240,
    views: 0,
    engagement: 0,
    hotspots: 8,
    integration: {
      apiKey: 'mp_xyz789ghi012',
      autoSync: false
    },
    settings: {
      autoplay: true,
      loop: true,
      quality: 'medium',
      controls: true
    },
    analytics: {
      totalViews: 0,
      avgWatchTime: 0,
      completionRate: 0,
      hotspotsClicked: 0
    }
  }
];

export function ShopTourManager() {
  const [tours, setTours] = useState<ShopTour[]>(mockShopTours);
  const [selectedTour, setSelectedTour] = useState<ShopTour | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTour, setEditingTour] = useState<ShopTour | null>(null);

  const handleCreateTour = () => {
    const newTour: ShopTour = {
      id: Date.now().toString(),
      name: 'New Shop Tour',
      description: 'A new Matterport shop tour',
      matterportId: '',
      status: 'draft',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      duration: 0,
      views: 0,
      engagement: 0,
      hotspots: 0,
      integration: {
        apiKey: '',
        autoSync: false
      },
      settings: {
        autoplay: false,
        loop: false,
        quality: 'medium',
        controls: true
      },
      analytics: {
        totalViews: 0,
        avgWatchTime: 0,
        completionRate: 0,
        hotspotsClicked: 0
      }
    };
    setTours(prev => [newTour, ...prev]);
    setEditingTour(newTour);
    setIsCreating(true);
  };

  const handleEditTour = (tour: ShopTour) => {
    setEditingTour(tour);
    setIsCreating(false);
  };

  const handleSaveTour = (updatedTour: ShopTour) => {
    setTours(prev => prev.map(t => t.id === updatedTour.id ? updatedTour : t));
    setEditingTour(null);
  };

  const handleDeleteTour = (tourId: string) => {
    setTours(prev => prev.filter(t => t.id !== tourId));
    if (selectedTour?.id === tourId) {
      setSelectedTour(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'processing': return <RotateCcw className="w-4 h-4 animate-spin" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      case 'draft': return <Settings className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Shop Tour Management</h3>
          <p className="text-sm text-gray-600">Manage Matterport 3D shop tours and integrations</p>
        </div>
        <Button onClick={handleCreateTour} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Create Tour</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tour List */}
        <div className="lg:col-span-2 space-y-4">
          {tours.map((tour) => (
            <Card
              key={tour.id}
              className={`cursor-pointer transition-all ${
                selectedTour?.id === tour.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedTour(tour)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  {/* Thumbnail */}
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {tour.thumbnail ? (
                      <img
                        src={tour.thumbnail}
                        alt={tour.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Play className="w-8 h-8 text-gray-400" />
                    )}
                  </div>

                  {/* Tour Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {getStatusIcon(tour.status)}
                      <h4 className="font-medium truncate">{tour.name}</h4>
                      <Badge className={`text-xs ${getStatusColor(tour.status)}`}>
                        {tour.status}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {tour.description}
                    </p>

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{tour.duration}s duration</span>
                      <span>{tour.views} views</span>
                      <span>{tour.hotspots} hotspots</span>
                      <span>{tour.engagement}% engagement</span>
                    </div>

                    {tour.matterportId && (
                      <div className="flex items-center space-x-1 mt-1">
                        <Link className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{tour.matterportId}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Preview tour
                      }}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTour(tour);
                      }}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Sync with Matterport
                      }}
                    >
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTour(tour.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tour Details/Editor */}
        <div className="space-y-4">
          {editingTour ? (
            <TourEditor
              tour={editingTour}
              onSave={handleSaveTour}
              onCancel={() => setEditingTour(null)}
              isNew={isCreating}
            />
          ) : selectedTour ? (
            <TourDetails tour={selectedTour} />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Tour</h3>
                <p className="text-gray-600">
                  Choose a shop tour to view details and manage settings
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

interface TourDetailsProps {
  tour: ShopTour;
}

function TourDetails({ tour }: TourDetailsProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {getStatusIcon(tour.status)}
            <span>{tour.name}</span>
          </CardTitle>
          <CardDescription>{tour.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Matterport Integration */}
          <div>
            <h4 className="font-medium mb-2">Matterport Integration</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Matterport ID:</span>
                <span className="font-mono text-xs">{tour.matterportId}</span>
              </div>
              <div className="flex justify-between">
                <span>API Key:</span>
                <span className="font-mono text-xs">{tour.integration.apiKey}</span>
              </div>
              <div className="flex justify-between">
                <span>Auto Sync:</span>
                <Badge variant={tour.integration.autoSync ? "default" : "secondary"}>
                  {tour.integration.autoSync ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Analytics */}
          <div>
            <h4 className="font-medium mb-2">Analytics</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Views:</span>
                <div className="font-medium">{tour.analytics.totalViews.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-gray-600">Avg Watch Time:</span>
                <div className="font-medium">{Math.round(tour.analytics.avgWatchTime)}s</div>
              </div>
              <div>
                <span className="text-gray-600">Completion Rate:</span>
                <div className="font-medium">{tour.analytics.completionRate}%</div>
                <Progress value={tour.analytics.completionRate} className="mt-1" />
              </div>
              <div>
                <span className="text-gray-600">Hotspots Clicked:</span>
                <div className="font-medium">{tour.analytics.hotspotsClicked}</div>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div>
            <h4 className="font-medium mb-2">Settings</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Autoplay:</span>
                <Badge variant={tour.settings.autoplay ? "default" : "secondary"}>
                  {tour.settings.autoplay ? "On" : "Off"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Loop:</span>
                <Badge variant={tour.settings.loop ? "default" : "secondary"}>
                  {tour.settings.loop ? "On" : "Off"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Quality:</span>
                <Badge variant="outline">{tour.settings.quality}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Controls:</span>
                <Badge variant={tour.settings.controls ? "default" : "secondary"}>
                  {tour.settings.controls ? "Visible" : "Hidden"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2 pt-4">
            <Button className="flex-1">
              <Play className="w-4 h-4 mr-2" />
              Preview Tour
            </Button>
            <Button variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in Matterport
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface TourEditorProps {
  tour: ShopTour;
  onSave: (tour: ShopTour) => void;
  onCancel: () => void;
  isNew: boolean;
}

function TourEditor({ tour, onSave, onCancel, isNew }: TourEditorProps) {
  const [editedTour, setEditedTour] = useState<ShopTour>(tour);

  const handleSave = () => {
    onSave({
      ...editedTour,
      updatedAt: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isNew ? 'Create Shop Tour' : 'Edit Shop Tour'}</CardTitle>
        <CardDescription>
          Configure Matterport tour settings and integration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="name">Tour Name</Label>
          <Input
            id="name"
            value={editedTour.name}
            onChange={(e) => setEditedTour(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={editedTour.description}
            onChange={(e) => setEditedTour(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="matterportId">Matterport ID</Label>
          <Input
            id="matterportId"
            value={editedTour.matterportId}
            onChange={(e) => setEditedTour(prev => ({ ...prev, matterportId: e.target.value }))}
            placeholder="e.g., abc123def456"
          />
        </div>

        <div>
          <Label htmlFor="apiKey">API Key</Label>
          <Input
            id="apiKey"
            value={editedTour.integration.apiKey}
            onChange={(e) => setEditedTour(prev => ({
              ...prev,
              integration: { ...prev.integration, apiKey: e.target.value }
            }))}
            placeholder="Matterport API key"
          />
        </div>

        <div>
          <Label htmlFor="webhookUrl">Webhook URL (Optional)</Label>
          <Input
            id="webhookUrl"
            value={editedTour.integration.webhookUrl || ''}
            onChange={(e) => setEditedTour(prev => ({
              ...prev,
              integration: { ...prev.integration, webhookUrl: e.target.value }
            }))}
            placeholder="https://your-app.com/webhooks/matterport"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="autoSync"
            checked={editedTour.integration.autoSync}
            onChange={(e) => setEditedTour(prev => ({
              ...prev,
              integration: { ...prev.integration, autoSync: e.target.checked }
            }))}
          />
          <Label htmlFor="autoSync">Enable auto-sync with Matterport</Label>
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={editedTour.status}
            onChange={(e) => setEditedTour(prev => ({ ...prev, status: e.target.value as ShopTour['status'] }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="draft">Draft</option>
            <option value="processing">Processing</option>
            <option value="active">Active</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="flex space-x-2 pt-4">
          <Button onClick={handleSave} className="flex-1">
            Save Tour
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}