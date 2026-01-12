'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  Download,
  Trash2,
  Eye,
  Edit,
  Search,
  Filter,
  Grid,
  List,
  FileText,
  Image,
  Box,
  Package
} from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  type: 'model' | 'texture' | 'material' | 'scene';
  format: string;
  size: number;
  uploadDate: string;
  status: 'active' | 'processing' | 'error';
  thumbnail?: string;
  tags: string[];
  usage: number; // number of scenes using this asset
}

const mockAssets: Asset[] = [
  {
    id: '1',
    name: 'Modern Chair',
    type: 'model',
    format: 'GLB',
    size: 2457600, // 2.4MB
    uploadDate: '2024-01-15',
    status: 'active',
    thumbnail: '/thumbnails/chair.jpg',
    tags: ['furniture', 'modern', 'chair'],
    usage: 5
  },
  {
    id: '2',
    name: 'Wood Texture',
    type: 'texture',
    format: 'PNG',
    size: 524288, // 512KB
    uploadDate: '2024-01-14',
    status: 'active',
    thumbnail: '/thumbnails/wood.jpg',
    tags: ['texture', 'wood', 'material'],
    usage: 12
  },
  {
    id: '3',
    name: 'City Plaza Scene',
    type: 'scene',
    format: 'JSON',
    size: 1572864, // 1.5MB
    uploadDate: '2024-01-13',
    status: 'processing',
    tags: ['scene', 'urban', 'plaza'],
    usage: 1
  }
];

export function AssetManager() {
  const [assets, setAssets] = useState<Asset[]>(mockAssets);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || asset.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          // Add new asset to list
          const newAsset: Asset = {
            id: Date.now().toString(),
            name: files[0].name.split('.')[0],
            type: 'model', // This would be determined by file type
            format: files[0].name.split('.').pop()?.toUpperCase() || 'UNK',
            size: files[0].size,
            uploadDate: new Date().toISOString().split('T')[0],
            status: 'processing',
            tags: [],
            usage: 0
          };
          setAssets(prev => [newAsset, ...prev]);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'model': return <Cube className="w-5 h-5" />;
      case 'texture': return <Image className="w-5 h-5" />;
      case 'material': return <Package className="w-5 h-5" />;
      case 'scene': return <FileText className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Upload 3D Assets</span>
          </CardTitle>
          <CardDescription>
            Upload GLTF/GLB models, textures, materials, or scene files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".gltf,.glb,.obj,.fbx,.png,.jpg,.jpeg,.json,.mtl"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Choose Files</span>
            </Button>
            <div className="text-sm text-gray-600">
              Supported: GLTF, GLB, OBJ, FBX, PNG, JPG, JSON
            </div>
          </div>

          {uploading && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Uploading...</span>
                <span className="text-sm text-gray-600">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Types</option>
                <option value="model">Models</option>
                <option value="texture">Textures</option>
                <option value="material">Materials</option>
                <option value="scene">Scenes</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assets Grid/List */}
      <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
        {filteredAssets.map((asset) => (
          <Card key={asset.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              {viewMode === 'grid' ? (
                // Grid View
                <div className="space-y-3">
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                    {asset.thumbnail ? (
                      <img
                        src={asset.thumbnail}
                        alt={asset.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-gray-400">
                        {getAssetIcon(asset.type)}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="font-medium text-sm truncate">{asset.name}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {asset.format}
                      </Badge>
                      <Badge className={`text-xs ${getStatusColor(asset.status)}`}>
                        {asset.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatFileSize(asset.size)} • Used in {asset.usage} scenes
                    </p>
                  </div>

                  <div className="flex space-x-1">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="w-3 h-3 mr-1" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ) : (
                // List View
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {getAssetIcon(asset.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{asset.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {asset.format}
                      </Badge>
                      <Badge className={`text-xs ${getStatusColor(asset.status)}`}>
                        {asset.status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatFileSize(asset.size)}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-1">
                    <Button variant="outline" size="sm">
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAssets.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-gray-400 mb-4">
              <Package className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
            <p className="text-gray-600">
              {searchTerm || selectedType !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Upload your first 3D asset to get started'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}