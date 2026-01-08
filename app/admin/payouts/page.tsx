/**
 * Admin Payouts Dashboard
 * Manage supplier payouts across all payout methods
 */

'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Download } from 'lucide-react';

interface Payout {
  id: string;
  supplier_id: string;
  payout_method: 'instant' | 'weekly' | 'monthly';
  amount: number;
  commission_amount: number;
  net_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  period_start: string;
  period_end: string;
  order_count: number;
  stripe_transfer_id?: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
  suppliers: {
    business_name: string;
    payout_email: string;
  };
}

interface Summary {
  totalSuppliers: number;
  pendingPayouts: number;
  pendingAmount: number;
  completedThisMonth: number;
  completedAmountThisMonth: number;
  failedPayouts: number;
}

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('');
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  useEffect(() => {
    fetchPayouts();
  }, [filterStatus, filterMethod]);

  const fetchPayouts = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterMethod) params.append('method', filterMethod);

      const res = await fetch(`/api/admin/payouts?${params}`);
      if (res.ok) {
        const data = await res.json();
        setPayouts(data.payouts);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch payouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteManual = async (payoutId: string) => {
    const notes = prompt('Enter admin notes (optional):');
    setProcessingAction(payoutId);

    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete_manual',
          payoutId,
          adminNotes: notes,
        }),
      });

      if (res.ok) {
        alert('Payout marked as completed');
        fetchPayouts();
      }
    } catch (error) {
      alert('Failed to complete payout');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleTriggerPayout = async (supplierId: string) => {
    if (!confirm('Trigger payout for this supplier now?')) return;
    setProcessingAction(supplierId);

    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'trigger_payout',
          supplierId,
        }),
      });

      const result = await res.json();
      if (result.success) {
        alert('Payout triggered successfully');
        fetchPayouts();
      } else {
        alert(`Payout failed: ${result.result?.error}`);
      }
    } catch (error) {
      alert('Failed to trigger payout');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleCancelPayout = async (payoutId: string) => {
    const notes = prompt('Enter cancellation reason:');
    if (!notes) return;
    setProcessingAction(payoutId);

    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel_payout',
          payoutId,
          adminNotes: notes,
        }),
      });

      if (res.ok) {
        alert('Payout cancelled');
        fetchPayouts();
      }
    } catch (error) {
      alert('Failed to cancel payout');
    } finally {
      setProcessingAction(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
      processing: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
      completed: 'bg-green-500/20 text-green-300 border-green-500/50',
      failed: 'bg-red-500/20 text-red-300 border-red-500/50',
      cancelled: 'bg-gray-500/20 text-gray-300 border-gray-500/50',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getMethodBadge = (method: string) => {
    const styles = {
      instant: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
      weekly: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
      monthly: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
    };
    return styles[method as keyof typeof styles] || styles.monthly;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-white mx-auto mb-4"></div>
          <p>Loading payouts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Supplier Payouts</h1>
              <p className="text-gray-300 mt-2">Manage instant, weekly, and monthly payouts</p>
            </div>
            <button
              onClick={fetchPayouts}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <RefreshCw size={20} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <p className="text-gray-400 text-xs mb-1">Total Suppliers</p>
              <p className="text-2xl font-bold text-white">{summary.totalSuppliers}</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <p className="text-yellow-400 text-xs mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-300">{summary.pendingPayouts}</p>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <p className="text-yellow-400 text-xs mb-1">Pending Amount</p>
              <p className="text-xl font-bold text-yellow-300">${summary.pendingAmount.toLocaleString()}</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <p className="text-green-400 text-xs mb-1">This Month</p>
              <p className="text-2xl font-bold text-green-300">{summary.completedThisMonth}</p>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
              <p className="text-green-400 text-xs mb-1">Paid This Month</p>
              <p className="text-xl font-bold text-green-300">${summary.completedAmountThisMonth.toLocaleString()}</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <p className="text-red-400 text-xs mb-1">Failed</p>
              <p className="text-2xl font-bold text-red-300">{summary.failedPayouts}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Method</label>
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Methods</option>
                <option value="instant">Instant</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payouts List */}
        {payouts.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-12 text-center">
            <DollarSign className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-white mb-2">No payouts found</h3>
            <p className="text-gray-400">Payouts will appear here when suppliers have eligible earnings</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payouts.map((payout) => (
              <div
                key={payout.id}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">
                          {payout.suppliers.business_name}
                        </h3>
                        <p className="text-gray-400 text-sm">{payout.suppliers.payout_email}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getMethodBadge(payout.payout_method)}`}>
                          {payout.payout_method}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(payout.status)}`}>
                          {payout.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Net Amount</p>
                        <p className="text-white font-semibold text-lg">${payout.net_amount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Gross / Commission</p>
                        <p className="text-white text-sm">${payout.amount.toFixed(2)} / ${payout.commission_amount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Orders</p>
                        <p className="text-white text-sm">{payout.order_count}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs mb-1">Period</p>
                        <p className="text-white text-sm">
                          {new Date(payout.period_start).toLocaleDateString()} - {new Date(payout.period_end).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {payout.stripe_transfer_id && (
                      <p className="text-gray-400 text-xs mt-2">Stripe: {payout.stripe_transfer_id}</p>
                    )}
                    {payout.error_message && (
                      <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                        <AlertCircle size={14} />
                        {payout.error_message}
                      </p>
                    )}
                  </div>

                  <div className="flex lg:flex-col gap-2">
                    {payout.status === 'pending' && payout.payout_method !== 'instant' && (
                      <button
                        onClick={() => handleCompleteManual(payout.id)}
                        disabled={processingAction === payout.id}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm disabled:opacity-50"
                      >
                        Mark Complete
                      </button>
                    )}
                    {payout.status === 'failed' && (
                      <button
                        onClick={() => handleTriggerPayout(payout.supplier_id)}
                        disabled={processingAction === payout.supplier_id}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm disabled:opacity-50"
                      >
                        Retry
                      </button>
                    )}
                    {['pending', 'processing'].includes(payout.status) && (
                      <button
                        onClick={() => handleCancelPayout(payout.id)}
                        disabled={processingAction === payout.id}
                        className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors text-sm disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
