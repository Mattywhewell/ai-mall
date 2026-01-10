/**
 * 3D Tours Management Page
 * Suppliers can add and manage Matterport-style 3D tours of their physical shops
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SupplierOnly } from '@/components/RoleGuard';
import { Plus, Eye, Edit, Trash2, ExternalLink, Camera, Smartphone, Zap } from 'lucide-react';

interface Tour3D {
  id: string;
  title: string;
  description: string;
  matterport_url: string;
  tour_type: string;
  enabled: boolean;
  featured: boolean;
  capture_method?: string;
  capture_device?: string;
  thumbnail_url?: string;
  created_at: string;
  hotspots_count?: number;
}

export default function Tours3DPage() {
  const [tours, setTours] = useState<Tour3D[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchTours();
  }, []);

  const fetchTours = async () => {
    try {
      const res = await fetch('/api/supplier/3d-tours');
      if (res.ok) {
        const data = await res.json();
        setTours(data);
      }
    } catch (error) {
      console.error('Failed to fetch tours:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTourStatus = async (tourId: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/supplier/3d-tours/${tourId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });

      if (res.ok) {
        setTours(tours.map(tour =>
          tour.id === tourId ? { ...tour, enabled } : tour
        ));
      }
    } catch (error) {
      console.error('Failed to update tour:', error);
    }
  };

  const deleteTour = async (tourId: string) => {
    if (!confirm('Are you sure you want to delete this 3D tour?')) return;

    try {
      const res = await fetch(`/api/supplier/3d-tours/${tourId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setTours(tours.filter(tour => tour.id !== tourId));
      }
    } catch (error) {
      console.error('Failed to delete tour:', error);
    }
  };

  const getCaptureIcon = (method?: string) => {
    switch (method) {
      case 'pro_camera':
        return <Camera className="w-4 h-4" />;
      case 'smartphone':
        return <Smartphone className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-white mx-auto mb-4"></div>
          <p>Loading 3D tours...</p>
        </div>
      </div>
    );
  }

  return (
    <SupplierOnly>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Header */}
        <div className="bg-black/30 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">3D Tours</h1>
                <p className="text-gray-300 mt-2">Create immersive shopping experiences with Matterport-style tours</p>
              </div>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg flex items-center gap-2"
              >
                <Plus size={20} />
                Add 3D Tour
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Info Banner */}
          <div className="mb-8 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/50 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Eye className="w-6 h-6 text-purple-300" />
              </div>
              <div className="flex-1">
                <h3 className="text-purple-100 font-semibold text-lg mb-2">🏬 Digital Twins of Your Physical Shop</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-200">
                  <div>
                    <p className="font-medium mb-1">Capture Methods:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Matterport Pro cameras</li>
                      <li>• iPhone with LiDAR</li>
                      <li>• Android depth sensors</li>
                      <li>• Any 360° capture device</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Features:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Walk-around shopping</li>
                      <li>• Interactive product hotspots</li>
                      <li>• AI-enhanced navigation</li>
                      <li>• VR compatibility</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tours Grid */}
          {tours.length === 0 ? (
            <div className="text-center py-12">
              <Eye className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No 3D Tours Yet</h3>
              <p className="text-gray-400 mb-6">Create your first immersive shopping experience</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
              >
                Create Your First 3D Tour
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tours.map((tour) => (
                <div key={tour.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gradient-to-br from-gray-700 to-gray-800 relative">
                    {tour.thumbnail_url ? (
                      <img
                        src={tour.thumbnail_url}
                        alt={tour.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Eye className="w-12 h-12 text-gray-500" />
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3 flex gap-2">
                      {tour.featured && (
                        <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded font-medium">
                          Featured
                        </span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                        tour.enabled
                          ? 'bg-green-500 text-black'
                          : 'bg-gray-500 text-white'
                      }`}>
                        {tour.enabled ? 'Live' : 'Draft'}
                      </span>
                    </div>

                    {/* Capture Method Badge */}
                    {tour.capture_method && (
                      <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        {getCaptureIcon(tour.capture_method)}
                        {tour.capture_method.replace('_', ' ')}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-white font-semibold text-lg mb-2">{tour.title}</h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{tour.description}</p>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                      <span>{tour.hotspots_count || 0} hotspots</span>
                      <span>{new Date(tour.created_at).toLocaleDateString()}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open(`/supplier/3d-tours/${tour.id}/preview`, '_blank')}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                      >
                        <Eye size={14} />
                        Preview
                      </button>
                      <Link
                        href={`/supplier/3d-tours/${tour.id}/edit`}
                        className="bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700 transition-colors flex items-center justify-center"
                      >
                        <Edit size={14} />
                      </Link>
                      <button
                        onClick={() => deleteTour(tour.id)}
                        className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-colors flex items-center justify-center"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Toggle */}
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-gray-400">Enable Tour</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tour.enabled}
                          onChange={(e) => toggleTourStatus(tour.id, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Tour Modal/Form would go here */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
              <h3 className="text-white text-xl font-semibold mb-4">Add New 3D Tour</h3>
              <p className="text-gray-400 text-sm mb-6">
                Ready to create an immersive shopping experience? Let's get started!
              </p>
              <div className="space-y-3">
                <Link
                  href="/supplier/3d-tours/new"
                  className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all text-center"
                >
                  Create New Tour
                </Link>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="block w-full bg-gray-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-700 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SupplierOnly>
  );
}