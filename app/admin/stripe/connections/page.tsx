'use client';

import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';

interface SupplierConnection {
  id: string;
  business_name: string;
  email: string;
  website?: string;
  stripe_account_id?: string;
  stripe_connected_at?: string;
  total_revenue: number;
  pending_payouts: number;
}

export default function StripeConnectionsAdmin() {
  const [suppliers, setSuppliers] = useState<SupplierConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    connected: 0,
    pending: 0,
    connectionRate: 0,
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/admin/stripe/connections');
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data.suppliers);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch suppliers:', error);
    } finally {
      setLoading(false);
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
          <div className="flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-green-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">Stripe Connections</h1>
              <p className="text-gray-300 mt-1">Monitor supplier payment account connections</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Total Suppliers</p>
                <p className="text-white text-3xl font-bold mt-2">{stats.total}</p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <CreditCard className="w-6 h-6 text-purple-300" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Connected</p>
                <p className="text-green-400 text-3xl font-bold mt-2">{stats.connected}</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-300" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Pending</p>
                <p className="text-yellow-400 text-3xl font-bold mt-2">{stats.pending}</p>
              </div>
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-300" />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Connection Rate</p>
                <p className="text-blue-400 text-3xl font-bold mt-2">{stats.connectionRate}%</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-blue-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mb-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">💳</div>
            <div className="flex-1">
              <h3 className="text-green-100 font-semibold text-lg mb-2">Stripe Connect Integration</h3>
              <p className="text-green-200 text-sm mb-3">
                Suppliers connect their Stripe accounts via OAuth for automatic payouts. Connected suppliers can receive 
                payments within 2-3 business days after order completion.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-xs text-green-300">Setup Time</p>
                  <p className="text-sm text-white font-medium">2-5 minutes</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-xs text-green-300">Payout Speed</p>
                  <p className="text-sm text-white font-medium">2-3 business days</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-xs text-green-300">Account Type</p>
                  <p className="text-sm text-white font-medium">Standard</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-xs text-green-300">Platform Fee</p>
                  <p className="text-sm text-white font-medium">5%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Suppliers Table */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/30">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Stripe Account
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Connected Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-white font-medium">{supplier.business_name}</span>
                        {supplier.website && (
                          <a
                            href={supplier.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-purple-300 hover:text-purple-200 flex items-center gap-1 mt-1"
                          >
                            {supplier.website.replace(/^https?:\/\//, '')}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300 text-sm">{supplier.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      {supplier.stripe_account_id ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/50">
                          <CheckCircle className="w-3 h-3" />
                          Connected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/50">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {supplier.stripe_account_id ? (
                        <span className="text-gray-300 text-xs font-mono">
                          {supplier.stripe_account_id}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-xs">Not connected</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {supplier.stripe_connected_at ? (
                        <span className="text-gray-300 text-sm">
                          {new Date(supplier.stripe_connected_at).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-white font-medium">
                          ${supplier.total_revenue.toLocaleString()}
                        </span>
                        {supplier.pending_payouts > 0 && (
                          <span className="text-xs text-yellow-300">
                            ${supplier.pending_payouts.toLocaleString()} pending
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {supplier.stripe_account_id ? (
                        <a
                          href={`https://dashboard.stripe.com/connect/accounts/${supplier.stripe_account_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center gap-1"
                        >
                          View in Stripe
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <button
                          className="text-green-400 hover:text-green-300 text-sm font-medium"
                          onClick={() => alert(`Send connection reminder to ${supplier.email}`)}
                        >
                          Send Reminder
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {suppliers.length === 0 && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 p-12 text-center">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No suppliers yet</h3>
            <p className="text-gray-400">
              Suppliers will appear here once they register and connect their Stripe accounts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
