'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Play, Pause, Volume2, VolumeX, Trash2, Download, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface AudioAsset {
  id: string;
  name: string;
  original_name: string;
  file_url: string;
  file_format: string;
  file_size_bytes: number;
  duration_seconds?: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const AUDIO_ASSETS = [
  {
    key: 'cosmic-ambient',
    name: 'Cosmic Ambient Background',
    description: 'Deep space atmosphere with stellar winds',
    defaultFile: 'cosmic-ambient.wav',
    duration: '2:00 (looping)'
  },
  {
    key: 'energy-hum',
    name: 'Energy Field Hum',
    description: 'Gateway core energy field with harmonics',
    defaultFile: 'energy-hum.wav',
    duration: '1:00 (looping)'
  },
  {
    key: 'particle-field',
    name: 'Particle Field Ambiance',
    description: 'Ethereal particle twinkles and whooshes',
    defaultFile: 'particle-field.wav',
    duration: '1:00 (looping)'
  },
  {
    key: 'node-hover',
    name: 'Navigation Node Hover',
    description: 'Gentle energy pulse for hover feedback',
    defaultFile: 'node-hover.wav',
    duration: '0.8s'
  },
  {
    key: 'node-click',
    name: 'Navigation Node Click',
    description: 'Satisfying portal activation sound',
    defaultFile: 'node-click.wav',
    duration: '1.5s'
  },
  {
    key: 'portal-open',
    name: 'Portal Opening',
    description: 'Cinematic gateway opening surge',
    defaultFile: 'portal-open.wav',
    duration: '2.5s'
  },
  {
    key: 'welcome-chime',
    name: 'Welcome Chime',
    description: 'Elegant welcoming bell tone',
    defaultFile: 'welcome-chime.wav',
    duration: '0.6s'
  }
];

export default function AdminAudioPage() {
  const [audioAssets, setAudioAssets] = useState<Record<string, AudioAsset | null>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
  const router = useRouter();

  useEffect(() => {
    fetchAudioAssets();
  }, []);

  const fetchAudioAssets = async () => {
    try {
      const response = await fetch('/api/admin/audio');
      if (response.ok) {
        const data = await response.json();
        const assetMap: Record<string, AudioAsset | null> = {};
        AUDIO_ASSETS.forEach(asset => {
          assetMap[asset.key] = data.assets?.find((a: AudioAsset) => a.name === asset.key) || null;
        });
        setAudioAssets(assetMap);
      }
    } catch (error) {
      console.error('Error fetching audio assets:', error);
      setErrors({ general: 'Failed to load audio assets' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (assetKey: string, file: File) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      setErrors({ [assetKey]: 'Please select an audio file (MP3, WAV, etc.)' });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrors({ [assetKey]: 'File size must be less than 10MB' });
      return;
    }

    setUploading(assetKey);
    setUploadProgress({ [assetKey]: 0 });
    setErrors({});

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('assetKey', assetKey);
      formData.append('assetName', assetKey);

      const response = await fetch('/api/admin/audio/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setAudioAssets(prev => ({
          ...prev,
          [assetKey]: result.asset
        }));
        setSuccess(`Successfully uploaded ${file.name}`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const error = await response.json();
        setErrors({ [assetKey]: error.error || 'Upload failed' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setErrors({ [assetKey]: 'Upload failed. Please try again.' });
    } finally {
      setUploading(null);
      setUploadProgress({});
    }
  };

  const handleDelete = async (assetKey: string) => {
    if (!confirm('Are you sure you want to delete this custom audio file? The default will be used instead.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/audio/${assetKey}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAudioAssets(prev => ({
          ...prev,
          [assetKey]: null
        }));
        setSuccess('Audio file deleted successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setErrors({ [assetKey]: 'Failed to delete audio file' });
      }
    } catch (error) {
      console.error('Delete error:', error);
      setErrors({ [assetKey]: 'Delete failed. Please try again.' });
    }
  };

  const handlePlay = async (assetKey: string, fileUrl: string) => {
    if (playing === assetKey) {
      // Stop playing
      if (audioRefs.current[assetKey]) {
        audioRefs.current[assetKey]?.pause();
        audioRefs.current[assetKey]!.currentTime = 0;
      }
      setPlaying(null);
      return;
    }

    // Stop any currently playing audio
    Object.values(audioRefs.current).forEach(audio => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });

    // Create new audio element if needed
    if (!audioRefs.current[assetKey]) {
      audioRefs.current[assetKey] = new Audio(fileUrl);
      audioRefs.current[assetKey]!.muted = muted;
    }

    const audio = audioRefs.current[assetKey]!;
    audio.muted = muted;

    try {
      await audio.play();
      setPlaying(assetKey);

      // Handle end of playback
      audio.onended = () => {
        setPlaying(null);
      };
    } catch (error) {
      console.error('Playback error:', error);
      setErrors({ [assetKey]: 'Failed to play audio' });
    }
  };

  const toggleMute = () => {
    setMuted(!muted);
    Object.values(audioRefs.current).forEach(audio => {
      if (audio) {
        audio.muted = !muted;
      }
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Audio Asset Management</h1>
        <p className="text-gray-600">
          Upload custom audio files to replace the default City Gate sounds. No code changes required.
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
          <span className="text-green-800">{success}</span>
        </div>
      )}

      {errors.general && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
          <span className="text-red-800">{errors.general}</span>
        </div>
      )}

      {/* Global Controls */}
      <div className="mb-6 flex items-center space-x-4">
        <button
          onClick={toggleMute}
          className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          {muted ? <VolumeX className="h-5 w-5 mr-2" /> : <Volume2 className="h-5 w-5 mr-2" />}
          {muted ? 'Unmute' : 'Mute'} Preview
        </button>
        <button
          onClick={fetchAudioAssets}
          className="flex items-center px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors"
        >
          <RefreshCw className="h-5 w-5 mr-2" />
          Refresh
        </button>
      </div>

      {/* Audio Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {AUDIO_ASSETS.map((asset) => {
          const customAsset = audioAssets[asset.key];
          const hasCustom = !!customAsset;
          const isUploading = uploading === asset.key;
          const isPlaying = playing === asset.key;
          const error = errors[asset.key];

          return (
            <div key={asset.key} className="bg-white rounded-lg shadow-md p-6 border">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{asset.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{asset.description}</p>
                <div className="text-xs text-gray-500">
                  Duration: {asset.duration}
                </div>
              </div>

              {/* Status */}
              <div className="mb-4">
                {hasCustom ? (
                  <div className="flex items-center text-green-600 mb-2">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">Custom file active</span>
                  </div>
                ) : (
                  <div className="flex items-center text-gray-500 mb-2">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <span className="text-sm">Using default file</span>
                  </div>
                )}
              </div>

              {/* File Info */}
              {hasCustom && (
                <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
                  <div className="font-medium text-gray-900 mb-1">{customAsset.original_name}</div>
                  <div className="text-gray-600">
                    {formatFileSize(customAsset.file_size_bytes)} • {customAsset.file_format.toUpperCase()}
                  </div>
                  <div className="text-gray-500 text-xs mt-1">
                    Uploaded: {new Date(customAsset.created_at).toLocaleDateString()}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                  {error}
                </div>
              )}

              {/* Controls */}
              <div className="flex flex-wrap gap-2">
                {/* Play Button */}
                <button
                  onClick={() => handlePlay(asset.key, hasCustom ? customAsset.file_url : `/sounds/${asset.defaultFile}`)}
                  disabled={isUploading}
                  className="flex items-center px-3 py-2 bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 rounded transition-colors text-sm"
                >
                  {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  {isPlaying ? 'Stop' : 'Preview'}
                </button>

                {/* Upload Button */}
                <button
                  onClick={() => fileInputRefs.current[asset.key]?.click()}
                  disabled={isUploading}
                  className="flex items-center px-3 py-2 bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-300 rounded transition-colors text-sm"
                >
                  {isUploading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>

                {/* Download Default */}
                <a
                  href={`/sounds/${asset.defaultFile}`}
                  download
                  className="flex items-center px-3 py-2 bg-gray-500 text-white hover:bg-gray-600 rounded transition-colors text-sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Default
                </a>

                {/* Delete Custom */}
                {hasCustom && (
                  <button
                    onClick={() => handleDelete(asset.key)}
                    className="flex items-center px-3 py-2 bg-red-500 text-white hover:bg-red-600 rounded transition-colors text-sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                )}
              </div>

              {/* Hidden File Input */}
              <input
                ref={(el) => { fileInputRefs.current[asset.key] = el; }}
                type="file"
                accept="audio/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileSelect(asset.key, file);
                  }
                }}
                className="hidden"
              />

              {/* Upload Progress */}
              {uploadProgress[asset.key] !== undefined && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress[asset.key]}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-600 mt-1 text-center">
                    {uploadProgress[asset.key]}% uploaded
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Usage Instructions */}
      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-blue-800 mb-2">Upload Process</h3>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Click "Upload" on any audio asset</li>
              <li>2. Select your custom MP3/WAV file</li>
              <li>3. File uploads automatically</li>
              <li>4. Custom file becomes active immediately</li>
            </ol>
          </div>
          <div>
            <h3 className="font-medium text-blue-800 mb-2">System Behavior</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Custom files override defaults</li>
              <li>• No code changes required</li>
              <li>• Changes apply instantly</li>
              <li>• Fallback to defaults if upload fails</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}