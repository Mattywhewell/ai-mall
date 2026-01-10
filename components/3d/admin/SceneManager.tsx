'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Copy,
  Download,
  Upload,
  Map,
  Users,
  Settings,
  Play,
  Pause
} from 'lucide-react';

interface Scene {
  id: string;
  name: string;
  description: string;
  type: 'commons' | 'shop' | 'district' | 'custom';
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
  thumbnail?: string;
  objects: number;
  visitors: number;
  performance: {
    loadTime: number;
    fps: number;
    memoryUsage: number;
  };
  settings: {
    lighting: 'dynamic' | 'static';
    fog: boolean;
    shadows: boolean;
    particles: boolean;
  };
}

const mockScenes: Scene[] = [
  {
    id: '1',
    name: 'Aiverse Commons',
    description: 'Main spatial commons with districts, citizens, and shops',
    type: 'commons',
    status: 'active',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15',
    thumbnail: '/scenes/commons.jpg',
    objects: 247,
    visitors: 1250,
    performance: { loadTime: 2.3, fps: 58, memoryUsage: 85 },
    settings: { lighting: 'dynamic', fog: true, shadows: true, particles: true }
  },
  {
    id: '2',
    name: 'Wonder District',
    description: 'Exploration and discovery district',
    type: 'district',
    status: 'active',
    createdAt: '2024-01-05',
    updatedAt: '2024-01-14',
    thumbnail: '/scenes/wonder.jpg',
    objects: 89,
    visitors: 450,
    performance: { loadTime: 1.8, fps: 62, memoryUsage: 72 },
    settings: { lighting: 'dynamic', fog: false, shadows: true, particles: true }
  },
  {
    id: '3',
    name: 'Memory Bazaar Shop',
    description: '3D shop tour for digital art marketplace',
    type: 'shop',
    status: 'draft',
    createdAt: '2024-01-10',
    updatedAt: '2024-01-12',
    objects: 156,
    visitors: 0,
    performance: { loadTime: 3.1, fps: 45, memoryUsage: 120 },
    settings: { lighting: 'static', fog: false, shadows: false, particles: false }
  }
];

export function SceneManager() {
  const [scenes, setScenes] = useState<Scene[]>(mockScenes);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);

  const handleCreateScene = () => {
    const newScene: Scene = {
      id: Date.now().toString(),
      name: 'New Scene',
      description: 'A new 3D scene',
      type: 'custom',
      status: 'draft',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      objects: 0,
      visitors: 0,
      performance: { loadTime: 0, fps: 0, memoryUsage: 0 },
      settings: { lighting: 'static', fog: false, shadows: false, particles: false }
    };
    setScenes(prev => [newScene, ...prev]);
    setEditingScene(newScene);
    setIsCreating(true);
  };

  const handleEditScene = (scene: Scene) => {
    setEditingScene(scene);
    setIsCreating(false);
  };

  const handleSaveScene = (updatedScene: Scene) => {
    setScenes(prev => prev.map(s => s.id === updatedScene.id ? updatedScene : s));
    setEditingScene(null);
  };

  const handleDeleteScene = (sceneId: string) => {
    setScenes(prev => prev.filter(s => s.id !== sceneId));
    if (selectedScene?.id === sceneId) {
      setSelectedScene(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'commons': return <Users className="w-4 h-4" />;
      case 'shop': return <Map className="w-4 h-4" />;
      case 'district': return <Settings className="w-4 h-4" />;
      default: return <Map className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Scene Management</h3>
          <p className="text-sm text-gray-600">Create, edit, and manage 3D scenes</p>
        </div>
        <Button onClick={handleCreateScene} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Create Scene</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scene List */}
        <div className="lg:col-span-2 space-y-4">
          {scenes.map((scene) => (
            <Card
              key={scene.id}
              className={`cursor-pointer transition-all ${
                selectedScene?.id === scene.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedScene(scene)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  {/* Thumbnail */}
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {scene.thumbnail ? (
                      <img
                        src={scene.thumbnail}
                        alt={scene.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Map className="w-8 h-8 text-gray-400" />
                    )}
                  </div>

                  {/* Scene Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {getTypeIcon(scene.type)}
                      <h4 className="font-medium truncate">{scene.name}</h4>
                      <Badge className={`text-xs ${getStatusColor(scene.status)}`}>
                        {scene.status}
                      </Badge>
                    </div>

                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {scene.description}
                    </p>

                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{scene.objects} objects</span>
                      <span>{scene.visitors} visitors</span>
                      <span>{scene.performance.fps} FPS</span>
                      <span>{scene.performance.loadTime}s load</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Preview scene
                      }}
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditScene(scene);
                      }}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Duplicate scene
                      }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteScene(scene.id);
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

        {/* Scene Details/Editor */}
        <div className="space-y-4">
          {editingScene ? (
            <SceneEditor
              scene={editingScene}
              onSave={handleSaveScene}
              onCancel={() => setEditingScene(null)}
              isNew={isCreating}
            />
          ) : selectedScene ? (
            <SceneDetails scene={selectedScene} />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Map className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Scene</h3>
                <p className="text-gray-600">
                  Choose a scene from the list to view details and manage settings
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

interface SceneDetailsProps {
  scene: Scene;
}

function SceneDetails({ scene }: SceneDetailsProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {getTypeIcon(scene.type)}
            <span>{scene.name}</span>
          </CardTitle>
          <CardDescription>{scene.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Performance Metrics */}
          <div>
            <h4 className="font-medium mb-2">Performance</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Load Time:</span>
                <span className="ml-2 font-medium">{scene.performance.loadTime}s</span>
              </div>
              <div>
                <span className="text-gray-600">FPS:</span>
                <span className="ml-2 font-medium">{scene.performance.fps}</span>
              </div>
              <div>
                <span className="text-gray-600">Memory:</span>
                <span className="ml-2 font-medium">{scene.performance.memoryUsage}MB</span>
              </div>
              <div>
                <span className="text-gray-600">Objects:</span>
                <span className="ml-2 font-medium">{scene.objects}</span>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div>
            <h4 className="font-medium mb-2">Settings</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Lighting:</span>
                <Badge variant="outline">{scene.settings.lighting}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Fog:</span>
                <Badge variant={scene.settings.fog ? "default" : "secondary"}>
                  {scene.settings.fog ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Shadows:</span>
                <Badge variant={scene.settings.shadows ? "default" : "secondary"}>
                  {scene.settings.shadows ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Particles:</span>
                <Badge variant={scene.settings.particles ? "default" : "secondary"}>
                  {scene.settings.particles ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2 pt-4">
            <Button className="flex-1">
              <Play className="w-4 h-4 mr-2" />
              Preview Scene
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface SceneEditorProps {
  scene: Scene;
  onSave: (scene: Scene) => void;
  onCancel: () => void;
  isNew: boolean;
}

function SceneEditor({ scene, onSave, onCancel, isNew }: SceneEditorProps) {
  const [editedScene, setEditedScene] = useState<Scene>(scene);

  const handleSave = () => {
    onSave({
      ...editedScene,
      updatedAt: new Date().toISOString().split('T')[0]
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isNew ? 'Create Scene' : 'Edit Scene'}</CardTitle>
        <CardDescription>
          Configure scene properties and settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="name">Scene Name</Label>
          <Input
            id="name"
            value={editedScene.name}
            onChange={(e) => setEditedScene(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={editedScene.description}
            onChange={(e) => setEditedScene(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="type">Scene Type</Label>
          <select
            id="type"
            value={editedScene.type}
            onChange={(e) => setEditedScene(prev => ({ ...prev, type: e.target.value as Scene['type'] }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="commons">Commons</option>
            <option value="shop">Shop</option>
            <option value="district">District</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={editedScene.status}
            onChange={(e) => setEditedScene(prev => ({ ...prev, status: e.target.value as Scene['status'] }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="flex space-x-2 pt-4">
          <Button onClick={handleSave} className="flex-1">
            Save Scene
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}</content>
<parameter name="filePath">c:\Users\cupca\Documents\ai-mall\components\3d\admin\SceneManager.tsx