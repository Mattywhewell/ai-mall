'use client';

import { useState, useRef } from 'react';
import { Upload, Wand2, Eye, Save } from 'lucide-react';

/**
 * AdminImageUpload Component
 * Following Mythic UI Rules: Obsidian Core + Lumen Gold, Breath motion, Mythos Sans
 */
export default function AdminImageUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress('The city forges your artifact...');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('name', `Forged Artifact ${Date.now()}`);
      formData.append('description', 'An artifact born from the mythic forge');
      formData.append('district', 'central'); // Default district

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadProgress('Artifact forged! Opening scene editor...');
        // Here you would open the scene editor with the generated model
        console.log('Upload successful:', result);
      } else {
        setUploadProgress(`Forging failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress('The forge grows cold. Try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const mythicButtonStyle = {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    border: '1px solid #ffd700',
    color: '#ffd700',
    fontFamily: 'Mythos Sans, system-ui, sans-serif',
    transition: 'all 0.3s ease',
  };

  const mythicButtonHoverStyle = {
    background: 'linear-gradient(135deg, #ffd700 0%, #ffb347 100%)',
    color: '#1a1a2e',
    boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)',
  };

  return (
    <div className="max-w-2xl mx-auto p-8" style={{ background: '#1a1a2e', color: '#f0f0f0', fontFamily: 'Mythos Sans, system-ui, sans-serif' }}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2" style={{ color: '#ffd700' }}>
          The Mythic Forge
        </h2>
        <p className="text-lg opacity-80">
          Shape artifacts for the Aiverse
        </p>
      </div>

      {/* Upload Area */}
      <div
        className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-300 hover:border-opacity-60"
        style={{
          borderColor: '#ffd700',
          background: 'rgba(255, 215, 0, 0.05)',
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {previewUrl ? (
          <div className="space-y-4">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full max-h-64 mx-auto rounded-lg shadow-lg"
              style={{ boxShadow: '0 0 20px rgba(255, 215, 0, 0.2)' }}
            />
            <p className="text-sm opacity-70">Click to change image</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Upload className="w-16 h-16 mx-auto" style={{ color: '#ffd700' }} />
            <div>
              <p className="text-xl font-semibold mb-2">Upload Source Image</p>
              <p className="text-sm opacity-70">
                Choose an image to forge into a 3D artifact
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {selectedFile && (
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="px-8 py-3 rounded-lg font-semibold flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={mythicButtonStyle}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, mythicButtonHoverStyle)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, mythicButtonStyle)}
          >
            <Wand2 className="w-5 h-5" />
            <span>{isUploading ? 'Forging...' : 'Forge Artifact'}</span>
          </button>

          <button
            onClick={() => {
              setSelectedFile(null);
              setPreviewUrl(null);
              setUploadProgress('');
            }}
            className="px-6 py-3 rounded-lg font-semibold"
            style={{ ...mythicButtonStyle, borderColor: '#666' }}
          >
            Clear
          </button>
        </div>
      )}

      {/* Progress Message */}
      {uploadProgress && (
        <div className="mt-6 text-center">
          <p className="text-lg" style={{ color: '#ffd700' }}>
            {uploadProgress}
          </p>
          {isUploading && (
            <div className="mt-4">
              <div className="inline-block w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                   style={{ borderColor: '#ffd700', borderTopColor: 'transparent' }}></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}