'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Eye, Edit, Trash2, Plus, Loader2 } from 'lucide-react';
import { ModelViewer } from '@/components/3d/ModelViewer';
import { SceneEditor } from '@/components/3d/SceneEditor';

interface AdminAsset {
  id: string;
  name: string;
  description: string;
  asset_type: string;
  file_url: string;
  thumbnail_url: string;
  file_format: string;
  file_size_bytes: number;
  tags: string[];
  created_at: string;
}

export default function AdminAssetsPage() {
  const [assets, setAssets] = useState<AdminAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AdminAsset | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/admin/assets');
      if (response.ok) {
        const data = await response.json();
        setAssets(data.assets || []);
      }
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (formData: FormData) => {
    setUploading(true);
    try {
      const response = await fetch('/api/admin/assets', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        alert('3D model generation started! Check back in a few minutes.');
        setShowUpload(false);
        // Refresh assets after a delay
        setTimeout(fetchAssets, 3000);
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      // In a real implementation, you'd have a DELETE endpoint
      alert('Delete functionality would be implemented here');
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading assets...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
                <p className="text-gray-600">Manage 3D models and generated assets</p>
              </div>
              <button
                onClick={() => setShowUpload(true)}
                className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Generate 3D Model</span>
              </button>
            </div>

            {/* Assets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assets.map((asset) => (
                <div key={asset.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {asset.thumbnail_url ? (
                      <img
                        src={asset.thumbnail_url}
                        alt={asset.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400 text-sm">No Preview</div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 truncate">{asset.name}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{asset.description}</p>

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500 uppercase">{asset.asset_type}</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedAsset(asset);
                            setShowViewer(true);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAsset(asset);
                            setShowEditor(true);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Edit in Scene Editor"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {asset.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {asset.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {assets.length === 0 && (
              <div className="text-center py-12">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assets yet</h3>
                <p className="text-gray-600 mb-4">Generate your first 3D model from an image</p>
                <button
                  onClick={() => setShowUpload(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Generate 3D Model
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUpload={handleUpload}
          uploading={uploading}
        />
      )}

      {showViewer && selectedAsset && (
        <ModelViewerModal
          asset={selectedAsset}
          onClose={() => {
            setShowViewer(false);
            setSelectedAsset(null);
          }}
        />
      )}

      {showEditor && selectedAsset && (
        <SceneEditorModal
          asset={selectedAsset}
          onClose={() => {
            setShowEditor(false);
            setSelectedAsset(null);
          }}
        />
      )}
    </>
  );
}

// Upload Modal Component
function UploadModal({
  onClose,
  onUpload,
  uploading
}: {
  onClose: () => void;
  onUpload: (formData: FormData) => void;
  uploading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !formData.name) return;

    const uploadData = new FormData();
    uploadData.append('image', selectedFile);
    uploadData.append('name', formData.name);
    uploadData.append('description', formData.description);
    uploadData.append('tags', JSON.stringify(formData.tags.split(',').map(t => t.trim()).filter(t => t)));

    onUpload(uploadData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Generate 3D Model</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image File
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="3d, model, generated"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              disabled={uploading || !selectedFile || !formData.name}
            >
              {uploading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generating...
                </div>
              ) : (
                'Generate 3D Model'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Model Viewer Modal Component
function ModelViewerModal({
  asset,
  onClose
}: {
  asset: AdminAsset;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl h-3/4 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">{asset.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 p-4">
          <ModelViewer modelUrl={asset.file_url} />
        </div>
      </div>
    </div>
  );
}

// Scene Editor Modal Component
function SceneEditorModal({
  asset,
  onClose
}: {
  asset: AdminAsset;
  onClose: () => void;
}) {
  const [sceneName, setSceneName] = useState(`Scene from ${asset.name}`);
  const [saving, setSaving] = useState(false);

  const handleSaveScene = async (sceneData: any) => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/assets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sceneData,
          name: sceneName,
          description: `Scene created from ${asset.name} in the scene editor`
        })
      });

      if (response.ok) {
        alert('Scene saved successfully!');
        onClose();
        // Refresh assets list
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Failed to save scene: ${error.error}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save scene');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl h-5/6 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold">Scene Editor - {asset.name}</h2>
            <input
              type="text"
              value={sceneName}
              onChange={(e) => setSceneName(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
              placeholder="Scene name"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={() => {}}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Scene'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 ml-2"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1">
          <SceneEditor
            initialModelUrl={asset.file_url}
            onSave={handleSaveScene}
          />
        </div>
      </div>
    </div>
  );
}