'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2, CheckCircle, XCircle, RotateCcw, Eye } from 'lucide-react';
import { ModelViewer } from '@/components/3d/ModelViewer';

interface UserAvatar {
  id: string;
  user_id: string;
  selfie_url: string;
  avatar_model_url: string | null;
  status: 'processing' | 'completed' | 'failed';
  generation_metadata: any;
  created_at: string;
}

export default function AvatarPage() {
  const [avatar, setAvatar] = useState<UserAvatar | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchAvatar();
  }, []);

  const fetchAvatar = async () => {
    try {
      const response = await fetch('/api/user/avatar');
      if (response.ok) {
        const data = await response.json();
        setAvatar(data.avatar);
      }
    } catch (error) {
      console.error('Error fetching avatar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleGenerate = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('selfie', selectedFile);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        alert('Avatar generation started! This may take a few minutes.');
        setSelectedFile(null);
        setPreviewUrl(null);
        // Refresh avatar status
        setTimeout(fetchAvatar, 2000);
      } else {
        const error = await response.json();
        alert(`Generation failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('Generation failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRegenerate = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">3D Avatar</h1>
          <p className="text-gray-600">Generate a personalized 3D avatar from your selfie</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Upload/Generation */}
          <div className="space-y-6">
            {/* Current Avatar Status */}
            {avatar && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Your Avatar</h2>

                {avatar.status === 'processing' && (
                  <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">Generating your avatar...</p>
                      <p className="text-sm text-blue-700">This may take a few minutes</p>
                    </div>
                  </div>
                )}

                {avatar.status === 'completed' && avatar.avatar_model_url && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">Avatar generated successfully!</p>
                        <p className="text-sm text-green-700">Created {new Date(avatar.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <ModelViewer modelUrl={avatar.avatar_model_url} className="w-full h-full" />
                    </div>

                    <button
                      onClick={() => setShowViewer(true)}
                      className="w-full flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Full Size</span>
                    </button>
                  </div>
                )}

                {avatar.status === 'failed' && (
                  <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-900">Generation failed</p>
                      <p className="text-sm text-red-700">Please try again with a clearer selfie</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">
                {avatar ? 'Generate New Avatar' : 'Generate Your First Avatar'}
              </h2>

              {!selectedFile ? (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Upload a clear selfie for the best results
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                      }}
                      className="hidden"
                      id="selfie-upload"
                    />
                    <label
                      htmlFor="selfie-upload"
                      className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors cursor-pointer inline-block"
                    >
                      Choose Selfie
                    </label>
                  </div>

                  <div className="text-sm text-gray-500 space-y-1">
                    <p>• Use good lighting and face the camera directly</p>
                    <p>• Remove glasses if possible for better results</p>
                    <p>• Smile naturally for more expressive avatars</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt="Selfie preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleGenerate}
                      disabled={uploading}
                      className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Generating...
                        </>
                      ) : (
                        'Generate 3D Avatar'
                      )}
                    </button>

                    <button
                      onClick={handleRegenerate}
                      disabled={uploading}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Info */}
          <div className="space-y-6">
            {/* How it works */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">How It Works</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Upload Selfie</p>
                    <p className="text-sm text-gray-600">Take or upload a clear photo of yourself</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <p className="font-medium">AI Processing</p>
                    <p className="text-sm text-gray-600">Our AI analyzes your facial features</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <p className="font-medium">3D Avatar Created</p>
                    <p className="text-sm text-gray-600">Get your personalized 3D avatar</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Tips for Best Results</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Use front-facing photos with good lighting</li>
                <li>• Avoid heavy makeup or accessories</li>
                <li>• Keep a neutral expression for base avatars</li>
                <li>• Higher resolution photos work better</li>
                <li>• Remove hats, sunglasses, or masks</li>
              </ul>
            </div>

            {/* Privacy */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Privacy & Security</h3>
              <p className="text-sm text-gray-600">
                Your selfies are processed securely and deleted after avatar generation.
                We use industry-standard encryption and never share your personal images.
              </p>
            </div>
          </div>
        </div>

        {/* Full Size Viewer Modal */}
        {showViewer && avatar?.avatar_model_url && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl h-3/4 flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-bold">Your 3D Avatar</h2>
                <button
                  onClick={() => setShowViewer(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 p-4">
                <ModelViewer modelUrl={avatar.avatar_model_url} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}