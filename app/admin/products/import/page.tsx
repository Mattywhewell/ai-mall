'use client';

import { useState, useEffect } from 'react';
import { Download, Package, CheckCircle, XCircle, Loader, Sparkles } from 'lucide-react';

interface Supplier {
  id: string;
  business_name: string;
  website?: string;
  integration_status: string;
}

interface ImportStats {
  autoImportedCount: number;
  recentJobs: Array<{
    id: string;
    status: string;
    created_at: string;
    result?: any;
  }>;
}

export default function ProductImportPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [importing, setImporting] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, ImportStats>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  async function fetchSuppliers() {
    try {
      const response = await fetch('/api/admin/vendors');
      const data = await response.json();
      setSuppliers(data.vendors || []);

      // Fetch stats for each supplier
      for (const supplier of data.vendors || []) {
        if (supplier.website) {
          fetchSupplierStats(supplier.id);
        }
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSupplierStats(supplierId: string) {
    try {
      const response = await fetch(`/api/admin/products/import?supplierId=${supplierId}`);
      const data = await response.json();
      setStats(prev => ({ ...prev, [supplierId]: data }));
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }

  async function triggerImport(supplierId: string) {
    setImporting(supplierId);
    try {
      const response = await fetch('/api/admin/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId })
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ Imported ${result.productsImported} products!\nFound: ${result.productsFound}\nErrors: ${result.errors.length}`);
        fetchSupplierStats(supplierId);
        fetchSuppliers();
      } else {
        alert('Import failed. Check console for errors.');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Import failed');
    } finally {
      setImporting(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <Loader className="animate-spin mx-auto mb-4" size={32} />
          <p>Loading suppliers...</p>
        </div>
      </div>
    );
  }

  const suppliersWithWebsites = suppliers.filter(s => s.website);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <Download className="text-purple-400" size={32} />
            <div>
              <h1 className="text-3xl font-bold text-white">Product Auto-Import</h1>
              <p className="text-gray-300 mt-1">
                Automatically scrape and import products from supplier websites 🚀
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="mb-6 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/50 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <Sparkles className="text-purple-300 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="text-purple-100 font-semibold text-lg mb-2">
                ✨ Self-Populating Marketplace
              </h3>
              <p className="text-purple-200 text-sm mb-3">
                AI City automatically discovers products from supplier websites, generates descriptions,
                extracts images, and assigns optimal districts. No manual entry needed!
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white/10 rounded-lg p-2">
                  <p className="text-xs text-purple-300">Product Discovery</p>
                  <p className="text-sm text-white font-medium">AI-Powered</p>
                </div>
                <div className="bg-white/10 rounded-lg p-2">
                  <p className="text-xs text-purple-300">Descriptions</p>
                  <p className="text-sm text-white font-medium">Auto-Generated</p>
                </div>
                <div className="bg-white/10 rounded-lg p-2">
                  <p className="text-xs text-purple-300">District Assignment</p>
                  <p className="text-sm text-white font-medium">Intelligent</p>
                </div>
                <div className="bg-white/10 rounded-lg p-2">
                  <p className="text-xs text-purple-300">Image Extraction</p>
                  <p className="text-sm text-white font-medium">Automatic</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Package className="text-blue-400" size={24} />
              <h3 className="text-white font-semibold">Total Suppliers</h3>
            </div>
            <p className="text-3xl font-bold text-white">{suppliersWithWebsites.length}</p>
            <p className="text-gray-400 text-sm mt-1">With websites configured</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="text-green-400" size={24} />
              <h3 className="text-white font-semibold">Auto-Imported</h3>
            </div>
            <p className="text-3xl font-bold text-white">
              {Object.values(stats).reduce((sum, s) => sum + (s.autoImportedCount || 0), 0)}
            </p>
            <p className="text-gray-400 text-sm mt-1">Products automatically imported</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="text-purple-400" size={24} />
              <h3 className="text-white font-semibold">AI Enhanced</h3>
            </div>
            <p className="text-3xl font-bold text-white">100%</p>
            <p className="text-gray-400 text-sm mt-1">Products with AI descriptions</p>
          </div>
        </div>

        {/* Suppliers Table */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white">Suppliers with Websites</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Website
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Auto-Imported
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {suppliersWithWebsites.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-white font-medium">{supplier.business_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a
                        href={supplier.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm underline"
                      >
                        {supplier.website}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-white font-bold text-lg">
                        {stats[supplier.id]?.autoImportedCount || 0}
                      </div>
                      <div className="text-gray-400 text-xs">products</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          supplier.integration_status === 'complete'
                            ? 'bg-green-500/20 text-green-300'
                            : supplier.integration_status === 'in_progress'
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : 'bg-gray-500/20 text-gray-300'
                        }`}
                      >
                        {supplier.integration_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => triggerImport(supplier.id)}
                        disabled={importing === supplier.id}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg text-sm font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                      >
                        {importing === supplier.id ? (
                          <>
                            <Loader className="animate-spin" size={16} />
                            Importing...
                          </>
                        ) : (
                          <>
                            <Download size={16} />
                            Import Now
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {suppliersWithWebsites.length === 0 && (
            <div className="px-6 py-12 text-center">
              <Package className="mx-auto text-gray-600 mb-3" size={48} />
              <p className="text-gray-400">No suppliers with websites configured yet.</p>
              <p className="text-gray-500 text-sm mt-1">
                Suppliers need to provide a website URL during registration.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
