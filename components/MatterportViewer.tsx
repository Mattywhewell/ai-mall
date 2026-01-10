/**
 * MatterportViewer Component
 * Displays Matterport 3D tours with interactive hotspots
 */

'use client';

import { useEffect, useRef, useState } from 'react';

interface Hotspot {
  id: string;
  product_id?: string;
  hotspot_type: 'product' | 'info' | 'video' | 'link';
  position_x?: number;
  position_y?: number;
  position_z?: number;
  title: string;
  description?: string;
  media_url?: string;
  link_url?: string;
}

interface MatterportViewerProps {
  tourUrl: string;
  hotspots?: Hotspot[];
  className?: string;
  onHotspotClick?: (hotspot: Hotspot) => void;
  showControls?: boolean;
}

export default function MatterportViewer({
  tourUrl,
  hotspots = [],
  className = '',
  onHotspotClick,
  showControls = true
}: MatterportViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Extract Matterport ID from URL
    const matterportId = extractMatterportId(tourUrl);

    if (!matterportId) {
      setError('Invalid Matterport URL');
      setIsLoading(false);
      return;
    }

    // Construct embed URL
    const embedUrl = `https://my.matterport.com/show/?m=${matterportId}&play=1&brand=0&help=0&qs=1&applicationKey=${process.env.NEXT_PUBLIC_MATTERPORT_KEY || 'your-api-key'}`;

    if (iframeRef.current) {
      iframeRef.current.src = embedUrl;
    }

    // Set up message listener for Matterport SDK
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://my.matterport.com') return;

      // Handle Matterport SDK messages
      if (event.data.type === 'tour.loaded') {
        setIsLoading(false);
        // Add custom hotspots
        addHotspots();
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [tourUrl]);

  const extractMatterportId = (url: string): string | null => {
    // Extract ID from various Matterport URL formats
    const patterns = [
      /matterport\.com\/show\/\?m=([a-zA-Z0-9]+)/,
      /my\.matterport\.com\/show\/\?m=([a-zA-Z0-9]+)/,
      /tour\.matterport\.com\/tour\/([a-zA-Z0-9]+)/,
      /^([a-zA-Z0-9]{11})$/ // Direct ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  };

  const addHotspots = () => {
    if (!iframeRef.current?.contentWindow) return;

    // Send message to Matterport iframe to add hotspots
    hotspots.forEach((hotspot) => {
      const message = {
        type: 'hotspot.add',
        data: {
          id: hotspot.id,
          position: {
            x: hotspot.position_x || 0,
            y: hotspot.position_y || 0,
            z: hotspot.position_z || 0
          },
          normal: { x: 0, y: 0, z: 1 }, // Facing direction
          title: hotspot.title,
          description: hotspot.description,
          type: hotspot.hotspot_type,
          productId: hotspot.product_id
        }
      };

      iframeRef.current!.contentWindow!.postMessage(message, 'https://my.matterport.com');
    });
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setError('Failed to load 3D tour');
    setIsLoading(false);
  };

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 text-white ${className}`}>
        <div className="text-center">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <p className="text-lg font-semibold mb-2">Tour Unavailable</p>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-white mx-auto mb-4"></div>
            <p>Loading 3D Tour...</p>
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        className="w-full h-full border-0"
        allow="xr-spatial-tracking; gyroscope; accelerometer"
        allowFullScreen
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        title="Matterport 3D Tour"
      />

      {showControls && (
        <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-2 rounded-lg text-sm">
          <p>Use mouse to navigate • Click hotspots for details</p>
        </div>
      )}

      {/* Custom overlay for hotspots (fallback if SDK doesn't work) */}
      <div className="absolute inset-0 pointer-events-none">
        {hotspots.map((hotspot) => (
          <div
            key={hotspot.id}
            className="absolute w-4 h-4 bg-blue-500 rounded-full cursor-pointer pointer-events-auto animate-pulse"
            style={{
              left: `${(hotspot.position_x || 0) * 100}%`,
              top: `${(hotspot.position_y || 0) * 100}%`,
              transform: 'translate(-50%, -50%)'
            }}
            onClick={() => onHotspotClick?.(hotspot)}
            title={hotspot.title}
          >
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {hotspot.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}