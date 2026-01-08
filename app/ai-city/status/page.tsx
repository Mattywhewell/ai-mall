'use client';

import { useEffect, useState } from 'react';
import { Activity, Zap, Database, Clock, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface SystemStatus {
  status: string;
  mode: string;
  systems: {
    openAI: {
      enabled: boolean;
      status: string;
      features: string[];
    };
    backgroundJobs: {
      enabled: boolean;
      status: string;
      jobs: Array<{ name: string; schedule: string; path: string }>;
    };
    database: {
      enabled: boolean;
      status: string;
    };
    analytics: {
      enabled: boolean;
      recentActivity: boolean;
    };
  };
  instructions?: {
    toEnableAI: string[];
  };
  timestamp: string;
}

export default function AICityStatusDashboard() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const response = await fetch('/api/ai-city/status');
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        console.error('Failed to fetch status:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading system status...</div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Failed to load status</div>
      </div>
    );
  }

  const StatusBadge = ({ enabled }: { enabled: boolean }) => (
    enabled ? (
      <CheckCircle className="text-green-400" size={20} />
    ) : (
      <AlertCircle className="text-yellow-400" size={20} />
    )
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-black mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text">
            🌆 AI City Systems
          </h1>
          <p className="text-xl text-purple-200">
            Current Mode: <span className="font-bold text-white uppercase">{status.mode}</span>
          </p>
          <p className="text-sm text-purple-300">
            Last updated: {new Date(status.timestamp).toLocaleString()}
          </p>
        </div>

        {/* System Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* OpenAI System */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Zap className="text-yellow-400" size={24} />
                <h2 className="text-2xl font-bold">OpenAI System</h2>
              </div>
              <StatusBadge enabled={status.systems.openAI.enabled} />
            </div>
            <p className="text-purple-300 mb-4">{status.systems.openAI.status}</p>
            <div className="space-y-2">
              <p className="text-sm text-purple-200 font-semibold">Features:</p>
              {status.systems.openAI.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-purple-100">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Background Jobs */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Clock className="text-blue-400" size={24} />
                <h2 className="text-2xl font-bold">Background Jobs</h2>
              </div>
              <StatusBadge enabled={status.systems.backgroundJobs.enabled} />
            </div>
            <p className="text-purple-300 mb-4">{status.systems.backgroundJobs.status}</p>
            <div className="space-y-2">
              {status.systems.backgroundJobs.jobs.map((job, idx) => (
                <div key={idx} className="text-sm bg-white/5 rounded p-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-white">{job.name}</span>
                    <span className="text-purple-300">{job.schedule}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Database */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Database className="text-green-400" size={24} />
                <h2 className="text-2xl font-bold">Database</h2>
              </div>
              <StatusBadge enabled={status.systems.database.enabled} />
            </div>
            <p className="text-purple-300 mb-4">{status.systems.database.status}</p>
            <div className="text-sm text-purple-100">
              ✓ All world architecture tables ready
            </div>
          </div>

          {/* Analytics */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Activity className="text-pink-400" size={24} />
                <h2 className="text-2xl font-bold">Analytics</h2>
              </div>
              <StatusBadge enabled={status.systems.analytics.enabled} />
            </div>
            <p className="text-purple-300 mb-4">
              {status.systems.analytics.recentActivity ? 'Recent activity detected' : 'No recent activity'}
            </p>
            <div className="text-sm text-purple-100">
              Tracking: Views, Engagement, Navigation
            </div>
          </div>
        </div>

        {/* Instructions if AI not enabled */}
        {status.instructions && (
          <div className="bg-blue-500/10 backdrop-blur-xl rounded-2xl p-6 border border-blue-400/20">
            <div className="flex items-start gap-3">
              <Info className="text-blue-400 flex-shrink-0 mt-1" size={24} />
              <div>
                <h3 className="text-xl font-bold mb-3">Enable Dynamic AI Features</h3>
                <ol className="space-y-2">
                  {status.instructions.toEnableAI.map((instruction, idx) => (
                    <li key={idx} className="text-purple-100">
                      {idx + 1}. {instruction}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="mt-8 flex gap-4">
          <a
            href="/city"
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full font-bold hover:scale-105 transition-transform"
          >
            Go to City
          </a>
          <a
            href="/admin/autonomous"
            className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-full font-bold hover:bg-white/20 transition-all border border-white/20"
          >
            Admin Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
