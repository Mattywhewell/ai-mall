'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  Map,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  Activity,
  TrendingUp,
  Globe,
  Navigation,
  Zap,
  Heart,
  MessageCircle,
  Star,
  Box,
  Move,
  RotateCw,
  Scale,
  Save,
  Upload,
  RefreshCw,
  Building,
  Route,
  Castle
} from 'lucide-react';

interface District {
  id: string;
  name: string;
  description: string;
  theme: string;
  status: 'active' | 'maintenance' | 'inactive';
  position: { x: number; y: number; z: number };
  bounds: { width: number; height: number; depth: number };
  citizens: number;
  shops: number;
  activity: number;
  settings: {
    lighting: 'day' | 'night' | 'dynamic';
    weather: 'clear' | 'rain' | 'snow' | 'fog';
    music: boolean;
    interactions: boolean;
  };
}

interface Citizen {
  id: string;
  name: string;
  avatar: string;
  district: string;
  status: 'online' | 'away' | 'offline';
  position: { x: number; y: number; z: number };
  activity: string;
  lastSeen: string;
  interactions: number;
  reputation: number;
  badges: string[];
}

interface PlacedModel {
  id: string;
  assetId: string;
  assetName: string;
  districtId: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  placedAt: string;
  placedBy: string;
}

interface Shopfront {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName: string;
  districtId: string;
  position: { x: number; y: number; z: number };
  bounds: { width: number; height: number; depth: number };
  status: 'active' | 'vacant' | 'maintenance' | 'closed';
  theme: string;
  products: number;
  revenue: number;
  visitors: number;
  rating: number;
  createdAt: string;
  settings: {
    lighting: boolean;
    music: boolean;
    interactions: boolean;
    autoRestock: boolean;
  };
}

interface Street {
  id: string;
  name: string;
  description: string;
  districtId: string;
  startPosition: { x: number; y: number; z: number };
  endPosition: { x: number; y: number; z: number };
  width: number;
  type: 'main' | 'side' | 'alley' | 'boulevard';
  status: 'active' | 'construction' | 'maintenance';
  traffic: number;
  shops: number;
  lighting: boolean;
  createdAt: string;
}

interface Hall {
  id: string;
  name: string;
  description: string;
  districtId: string;
  position: { x: number; y: number; z: number };
  bounds: { width: number; height: number; depth: number };
  type: 'market' | 'gallery' | 'theater' | 'community' | 'exhibition';
  capacity: number;
  status: 'active' | 'maintenance' | 'closed';
  events: number;
  visitors: number;
  rating: number;
  createdAt: string;
  settings: {
    lighting: 'day' | 'night' | 'dynamic';
    sound: boolean;
    climate: boolean;
    security: boolean;
  };
}

interface SpatialInteraction {
  id: string;
  type: 'chat' | 'trade' | 'collaboration' | 'event';
  participants: string[];
  location: { x: number; y: number; z: number };
  timestamp: string;
  duration: number;
  outcome: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

const mockDistricts: District[] = [
  {
    id: '1',
    name: 'Wonder District',
    description: 'Exploration and discovery zone',
    theme: 'adventure',
    status: 'active',
    position: { x: 0, y: 0, z: 0 },
    bounds: { width: 100, height: 50, depth: 100 },
    citizens: 45,
    shops: 12,
    activity: 78,
    settings: {
      lighting: 'dynamic',
      weather: 'clear',
      music: true,
      interactions: true
    }
  },
  {
    id: '2',
    name: 'Creative Commons',
    description: 'Art and collaboration space',
    theme: 'artistic',
    status: 'active',
    position: { x: 150, y: 0, z: 0 },
    bounds: { width: 80, height: 40, depth: 80 },
    citizens: 32,
    shops: 8,
    activity: 65,
    settings: {
      lighting: 'day',
      weather: 'clear',
      music: true,
      interactions: true
    }
  },
  {
    id: '3',
    name: 'Tech Hub',
    description: 'Innovation and technology district',
    theme: 'futuristic',
    status: 'maintenance',
    position: { x: -150, y: 0, z: 0 },
    bounds: { width: 120, height: 60, depth: 120 },
    citizens: 0,
    shops: 0,
    activity: 0,
    settings: {
      lighting: 'night',
      weather: 'fog',
      music: false,
      interactions: false
    }
  }
];

const mockCitizens: Citizen[] = [
  {
    id: '1',
    name: 'Alex Chen',
    avatar: '/avatars/alex.jpg',
    district: 'Wonder District',
    status: 'online',
    position: { x: 25, y: 0, z: 30 },
    activity: 'Exploring shops',
    lastSeen: 'now',
    interactions: 156,
    reputation: 89,
    badges: ['Explorer', 'Trader', 'Helper']
  },
  {
    id: '2',
    name: 'Maya Patel',
    avatar: '/avatars/maya.jpg',
    district: 'Creative Commons',
    status: 'online',
    position: { x: 175, y: 0, z: 15 },
    activity: 'Creating art',
    lastSeen: 'now',
    interactions: 203,
    reputation: 95,
    badges: ['Artist', 'Collaborator', 'Mentor']
  },
  {
    id: '3',
    name: 'Jordan Kim',
    avatar: '/avatars/jordan.jpg',
    district: 'Wonder District',
    status: 'away',
    position: { x: 10, y: 0, z: 50 },
    activity: 'Taking a break',
    lastSeen: '5 min ago',
    interactions: 89,
    reputation: 76,
    badges: ['Newcomer', 'Curious']
  }
];

const mockInteractions: SpatialInteraction[] = [
  {
    id: '1',
    type: 'trade',
    participants: ['Alex Chen', 'Maya Patel'],
    location: { x: 25, y: 0, z: 30 },
    timestamp: '2024-01-15T10:30:00Z',
    duration: 15,
    outcome: 'Successful art trade',
    sentiment: 'positive'
  },
  {
    id: '2',
    type: 'chat',
    participants: ['Alex Chen', 'Jordan Kim'],
    location: { x: 10, y: 0, z: 50 },
    timestamp: '2024-01-15T10:15:00Z',
    duration: 8,
    outcome: 'Shared exploration tips',
    sentiment: 'positive'
  },
  {
    id: '3',
    type: 'collaboration',
    participants: ['Maya Patel', 'Alex Chen', 'Jordan Kim'],
    location: { x: 175, y: 0, z: 15 },
    timestamp: '2024-01-15T09:45:00Z',
    duration: 45,
    outcome: 'Created group artwork',
    sentiment: 'positive'
  }
];

const mockPlacedModels: PlacedModel[] = [
  {
    id: '1',
    assetId: '1',
    assetName: 'Modern Chair',
    districtId: '1',
    position: { x: 25, y: 0, z: 30 },
    rotation: { x: 0, y: 45, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    placedAt: '2024-01-15T09:00:00Z',
    placedBy: 'Admin User'
  },
  {
    id: '2',
    assetId: '2',
    assetName: 'Wood Texture',
    districtId: '2',
    position: { x: 175, y: 0, z: 15 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 2, y: 1, z: 2 },
    placedAt: '2024-01-14T16:30:00Z',
    placedBy: 'Admin User'
  }
];

const mockAvailableAssets = [
  { id: '1', name: 'Modern Chair', type: 'model', thumbnail: '/thumbnails/chair.jpg' },
  { id: '2', name: 'Wood Texture', type: 'texture', thumbnail: '/thumbnails/wood.jpg' },
  { id: '3', name: 'City Plaza Scene', type: 'scene', thumbnail: '/scenes/plaza.jpg' },
  { id: '4', name: 'Decorative Lamp', type: 'model', thumbnail: '/thumbnails/lamp.jpg' },
  { id: '5', name: 'Stone Fountain', type: 'model', thumbnail: '/thumbnails/fountain.jpg' }
];

const mockShopfronts: Shopfront[] = [
  {
    id: '1',
    name: 'Artisan Crafts',
    description: 'Handmade crafts and unique art pieces',
    ownerId: 'user_1',
    ownerName: 'Maya Patel',
    districtId: '2',
    position: { x: 175, y: 0, z: 10 },
    bounds: { width: 8, height: 6, depth: 6 },
    status: 'active',
    theme: 'artistic',
    products: 45,
    revenue: 1250.50,
    visitors: 89,
    rating: 4.8,
    createdAt: '2024-01-10T08:00:00Z',
    settings: {
      lighting: true,
      music: true,
      interactions: true,
      autoRestock: true
    }
  },
  {
    id: '2',
    name: 'Tech Gadgets',
    description: 'Latest technology and innovative gadgets',
    ownerId: 'user_2',
    ownerName: 'Jordan Kim',
    districtId: '1',
    position: { x: 15, y: 0, z: 25 },
    bounds: { width: 10, height: 8, depth: 8 },
    status: 'active',
    theme: 'futuristic',
    products: 67,
    revenue: 2100.75,
    visitors: 156,
    rating: 4.6,
    createdAt: '2024-01-08T14:30:00Z',
    settings: {
      lighting: true,
      music: false,
      interactions: true,
      autoRestock: true
    }
  },
  {
    id: '3',
    name: 'Vacant Space',
    description: 'Available for new business',
    ownerId: '',
    ownerName: '',
    districtId: '1',
    position: { x: -20, y: 0, z: 40 },
    bounds: { width: 12, height: 10, depth: 10 },
    status: 'vacant',
    theme: 'neutral',
    products: 0,
    revenue: 0,
    visitors: 0,
    rating: 0,
    createdAt: '2024-01-05T10:00:00Z',
    settings: {
      lighting: false,
      music: false,
      interactions: false,
      autoRestock: false
    }
  }
];

const mockStreets: Street[] = [
  {
    id: '1',
    name: 'Main Boulevard',
    description: 'Primary thoroughfare connecting districts',
    districtId: '1',
    startPosition: { x: -50, y: 0, z: 0 },
    endPosition: { x: 50, y: 0, z: 0 },
    width: 12,
    type: 'main',
    status: 'active',
    traffic: 78,
    shops: 15,
    lighting: true,
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Artisan Alley',
    description: 'Cozy side street for boutique shops',
    districtId: '2',
    startPosition: { x: 150, y: 0, z: -20 },
    endPosition: { x: 200, y: 0, z: -20 },
    width: 6,
    type: 'alley',
    status: 'active',
    traffic: 45,
    shops: 8,
    lighting: true,
    createdAt: '2024-01-03T12:00:00Z'
  },
  {
    id: '3',
    name: 'Innovation Avenue',
    description: 'Tech-focused street under construction',
    districtId: '3',
    startPosition: { x: -180, y: 0, z: 10 },
    endPosition: { x: -120, y: 0, z: 10 },
    width: 8,
    type: 'boulevard',
    status: 'construction',
    traffic: 0,
    shops: 0,
    lighting: false,
    createdAt: '2024-01-12T09:00:00Z'
  }
];

const mockHalls: Hall[] = [
  {
    id: '1',
    name: 'Grand Market Hall',
    description: 'Central marketplace for all districts',
    districtId: '1',
    position: { x: 0, y: 0, z: 0 },
    bounds: { width: 40, height: 20, depth: 40 },
    type: 'market',
    capacity: 500,
    status: 'active',
    events: 12,
    visitors: 1200,
    rating: 4.7,
    createdAt: '2024-01-01T00:00:00Z',
    settings: {
      lighting: 'dynamic',
      sound: true,
      climate: true,
      security: true
    }
  },
  {
    id: '2',
    name: 'Creative Gallery',
    description: 'Exhibition space for digital art',
    districtId: '2',
    position: { x: 175, y: 0, z: 0 },
    bounds: { width: 25, height: 15, depth: 25 },
    type: 'gallery',
    capacity: 150,
    status: 'active',
    events: 8,
    visitors: 450,
    rating: 4.9,
    createdAt: '2024-01-05T16:00:00Z',
    settings: {
      lighting: 'day',
      sound: false,
      climate: true,
      security: true
    }
  },
  {
    id: '3',
    name: 'Community Theater',
    description: 'Performance venue under maintenance',
    districtId: '1',
    position: { x: 30, y: 0, z: -30 },
    bounds: { width: 30, height: 18, depth: 35 },
    type: 'theater',
    capacity: 200,
    status: 'maintenance',
    events: 0,
    visitors: 0,
    rating: 4.2,
    createdAt: '2024-01-07T11:00:00Z',
    settings: {
      lighting: 'dynamic',
      sound: true,
      climate: true,
      security: true
    }
  }
];

function getStatusColor(status: string) {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'maintenance':
      return 'bg-yellow-100 text-yellow-800';
    case 'vacant':
      return 'bg-gray-100 text-gray-800';
    case 'closed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function SpatialCommonsAdmin() {
  const [districts, setDistricts] = useState<District[]>(mockDistricts);
  const [citizens, setCitizens] = useState<Citizen[]>(mockCitizens);
  const [interactions, setInteractions] = useState<SpatialInteraction[]>(mockInteractions);
  const [placedModels, setPlacedModels] = useState<PlacedModel[]>(mockPlacedModels);
  const [shopfronts, setShopfronts] = useState<Shopfront[]>(mockShopfronts);
  const [streets, setStreets] = useState<Street[]>(mockStreets);
  const [halls, setHalls] = useState<Hall[]>(mockHalls);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [placementMode, setPlacementMode] = useState(false);
  const [editingModel, setEditingModel] = useState<PlacedModel | null>(null);
  const [replacingModel, setReplacingModel] = useState<PlacedModel | null>(null);
  const [movingModel, setMovingModel] = useState<PlacedModel | null>(null);
  const [showShopfrontForm, setShowShopfrontForm] = useState(false);
  const [editingShopfront, setEditingShopfront] = useState<Shopfront | null>(null);
  const [movingShopfront, setMovingShopfront] = useState<Shopfront | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'online': return 'bg-green-100 text-green-800';
      case 'away': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'chat': return <MessageCircle className="w-4 h-4" />;
      case 'trade': return <Zap className="w-4 h-4" />;
      case 'collaboration': return <Users className="w-4 h-4" />;
      case 'event': return <Star className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'neutral': return 'text-gray-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Shopfront management handlers
  const handleEditShopfront = (shopfront: Shopfront) => {
    setEditingShopfront(shopfront);
    setShowShopfrontForm(true);
  };

  const handleMoveShopfront = (shopfront: Shopfront) => {
    setMovingShopfront(shopfront);
  };

  const handleDeleteShopfront = (shopfrontId: string) => {
    setShopfronts(shopfronts.filter(s => s.id !== shopfrontId));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Spatial Commons Administration</h3>
          <p className="text-sm text-gray-600">Manage districts, citizens, and spatial interactions</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Globe className="w-4 h-4 mr-2" />
            View Commons
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add District
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Map className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{districts.length}</p>
                <p className="text-sm text-gray-600">Active Districts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{shopfronts.filter(s => s.status === 'active').length}</p>
                <p className="text-sm text-gray-600">Active Shopfronts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Route className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{streets.filter(s => s.status === 'active').length}</p>
                <p className="text-sm text-gray-600">Active Streets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Castle className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{halls.filter(h => h.status === 'active').length}</p>
                <p className="text-sm text-gray-600">Active Halls</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="districts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="districts">Districts</TabsTrigger>
          <TabsTrigger value="shopfronts">Shopfronts</TabsTrigger>
          <TabsTrigger value="streets">Streets</TabsTrigger>
          <TabsTrigger value="halls">Halls</TabsTrigger>
          <TabsTrigger value="citizens">Citizens</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="models">Model Placement</TabsTrigger>
        </TabsList>

        <TabsContent value="districts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Districts List */}
            <div className="space-y-4">
              {districts.map((district) => (
                <Card
                  key={district.id}
                  className={`cursor-pointer transition-all ${
                    selectedDistrict?.id === district.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedDistrict(district)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Map className="w-4 h-4" />
                          <h4 className="font-medium">{district.name}</h4>
                          <Badge className={`text-xs ${getStatusColor(district.status)}`}>
                            {district.status}
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-600 mb-2">{district.description}</p>

                        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 mb-2">
                          <div>
                            <span>Citizens: {district.citizens}</span>
                          </div>
                          <div>
                            <span>Shops: {district.shops}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">Activity:</span>
                          <Progress value={district.activity} className="flex-1 h-2" />
                          <span className="text-xs font-medium">{district.activity}%</span>
                        </div>
                      </div>

                      <div className="flex space-x-1 ml-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* District Details */}
            <div>
              {selectedDistrict ? (
                <DistrictDetails district={selectedDistrict} />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Map className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a District</h3>
                    <p className="text-gray-600">
                      Choose a district to view details and manage settings
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="shopfronts" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Shopfront Management</h3>
              <p className="text-sm text-gray-600">Manage commercial spaces and business locations</p>
            </div>
            <Button onClick={() => setShowShopfrontForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Shopfront
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shopfronts.map((shopfront) => (
              <Card key={shopfront.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Building className="w-5 h-5 text-blue-600" />
                      <h4 className="font-medium">{shopfront.name}</h4>
                    </div>
                    <Badge className={`text-xs ${getStatusColor(shopfront.status)}`}>
                      {shopfront.status}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{shopfront.description}</p>

                  {shopfront.ownerName && (
                    <p className="text-sm text-gray-500 mb-2">
                      Owner: {shopfront.ownerName}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                    <div>Products: {shopfront.products}</div>
                    <div>Visitors: {shopfront.visitors}</div>
                    <div>Revenue: ${shopfront.revenue.toFixed(2)}</div>
                    <div>Rating: {shopfront.rating.toFixed(1)}⭐</div>
                  </div>

                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleEditShopfront(shopfront)}>
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleMoveShopfront(shopfront)}>
                      <Move className="w-3 h-3 mr-1" />
                      Move
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteShopfront(shopfront.id)}>
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="streets" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Street Management</h3>
              <p className="text-sm text-gray-600">Manage pathways and thoroughfares</p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Street
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {streets.map((street) => (
              <Card key={street.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Route className="w-5 h-5 text-green-600" />
                      <h4 className="font-medium">{street.name}</h4>
                    </div>
                    <Badge className={`text-xs ${getStatusColor(street.status)}`}>
                      {street.status}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{street.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                    <div>Type: {street.type}</div>
                    <div>Width: {street.width}m</div>
                    <div>Traffic: {street.traffic}%</div>
                    <div>Shops: {street.shops}</div>
                  </div>

                  <div className="text-xs text-gray-500 mb-3">
                    From ({street.startPosition.x}, {street.startPosition.z}) to ({street.endPosition.x}, {street.endPosition.z})
                  </div>

                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Move className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="halls" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Hall Management</h3>
              <p className="text-sm text-gray-600">Manage public venues and gathering spaces</p>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Hall
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {halls.map((hall) => (
              <Card key={hall.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Castle className="w-5 h-5 text-purple-600" />
                      <h4 className="font-medium">{hall.name}</h4>
                    </div>
                    <Badge className={`text-xs ${getStatusColor(hall.status)}`}>
                      {hall.status}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{hall.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                    <div>Type: {hall.type}</div>
                    <div>Capacity: {hall.capacity}</div>
                    <div>Events: {hall.events}</div>
                    <div>Visitors: {hall.visitors}</div>
                  </div>

                  <div className="text-xs text-gray-500 mb-3">
                    Position: ({hall.position.x}, {hall.position.y}, {hall.position.z})
                    <br />
                    Bounds: {hall.bounds.width}×{hall.bounds.height}×{hall.bounds.depth}
                  </div>

                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Move className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="citizens" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Citizens List */}
            <div className="space-y-4">
              {citizens.map((citizen) => (
                <Card
                  key={citizen.id}
                  className={`cursor-pointer transition-all ${
                    selectedCitizen?.id === citizen.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedCitizen(citizen)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {citizen.avatar ? (
                          <img
                            src={citizen.avatar}
                            alt={citizen.name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <Users className="w-6 h-6 text-gray-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium truncate">{citizen.name}</h4>
                          <Badge className={`text-xs ${getStatusColor(citizen.status)}`}>
                            {citizen.status}
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-600 mb-1">{citizen.district}</p>
                        <p className="text-sm text-gray-500 mb-2">{citizen.activity}</p>

                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Interactions: {citizen.interactions}</span>
                          <span>Reputation: {citizen.reputation}</span>
                        </div>

                        <div className="flex flex-wrap gap-1 mt-2">
                          {citizen.badges.slice(0, 3).map((badge) => (
                            <Badge key={badge} variant="outline" className="text-xs">
                              {badge}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Citizen Details */}
            <div>
              {selectedCitizen ? (
                <CitizenDetails citizen={selectedCitizen} />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Citizen</h3>
                    <p className="text-gray-600">
                      Choose a citizen to view their profile and activity
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="interactions" className="space-y-4">
          <div className="space-y-4">
            {interactions.map((interaction) => (
              <Card key={interaction.id}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getInteractionIcon(interaction.type)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium capitalize">{interaction.type}</h4>
                        <Badge className={`text-xs ${getSentimentColor(interaction.sentiment)}`}>
                          {interaction.sentiment}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600 mb-2">{interaction.outcome}</p>

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Participants: {interaction.participants.join(', ')}</span>
                        <span>Duration: {interaction.duration}min</span>
                        <span>{new Date(interaction.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Model Placement Controls */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Box className="w-5 h-5" />
                    <span>Model Placement</span>
                  </CardTitle>
                  <CardDescription>
                    Place 3D models in districts to enhance the spatial commons
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* District Selection */}
                  <div>
                    <Label htmlFor="district-select">Select District</Label>
                    <select
                      id="district-select"
                      className="w-full mt-1 p-2 border rounded-md"
                      value={selectedDistrict?.id || ''}
                      onChange={(e) => {
                        const district = districts.find(d => d.id === e.target.value);
                        setSelectedDistrict(district || null);
                      }}
                    >
                      <option value="">Choose a district...</option>
                      {districts.map((district) => (
                        <option key={district.id} value={district.id}>
                          {district.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Asset Selection */}
                  <div>
                    <Label htmlFor="asset-select">Select Asset</Label>
                    <select
                      id="asset-select"
                      className="w-full mt-1 p-2 border rounded-md"
                      value={selectedAsset}
                      onChange={(e) => setSelectedAsset(e.target.value)}
                    >
                      <option value="">Choose an asset...</option>
                      {mockAvailableAssets.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.name} ({asset.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Placement Controls */}
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setPlacementMode(!placementMode)}
                      variant={placementMode ? "default" : "outline"}
                      className="flex-1"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {placementMode ? 'Exit Placement Mode' : 'Enter Placement Mode'}
                    </Button>
                    <Button
                      disabled={!selectedAsset || !selectedDistrict}
                      className="flex-1"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Place Model
                    </Button>
                  </div>

                  {placementMode && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Click on the 3D scene to place the selected model. Use the controls below to adjust position, rotation, and scale.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Transform Controls */}
              {editingModel && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Move className="w-5 h-5" />
                      <span>Transform Controls</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Position */}
                    <div>
                      <Label>Position</Label>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        <div>
                          <Label htmlFor="pos-x" className="text-xs">X</Label>
                          <Input
                            id="pos-x"
                            type="number"
                            value={editingModel.position.x}
                            onChange={(e) => setEditingModel({
                              ...editingModel,
                              position: { ...editingModel.position, x: parseFloat(e.target.value) || 0 }
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="pos-y" className="text-xs">Y</Label>
                          <Input
                            id="pos-y"
                            type="number"
                            value={editingModel.position.y}
                            onChange={(e) => setEditingModel({
                              ...editingModel,
                              position: { ...editingModel.position, y: parseFloat(e.target.value) || 0 }
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="pos-z" className="text-xs">Z</Label>
                          <Input
                            id="pos-z"
                            type="number"
                            value={editingModel.position.z}
                            onChange={(e) => setEditingModel({
                              ...editingModel,
                              position: { ...editingModel.position, z: parseFloat(e.target.value) || 0 }
                            })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Rotation */}
                    <div>
                      <Label>Rotation (degrees)</Label>
                      <div className="grid grid-cols-3 gap-2 mt-1">
                        <div>
                          <Label htmlFor="rot-x" className="text-xs">X</Label>
                          <Input
                            id="rot-x"
                            type="number"
                            value={editingModel.rotation.x}
                            onChange={(e) => setEditingModel({
                              ...editingModel,
                              rotation: { ...editingModel.rotation, x: parseFloat(e.target.value) || 0 }
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="rot-y" className="text-xs">Y</Label>
                          <Input
                            id="rot-y"
                            type="number"
                            value={editingModel.rotation.y}
                            onChange={(e) => setEditingModel({
                              ...editingModel,
                              rotation: { ...editingModel.rotation, y: parseFloat(e.target.value) || 0 }
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="rot-z" className="text-xs">Z</Label>
                          <Input
                            id="rot-z"
                            type="number"
                            value={editingModel.rotation.z}
                            onChange={(e) => setEditingModel({
                              ...editingModel,
                              rotation: { ...editingModel.rotation, z: parseFloat(e.target.value) || 0 }
                            })}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quick Move Presets */}
                    <div>
                      <Label>Quick Move</Label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingModel({
                            ...editingModel!,
                            position: { x: 0, y: 0, z: 0 }
                          })}
                        >
                          Center (0,0,0)
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const district = districts.find(d => d.id === editingModel!.districtId);
                            if (district) {
                              setEditingModel({
                                ...editingModel!,
                                position: { ...district.position }
                              });
                            }
                          }}
                        >
                          District Center
                        </Button>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button className="flex-1">
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditingModel(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Replace Model Dialog */}
              {replacingModel && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <RefreshCw className="w-5 h-5" />
                      <span>Replace Model</span>
                    </CardTitle>
                    <CardDescription>
                      Replace "{replacingModel.assetName}" with a different asset while keeping its position and transforms
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="replace-asset-select">Select New Asset</Label>
                      <select
                        id="replace-asset-select"
                        className="w-full mt-1 p-2 border rounded-md"
                        value={selectedAsset}
                        onChange={(e) => setSelectedAsset(e.target.value)}
                      >
                        <option value="">Choose a replacement asset...</option>
                        {mockAvailableAssets
                          .filter(asset => asset.id !== replacingModel.assetId) // Don't show current asset
                          .map((asset) => (
                          <option key={asset.id} value={asset.id}>
                            {asset.name} ({asset.type})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Current Model Details:</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Name:</strong> {replacingModel.assetName}</p>
                        <p><strong>Position:</strong> ({replacingModel.position.x}, {replacingModel.position.y}, {replacingModel.position.z})</p>
                        <p><strong>Rotation:</strong> ({replacingModel.rotation.x}°, {replacingModel.rotation.y}°, {replacingModel.rotation.z}°)</p>
                        <p><strong>Scale:</strong> ({replacingModel.scale.x}, {replacingModel.scale.y}, {replacingModel.scale.z})</p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        disabled={!selectedAsset}
                        className="flex-1"
                        onClick={() => {
                          if (selectedAsset && replacingModel) {
                            const newAsset = mockAvailableAssets.find(a => a.id === selectedAsset);
                            if (newAsset) {
                              setPlacedModels(prev => prev.map(model =>
                                model.id === replacingModel!.id
                                  ? {
                                      ...model,
                                      assetId: newAsset.id,
                                      assetName: newAsset.name
                                    }
                                  : model
                              ));
                              setReplacingModel(null);
                              setSelectedAsset('');
                            }
                          }
                        }}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Replace Model
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setReplacingModel(null);
                          setSelectedAsset('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Move Model Dialog */}
              {movingModel && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Move className="w-5 h-5" />
                      <span>Move Model to Different District</span>
                    </CardTitle>
                    <CardDescription>
                      Move "{movingModel.assetName}" to a different district while keeping its position relative to the new district
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="move-district-select">Select New District</Label>
                      <select
                        id="move-district-select"
                        className="w-full mt-1 p-2 border rounded-md"
                        defaultValue={movingModel.districtId}
                      >
                        {districts
                          .filter(district => district.id !== movingModel.districtId) // Don't show current district
                          .map((district) => (
                          <option key={district.id} value={district.id}>
                            {district.name} - {district.description}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Current Location:</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <p><strong>Model:</strong> {movingModel.assetName}</p>
                        <p><strong>Current District:</strong> {districts.find(d => d.id === movingModel.districtId)?.name}</p>
                        <p><strong>Position:</strong> ({movingModel.position.x}, {movingModel.position.y}, {movingModel.position.z})</p>
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        Note: The model's position coordinates will remain the same, but it will appear in the new district's space.
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        className="flex-1"
                        onClick={(e) => {
                          const selectElement = e.currentTarget.parentElement?.parentElement?.querySelector('#move-district-select') as HTMLSelectElement;
                          const newDistrictId = selectElement?.value;
                          
                          if (newDistrictId && movingModel) {
                            setPlacedModels(prev => prev.map(model =>
                              model.id === movingModel!.id
                                ? {
                                    ...model,
                                    districtId: newDistrictId
                                  }
                                : model
                            ));
                            setMovingModel(null);
                          }
                        }}
                      >
                        <Move className="w-4 h-4 mr-2" />
                        Move Model
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setMovingModel(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Placed Models List */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Placed Models</CardTitle>
                  <CardDescription>
                    Models currently placed in the spatial commons
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {placedModels.map((model) => (
                      <div
                        key={model.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <Box className="w-8 h-8 text-blue-600" />
                          <div>
                            <h4 className="font-medium">{model.assetName}</h4>
                            <p className="text-sm text-gray-600">
                              District: {districts.find(d => d.id === model.districtId)?.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              Position: ({model.position.x}, {model.position.y}, {model.position.z})
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingModel(model)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setMovingModel(model)}
                          >
                            <Move className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setReplacingModel(model)}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {placedModels.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Box className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No models placed yet</p>
                        <p className="text-sm">Select a district and asset to start placing models</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Shopfront Form Dialog */}
      <ShopfrontFormDialog
        open={showShopfrontForm}
        onOpenChange={setShowShopfrontForm}
        shopfront={editingShopfront}
        districts={districts}
      />
    </div>
  );
}

interface DistrictDetailsProps {
  district: District;
}

function DistrictDetails({ district }: DistrictDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Map className="w-5 h-5" />
          <span>{district.name}</span>
        </CardTitle>
        <CardDescription>{district.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Position & Bounds */}
        <div>
          <h4 className="font-medium mb-2">Spatial Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Position:</span>
              <div className="font-mono">
                ({district.position.x}, {district.position.y}, {district.position.z})
              </div>
            </div>
            <div>
              <span className="text-gray-600">Bounds:</span>
              <div className="font-mono">
                {district.bounds.width}×{district.bounds.height}×{district.bounds.depth}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div>
          <h4 className="font-medium mb-2">Statistics</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Citizens:</span>
              <span className="font-medium ml-2">{district.citizens}</span>
            </div>
            <div>
              <span className="text-gray-600">Shops:</span>
              <span className="font-medium ml-2">{district.shops}</span>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div>
          <h4 className="font-medium mb-2">Environment Settings</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Lighting:</span>
              <Badge variant="outline">{district.settings.lighting}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Weather:</span>
              <Badge variant="outline">{district.settings.weather}</Badge>
            </div>
            <div className="flex justify-between">
              <span>Music:</span>
              <Badge variant={district.settings.music ? "default" : "secondary"}>
                {district.settings.music ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Interactions:</span>
              <Badge variant={district.settings.interactions ? "default" : "secondary"}>
                {district.settings.interactions ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 pt-4">
          <Button className="flex-1">
            <Navigation className="w-4 h-4 mr-2" />
            Teleport Here
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Edit Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface CitizenDetailsProps {
  citizen: Citizen;
}

function CitizenDetails({ citizen }: CitizenDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <span>{citizen.name}</span>
        </CardTitle>
        <CardDescription>{citizen.district}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Avatar and Status */}
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            {citizen.avatar ? (
              <img
                src={citizen.avatar}
                alt={citizen.name}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <Users className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <div>
            <Badge className={`text-sm ${getStatusColor(citizen.status)}`}>
              {citizen.status}
            </Badge>
            <p className="text-sm text-gray-600 mt-1">Last seen: {citizen.lastSeen}</p>
          </div>
        </div>

        {/* Stats */}
        <div>
          <h4 className="font-medium mb-2">Statistics</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Interactions:</span>
              <span className="font-medium ml-2">{citizen.interactions}</span>
            </div>
            <div>
              <span className="text-gray-600">Reputation:</span>
              <span className="font-medium ml-2">{citizen.reputation}/100</span>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div>
          <h4 className="font-medium mb-2">Badges</h4>
          <div className="flex flex-wrap gap-2">
            {citizen.badges.map((badge) => (
              <Badge key={badge} variant="outline">
                {badge}
              </Badge>
            ))}
          </div>
        </div>

        {/* Current Activity */}
        <div>
          <h4 className="font-medium mb-2">Current Activity</h4>
          <p className="text-sm text-gray-600">{citizen.activity}</p>
          <p className="text-xs text-gray-500 mt-1">
            Position: ({citizen.position.x}, {citizen.position.y}, {citizen.position.z})
          </p>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 pt-4">
          <Button className="flex-1">
            <MessageCircle className="w-4 h-4 mr-2" />
            Send Message
          </Button>
          <Button variant="outline">
            <Navigation className="w-4 h-4 mr-2" />
            Follow
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Shopfront Form Dialog Component
function ShopfrontFormDialog({ 
  open, 
  onOpenChange, 
  shopfront, 
  districts 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  shopfront?: Shopfront | null; 
  districts: District[] 
}) {
  const [formData, setFormData] = useState({
    name: shopfront?.name || '',
    description: shopfront?.description || '',
    districtId: shopfront?.districtId || districts[0]?.id || '',
    position: shopfront?.position || { x: 0, y: 0, z: 0 },
    bounds: shopfront?.bounds || { width: 10, height: 8, depth: 8 },
    status: shopfront?.status || 'active',
    theme: shopfront?.theme || 'modern'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Submitting shopfront:', formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {shopfront ? 'Edit Shopfront' : 'Add New Shopfront'}
          </DialogTitle>
          <DialogDescription>
            Configure the shopfront details and spatial positioning.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Shopfront name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="district">District</Label>
              <Select value={formData.districtId} onValueChange={(value) => setFormData({...formData, districtId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select district" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((district) => (
                    <SelectItem key={district.id} value={district.id}>
                      {district.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Shopfront description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Position X</Label>
              <Input
                type="number"
                value={formData.position.x}
                onChange={(e) => setFormData({
                  ...formData, 
                  position: {...formData.position, x: parseFloat(e.target.value) || 0}
                })}
                step="0.1"
              />
            </div>
            <div className="space-y-2">
              <Label>Position Y</Label>
              <Input
                type="number"
                value={formData.position.y}
                onChange={(e) => setFormData({
                  ...formData, 
                  position: {...formData.position, y: parseFloat(e.target.value) || 0}
                })}
                step="0.1"
              />
            </div>
            <div className="space-y-2">
              <Label>Position Z</Label>
              <Input
                type="number"
                value={formData.position.z}
                onChange={(e) => setFormData({
                  ...formData, 
                  position: {...formData.position, z: parseFloat(e.target.value) || 0}
                })}
                step="0.1"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Width</Label>
              <Input
                type="number"
                value={formData.bounds.width}
                onChange={(e) => setFormData({
                  ...formData, 
                  bounds: {...formData.bounds, width: parseFloat(e.target.value) || 10}
                })}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label>Height</Label>
              <Input
                type="number"
                value={formData.bounds.height}
                onChange={(e) => setFormData({
                  ...formData, 
                  bounds: {...formData.bounds, height: parseFloat(e.target.value) || 8}
                })}
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label>Depth</Label>
              <Input
                type="number"
                value={formData.bounds.depth}
                onChange={(e) => setFormData({
                  ...formData, 
                  bounds: {...formData.bounds, depth: parseFloat(e.target.value) || 8}
                })}
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="vacant">Vacant</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select value={formData.theme} onValueChange={(value) => setFormData({...formData, theme: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="traditional">Traditional</SelectItem>
                  <SelectItem value="futuristic">Futuristic</SelectItem>
                  <SelectItem value="rustic">Rustic</SelectItem>
                  <SelectItem value="minimalist">Minimalist</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {shopfront ? 'Update Shopfront' : 'Create Shopfront'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}