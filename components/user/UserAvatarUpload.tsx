'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, Wand2, Eye, RefreshCw } from 'lucide-react';

/**
 * UserAvatarUpload Component
 * Following Arrival Ritual: gentle, magical entry into the Aiverse
 */
export default function UserAvatarUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [currentAvatar, setCurrentAvatar] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check current avatar status on mount
  useEffect(() => {
    checkAvatarStatus();
  }, []);

  const checkAvatarStatus = async () => {
    try {
      const response = await fetch('/api/user/avatar');
      const data = await response.json();
      setCurrentAvatar(data);
    } catch (error) {
      console.error('Failed to check avatar status:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleGenerateAvatar = async () => {
    if (!selectedFile) return;

    setIsGenerating(true);
    setGenerationStatus('The city shapes your reflection...');

    try {
      const formData = new FormData();
      formData.append('selfie', selectedFile);

      const response = await fetch('/api/user/upload-selfie', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setGenerationStatus('Your form emerges from the fog...');
        // Poll for completion
        pollGenerationStatus(result.upload_id);
      } else {
        setGenerationStatus(`Reflection failed: ${result.error}`);
        setIsGenerating(false);
      }
    } catch (error) {
      console.error('Avatar generation error:', error);
      setGenerationStatus('The fog clears. Try again.');
      setIsGenerating(false);
    }
  };

  const pollGenerationStatus = async (uploadId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/user/avatar');
        const data = await response.json();

        if (data.generation_status === 'ready') {
          setGenerationStatus('Your form has emerged from the fog.');
          setCurrentAvatar(data);
          setIsGenerating(false);
          clearInterval(pollInterval);
        } else if (data.generation_status === 'failed') {
          setGenerationStatus('The reflection faded. Please try again.');
          setIsGenerating(false);
          clearInterval(pollInterval);
        }
        // Continue polling if still generating
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000); // Check every 3 seconds

    // Stop polling after 2 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (isGenerating) {
        setGenerationStatus('The city grows weary. Please try again later.');
        setIsGenerating(false);
      }
    }, 120000);
  };

  const mythicButtonStyle = {
    background: 'linear-gradient(135deg, #c0c0c0 0%, #a0a0a0 100%)', // Fog Silver
    border: '1px solid #ffd700', // Lumen Gold
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
    <div className="max-w-2xl mx-auto p-8" style={{
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: '#f0f0f0',
      fontFamily: 'Mythos Sans, system-ui, sans-serif'
    }}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2" style={{ color: '#ffd700' }}>
          The Arrival Ritual
        </h2>
        <p className="text-lg opacity-80">
          Shape your reflection in the Aiverse
        </p>
      </div>

      {/* Current Avatar Display */}
      {currentAvatar?.avatar_url && (
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-lg" style={{
            background: 'rgba(192, 192, 192, 0.1)',
            border: '1px solid #c0c0c0'
          }}>
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#c0c0c0' }}>
              Your Current Form
            </h3>
            <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-2"
                 style={{ borderColor: '#ffd700' }}>
              {/* Placeholder for 3D avatar preview */}
              <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                <Eye className="w-12 h-12" style={{ color: '#c0c0c0' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all duration-300 hover:border-opacity-60"
        style={{
          borderColor: '#c0c0c0', // Fog Silver
          background: 'rgba(192, 192, 192, 0.05)',
        }}
        onClick={() => !isGenerating && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isGenerating}
        />

        {previewUrl ? (
          <div className="space-y-4">
            <img
              src={previewUrl}
              alt="Selfie preview"
              className="max-w-full max-h-64 mx-auto rounded-lg shadow-lg"
              style={{ boxShadow: '0 0 20px rgba(192, 192, 192, 0.2)' }}
            />
            <p className="text-sm opacity-70">Click to change selfie</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Camera className="w-16 h-16 mx-auto" style={{ color: '#c0c0c0' }} />
            <div>
              <p className="text-xl font-semibold mb-2">Upload Your Selfie</p>
              <p className="text-sm opacity-70">
                Let the city shape your reflection
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {selectedFile && !isGenerating && (
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={handleGenerateAvatar}
            className="px-8 py-3 rounded-lg font-semibold flex items-center space-x-2"
            style={mythicButtonStyle}
            onMouseEnter={(e) => Object.assign(e.currentTarget.style, mythicButtonHoverStyle)}
            onMouseLeave={(e) => Object.assign(e.currentTarget.style, mythicButtonStyle)}
          >
            <Wand2 className="w-5 h-5" />
            <span>Shape My Reflection</span>
          </button>

          <button
            onClick={() => {
              setSelectedFile(null);
              setPreviewUrl(null);
              setGenerationStatus('');
            }}
            className="px-6 py-3 rounded-lg font-semibold"
            style={{ ...mythicButtonStyle, borderColor: '#666' }}
          >
            Clear
          </button>
        </div>
      )}

      {/* Generation Status */}
      {generationStatus && (
        <div className="mt-6 text-center">
          <p className="text-lg" style={{ color: '#c0c0c0' }}>
            {generationStatus}
          </p>
          {isGenerating && (
            <div className="mt-4">
              <div className="inline-block w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                   style={{ borderColor: '#c0c0c0', borderTopColor: 'transparent' }}></div>
            </div>
          )}
        </div>
      )}

      {/* Status Messages */}
      {currentAvatar?.generation_status === 'generating' && (
        <div className="mt-6 text-center p-4 rounded-lg" style={{
          background: 'rgba(255, 69, 0, 0.1)',
          border: '1px solid #ff4500'
        }}>
          <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" style={{ color: '#ff4500' }} />
          <p style={{ color: '#ff4500' }}>
            Your reflection is still forming in the fog...
          </p>
        </div>
      )}
    </div>
  );
}