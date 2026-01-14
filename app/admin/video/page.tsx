'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, Play, Pause, Volume2, VolumeX, Trash2, Download, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface VideoAsset {
  id: string;
  name: string;
  original_name: string;
  file_url: string;
  file_format: string;
  file_size_bytes: number;
  duration_seconds?: number;
  resolution_width?: number;
  resolution_height?: number;
  description?: string;
  tags?: string[];
  schedule_start?: string | null;
  schedule_end?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const VIDEO_ASSETS = [
  { key: 'product-showcase', name: 'Product Showcase', defaultFile: 'product-showcase.mp4', description: 'Showcase video for featured products', duration: '0:30' },
  { key: 'store-tour', name: 'Store Tour', defaultFile: 'store-tour.mp4', description: 'Virtual store tour', duration: '0:45' },
  { key: 'creator-spotlight', name: 'Creator Spotlight', defaultFile: 'creator-spotlight.mp4', description: 'Featured creator video', duration: '0:22' },
  { key: 'district-intro', name: 'District Intro', defaultFile: 'district-intro.mp4', description: 'District welcome video', duration: '0:15' }
];

export default function AdminVideoPage() {
  const [videoAssets, setVideoAssets] = useState<Record<string, VideoAsset | null>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    fetchVideoAssets();
  }, []);

  const fetchVideoAssets = async () => {
    try {
      const response = await fetch('/api/admin/video');
      if (response.ok) {
        const data = await response.json();
        const assetMap: Record<string, VideoAsset | null> = {};
        VIDEO_ASSETS.forEach(asset => {
          assetMap[asset.key] = data.assets?.find((a: VideoAsset) => a.name === asset.key) || null;
        });
        setVideoAssets(assetMap);
      }
    } catch (error) {
      console.error('Error fetching video assets:', error);
      setErrors({ general: 'Failed to load video assets' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (assetKey: string, file: File, scheduleStart?: string, scheduleEnd?: string, tags?: string[], description?: string) => {
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setErrors({ [assetKey]: 'Please select a video file (MP4, WEBM, MOV, etc.)' });
      return;
    }

    // Max 100MB
    if (file.size > 100 * 1024 * 1024) {
      setErrors({ [assetKey]: 'File size must be less than 100MB' });
      return;
    }

    setUploading(assetKey);
    setErrors({});

    try {
      // Read metadata locally
      const meta = await readVideoMetadata(file);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('assetKey', assetKey);
      formData.append('assetName', assetKey);
      formData.append('duration', String(meta.duration || 0));
      formData.append('resolution_width', String(meta.width || 0));
      formData.append('resolution_height', String(meta.height || 0));
      if (tags && tags.length) formData.append('tags', JSON.stringify(tags));
      if (description) formData.append('description', description);
      if (scheduleStart) formData.append('schedule_start', scheduleStart);
      if (scheduleEnd) formData.append('schedule_end', scheduleEnd);

      const response = await fetch('/api/admin/video/upload', { method: 'POST', body: formData });
      if (response.ok) {
        const result = await response.json();
        setVideoAssets(prev => ({ ...prev, [assetKey]: result.asset }));
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
    }
  };

  const readVideoMetadata = (file: File) => {
    return new Promise<{ duration?: number; width?: number; height?: number }>((resolve) => {
      const url = URL.createObjectURL(file);
      const vid = document.createElement('video');
      vid.preload = 'metadata';
      vid.src = url;
      vid.onloadedmetadata = () => {
        const meta = { duration: vid.duration || 0, width: vid.videoWidth || 0, height: vid.videoHeight || 0 };
        URL.revokeObjectURL(url);
        resolve(meta);
      };
      vid.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({});
      };
    });
  };

  const handleDelete = async (assetKey: string) => {
    if (!confirm('Are you sure you want to delete this video asset?')) return;

    try {
      const response = await fetch(`/api/admin/video/${assetKey}`, { method: 'DELETE' });
      if (response.ok) {
        setVideoAssets(prev => ({ ...prev, [assetKey]: null }));
        setSuccess('Video deleted successfully');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setErrors({ [assetKey]: 'Failed to delete video' });
      }
    } catch (error) {
      console.error('Delete error:', error);
      setErrors({ [assetKey]: 'Delete failed. Please try again.' });
    }
  };

  const handlePlay = async (assetKey: string, fileUrl: string) => {
    if (playing === assetKey) {
      if (videoRefs.current[assetKey]) {
        videoRefs.current[assetKey]?.pause();
        videoRefs.current[assetKey]!.currentTime = 0;
      }
      setPlaying(null);
      return;
    }

    // Pause others
    Object.values(videoRefs.current).forEach(v => { if (v) v.pause(); });

    if (!videoRefs.current[assetKey]) {
      const vid = document.createElement('video');
      vid.src = fileUrl;
      vid.muted = muted;
      vid.crossOrigin = 'anonymous';
      videoRefs.current[assetKey] = vid;
      try {
        await vid.play();
        setPlaying(assetKey);
        vid.onended = () => setPlaying(null);
      } catch (e) {
        console.error('Playback error', e);
        setErrors({ [assetKey]: 'Failed to play video' });
      }
    } else {
      const vid = videoRefs.current[assetKey]!;
      vid.muted = muted;
      try {
        await vid.play();
        setPlaying(assetKey);
        vid.onended = () => setPlaying(null);
      } catch (e) {
        console.error('Playback error', e);
        setErrors({ [assetKey]: 'Failed to play video' });
      }
    }
  };

  const toggleMute = () => {
    setMuted(!muted);
    Object.values(videoRefs.current).forEach(v => { if (v) v.muted = !muted; });
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div></div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Asset Management</h1>
        <p className="text-gray-600">Upload and schedule videos for site experiences. Supports MP4, WEBM, MOV (max 100MB).</p>
      </div>

      {success && <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center"><CheckCircle className="h-5 w-5 text-green-500 mr-3" /> <span className="text-green-800">{success}</span></div>}
      {errors.general && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center"><AlertCircle className="h-5 w-5 text-red-500 mr-3" /> <span className="text-red-800">{errors.general}</span></div>}

      <div className="mb-6 flex items-center space-x-4">
        <button onClick={toggleMute} className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">{muted ? <VolumeX className="h-5 w-5 mr-2" /> : <Volume2 className="h-5 w-5 mr-2" />}{muted ? 'Unmute' : 'Mute'}</button>
        <button onClick={fetchVideoAssets} className="flex items-center px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors"><RefreshCw className="h-5 w-5 mr-2" />Refresh</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {VIDEO_ASSETS.map(asset => {
          const custom = videoAssets[asset.key];
          const hasCustom = !!custom;
          const isUploading = uploading === asset.key;
          const isPlaying = playing === asset.key;
          const error = errors[asset.key];

          return (
            <div key={asset.key} className="bg-white rounded-lg shadow-md p-6 border">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{asset.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{asset.description}</p>
                <div className="text-xs text-gray-500">Duration: {asset.duration}</div>
              </div>

              <div className="mb-4">
                {hasCustom ? (
                  <div className="mb-3">
                    <video className="w-full rounded" controls src={custom!.file_url} />
                    <div className="text-sm text-gray-600 mt-2">{custom!.original_name} • {Math.round((custom!.file_size_bytes || 0) / 1024)} KB</div>

                    {custom!.schedule_start && (
                      <div className="text-xs text-gray-500 mt-1">Scheduled: {new Date(custom!.schedule_start).toLocaleString()} - {custom!.schedule_end ? new Date(custom!.schedule_end).toLocaleString() : '—'}</div>
                    )}
                  </div>
                ) : (
                  <div className="mb-3 bg-gray-100 rounded aspect-video flex items-center justify-center text-gray-500">Default video will be used</div>
                )}
              </div>

              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">{error}</div>}

              <div className="flex flex-wrap gap-2">
                <button onClick={() => handlePlay(asset.key, hasCustom ? custom!.file_url : `/videos/${asset.defaultFile}`)} disabled={isUploading} className="flex items-center px-3 py-2 bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 rounded transition-colors text-sm">{isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}{isPlaying ? 'Stop' : 'Preview'}</button>

                <button onClick={() => fileInputRefs.current[asset.key]?.click()} disabled={isUploading} className="flex items-center px-3 py-2 bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-300 rounded transition-colors text-sm">{isUploading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />} {isUploading ? 'Uploading...' : 'Upload'}</button>

                <a href={`/videos/${asset.defaultFile}`} download className="flex items-center px-3 py-2 bg-gray-500 text-white hover:bg-gray-600 rounded transition-colors text-sm"><Download className="h-4 w-4 mr-2" />Default</a>

                {hasCustom && <button onClick={() => handleDelete(asset.key)} className="flex items-center px-3 py-2 bg-red-500 text-white hover:bg-red-600 rounded transition-colors text-sm"><Trash2 className="h-4 w-4 mr-2" />Delete</button>}
              </div>

              <input ref={(el) => fileInputRefs.current[asset.key] = el} type="file" accept="video/*" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                // Prompt for optional tags, description, schedule
                const description = prompt('Optional description for this video:', custom?.description || asset.description) || undefined;
                const tagsInput = prompt('Comma-separated tags (optional):', custom?.tags?.join(',') || '');
                const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(Boolean) : [];

                const scheduleStart = prompt('Schedule start (YYYY-MM-DDTHH:MM, local) or leave blank:', custom?.schedule_start ? (new Date(custom.schedule_start)).toISOString().slice(0,16) : '');
                const scheduleEnd = prompt('Schedule end (YYYY-MM-DDTHH:MM, local) or leave blank:', custom?.schedule_end ? (new Date(custom.schedule_end)).toISOString().slice(0,16) : '');

                await handleFileSelect(asset.key, file, scheduleStart || undefined, scheduleEnd || undefined, tags, description || undefined);
              }} className="hidden" />

            </div>
          );
        })}
      </div>

      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-blue-800 mb-2">Upload Process</h3>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Click "Upload" on any video asset</li>
              <li>2. Select your MP4/WEBM/MOV file (max 100MB)</li>
              <li>3. Optionally set description, tags, and schedule</li>
              <li>4. File uploads automatically and becomes active (unless scheduled)</li>
            </ol>
          </div>
          <div>
            <h3 className="font-medium text-blue-800 mb-2">System Behavior</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Custom files override defaults</li>
              <li>• Use scheduling to control when a video is active (see cron endpoint below)</li>
              <li>• No code changes required</li>
              <li>• Fallback to defaults if upload fails</li>
            </ul>
            <div className="mt-4 text-sm text-gray-700">
              <div className="font-medium">Cron Endpoint</div>
              <div className="mt-1">POST <code>/api/cron/video-schedules</code> — runs the scheduler to toggle asset <code>is_active</code> based on <code>schedule_start</code>/<code>schedule_end</code>. Configure your host to call this endpoint (e.g., Vercel cron, GitHub Actions or an external scheduler) every minute or as needed.</div>
              <div className="mt-2 text-xs text-gray-600">Security: include header <code>X-Scheduler-Token</code> matching the <code>VIDEO_SCHEDULER_TOKEN</code> env var for production deployments.</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
