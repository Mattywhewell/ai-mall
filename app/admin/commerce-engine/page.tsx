'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Target,
  Zap,
  Package
} from 'lucide-react';

interface CommerceStats {
  total_evaluated: number;
  imported: number;
  rejected: number;
  avg_score: number;
  total_profit_potential: number;
  recent_evaluations: any[];
}

interface EngineResult {
  total_products: number;
  imported_high_priority: number;
  imported_low_priority: number;
  imported_for_bundles: number;
  rejected: number;
  total_profit_potential: number;
  avg_score: number;
  products: any[];
}

export default function CommerceEngineDashboard() {
  const [stats, setStats] = useState<CommerceStats>({
    total_evaluated: 0,
    imported: 0,
    rejected: 0,
    avg_score: 0,
    total_profit_potential: 0,
    recent_evaluations: [],
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<EngineResult | null>(null);
  const [dryRun, setDryRun] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/commerce-engine');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const runEngine = async () => {
    if (!confirm(`Run AI Commerce Engine in ${dryRun ? 'DRY RUN' : 'LIVE'} mode?`)) {
      return;
    }

    setProcessing(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/commerce-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data.result);
        await fetchStats(); // Refresh stats
        alert(`✅ Engine completed! Processed ${data.result.total_products} products.`);
      } else {
        const error = await res.json();
        alert(`❌ Engine failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Engine error:', error);
      alert('❌ Engine failed. Check console for details.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-yellow-400" />
              <div>
                <h1 className="text-3xl font-bold text-white">AI Commerce Engine</h1>
                <p className="text-gray-300 mt-1">Automated product scoring & import decisions</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-white">
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm">Dry Run (score only)</span>
              </label>
              <button
                onClick={runEngine}
                disabled={processing}
                className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-yellow-700 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center gap-2"
              >
                {processing ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Run Engine
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="mb-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🤖</div>
            <div className="flex-1">
              <h3 className="text-yellow-100 font-semibold text-lg mb-2">5-Pillar Scoring System</h3>
              <p className="text-yellow-200 text-sm mb-3">
                Every product is evaluated across 5 pillars with weighted scores to ensure only profitable, 
                high-demand, low-risk, on-brand products enter the marketplace.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-xs text-yellow-300">Profitability</p>
                  <p className="text-sm text-white font-medium">35% weight</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-xs text-yellow-300">Demand</p>
                  <p className="text-sm text-white font-medium">25% weight</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-xs text-yellow-300">Competition</p>
                  <p className="text-sm text-white font-medium">15% weight</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-xs text-yellow-300">Supplier Quality</p>
                  <p className="text-sm text-white font-medium">15% weight</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-xs text-yellow-300">Strategic Fit</p>
                  <p className="text-sm text-white font-medium">10% weight</p>
                </div>
              </div>
              <div className="mt-3 text-xs text-yellow-300 space-y-1">
                <p>✅ Score ≥80: Import (high priority)</p>
                <p>✅ Score 70-79: Import (low priority)</p>
                <p>🎁 Score 60-69: Import for bundles only</p>
                <p>❌ Score &lt;60: Reject</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Evaluated</p>
                <p className="text-white text-3xl font-bold mt-2">{stats.total_evaluated}</p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Package className="w-6 h-6 text-purple-300" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Imported</p>
                <p className="text-green-400 text-3xl font-bold mt-2">{stats.imported}</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-300" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Rejected</p>
                <p className="text-red-400 text-3xl font-bold mt-2">{stats.rejected}</p>
              </div>
              <div className="p-3 bg-red-500/20 rounded-lg">
                <XCircle className="w-6 h-6 text-red-300" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Avg Score</p>
                <p className="text-blue-400 text-3xl font-bold mt-2">{stats.avg_score}</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Target className="w-6 h-6 text-blue-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Latest Run Results */}
        {result && (
          <div className="mb-8 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Latest Run Results</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
              <div className="bg-black/20 rounded-lg p-3">
                <p className="text-xs text-gray-300">Total Processed</p>
                <p className="text-2xl font-bold text-white">{result.total_products}</p>
              </div>
              <div className="bg-green-500/20 rounded-lg p-3">
                <p className="text-xs text-green-300">High Priority</p>
                <p className="text-2xl font-bold text-green-400">{result.imported_high_priority}</p>
              </div>
              <div className="bg-blue-500/20 rounded-lg p-3">
                <p className="text-xs text-blue-300">Low Priority</p>
                <p className="text-2xl font-bold text-blue-400">{result.imported_low_priority}</p>
              </div>
              <div className="bg-purple-500/20 rounded-lg p-3">
                <p className="text-xs text-purple-300">For Bundles</p>
                <p className="text-2xl font-bold text-purple-400">{result.imported_for_bundles}</p>
              </div>
              <div className="bg-red-500/20 rounded-lg p-3">
                <p className="text-xs text-red-300">Rejected</p>
                <p className="text-2xl font-bold text-red-400">{result.rejected}</p>
              </div>
              <div className="bg-yellow-500/20 rounded-lg p-3">
                <p className="text-xs text-yellow-300">Profit Potential</p>
                <p className="text-xl font-bold text-yellow-400">${result.total_profit_potential.toLocaleString()}</p>
              </div>
            </div>
            
            {/* Product Details */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-black/30">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-300">Product</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-300">Score</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-300">💰</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-300">📈</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-300">🏆</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-300">✅</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-300">🎯</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-300">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {result.products.slice(0, 10).map((product, idx) => (
                    <tr key={idx} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-white">{product.product_title}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-bold ${
                          product.final_score >= 80 ? 'text-green-400' :
                          product.final_score >= 70 ? 'text-blue-400' :
                          product.final_score >= 60 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {product.final_score}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-300">{product.profitability_score}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{product.demand_score}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{product.competition_score}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{product.supplier_quality_score}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{product.strategic_fit_score}</td>
                      <td className="px-4 py-3">
                        {product.import_decision === 'import_high_priority' && (
                          <span className="text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded">High Priority</span>
                        )}
                        {product.import_decision === 'import_low_priority' && (
                          <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">Low Priority</span>
                        )}
                        {product.import_decision === 'import_for_bundles' && (
                          <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded">Bundles</span>
                        )}
                        {product.import_decision === 'reject' && (
                          <span className="text-xs px-2 py-1 bg-red-500/20 text-red-300 rounded">Reject</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recent Evaluations */}
        {stats.recent_evaluations && stats.recent_evaluations.length > 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
            <div className="px-6 py-4 bg-black/30">
              <h3 className="text-xl font-semibold text-white">Recent Evaluations</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black/20">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase">Product</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-300 uppercase">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase">Decision</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-300 uppercase">Evaluated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {stats.recent_evaluations.map((evaluation) => (
                    <tr key={evaluation.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 text-white">{evaluation.name}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`font-bold ${
                          evaluation.score >= 80 ? 'text-green-400' :
                          evaluation.score >= 70 ? 'text-blue-400' :
                          evaluation.score >= 60 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {evaluation.score}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {evaluation.decision === 'import_high_priority' && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-500/20 text-green-300 rounded">
                            <CheckCircle className="w-3 h-3" />
                            High Priority
                          </span>
                        )}
                        {evaluation.decision === 'import_low_priority' && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                            <CheckCircle className="w-3 h-3" />
                            Low Priority
                          </span>
                        )}
                        {evaluation.decision === 'import_for_bundles' && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded">
                            <Package className="w-3 h-3" />
                            Bundles
                          </span>
                        )}
                        {evaluation.decision === 'reject' && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-red-500/20 text-red-300 rounded">
                            <XCircle className="w-3 h-3" />
                            Reject
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-300 text-sm">
                        {new Date(evaluation.scored_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
