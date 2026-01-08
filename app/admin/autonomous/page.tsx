/**
 * Autonomous Systems Dashboard
 * Real-time monitoring and control of AI systems
 */

'use client';

import { useState, useEffect } from 'react';
import { Activity, Brain, TrendingUp, Zap, AlertCircle, CheckCircle, Clock, BarChart3 } from 'lucide-react';

interface SystemStatus {
  core: { isRunning: boolean; learningCycleActive: boolean };
  runner: { isRunning: boolean; activeJobs: number; uptime: number };
  insights: any[];
}

export default function AutonomousDashboard() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/autonomous');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setStatus(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (action: string) => {
    try {
      const res = await fetch('/api/autonomous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      alert(data.message || 'Action completed');
      fetchStatus();
    } catch (error) {
      alert('Action failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading autonomous systems...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            <Brain className="w-10 h-10 text-indigo-600" />
            Autonomous Intelligence Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Self-evolving AI systems monitoring and control
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatusCard
            title="Core System"
            value={status?.core.isRunning ? 'Active' : 'Inactive'}
            icon={<Brain className="w-6 h-6" />}
            status={status?.core.isRunning ? 'success' : 'error'}
          />
          <StatusCard
            title="Job Runner"
            value={status?.runner.isRunning ? 'Running' : 'Stopped'}
            icon={<Zap className="w-6 h-6" />}
            status={status?.runner.isRunning ? 'success' : 'warning'}
          />
          <StatusCard
            title="Active Jobs"
            value={status?.runner.activeJobs || 0}
            icon={<Activity className="w-6 h-6" />}
            status="info"
          />
          <StatusCard
            title="Insights"
            value={status?.insights?.length || 0}
            icon={<TrendingUp className="w-6 h-6" />}
            status="info"
          />
        </div>

        {/* Control Panel */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Control Panel</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => handleAction('start')}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Start Systems
            </button>
            <button
              onClick={() => handleAction('stop')}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
            >
              <AlertCircle className="w-5 h-5" />
              Stop Systems
            </button>
            <button
              onClick={() => handleAction('optimize')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
            >
              <Zap className="w-5 h-5" />
              Run Optimization
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>

        {/* Recent Insights */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            Recent Insights
          </h2>
          {status?.insights && status.insights.length > 0 ? (
            <div className="space-y-4">
              {status.insights.map((insight: any, index: number) => (
                <InsightCard key={index} insight={insight} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No insights yet. Systems are learning...</p>
          )}
        </div>

        {/* System Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <ModuleCard
            title="Product Intelligence"
            description="Autonomous product optimization based on performance"
            endpoint="/api/autonomous/products"
          />
          <ModuleCard
            title="District Evolution"
            description="Self-adapting district themes and personalities"
            endpoint="/api/autonomous/districts"
          />
          <ModuleCard
            title="Self-Healing"
            description="Automatic detection and repair of system issues"
            endpoint="/api/autonomous/health"
          />
          <ModuleCard
            title="Social Media Engine"
            description="Automated content generation and scheduling"
            endpoint="/api/autonomous/social"
          />
          <ModuleCard
            title="AI Analytics"
            description="Natural language insights and narratives"
            endpoint="/api/autonomous/analytics"
          />
          <ModuleCard
            title="Personalization"
            description="User-specific experience adaptation"
            endpoint="/api/autonomous/personalize"
          />
        </div>
      </div>
    </div>
  );
}

function StatusCard({ title, value, icon, status }: any) {
  const statusColors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div className={`${statusColors[status]} border-2 rounded-lg p-6`}>
      <div className="flex items-center justify-between mb-2">
        <div className="opacity-70">{icon}</div>
      </div>
      <h3 className="text-sm font-medium opacity-70 mb-1">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function InsightCard({ insight }: any) {
  const typeIcons: any = {
    trend: <TrendingUp className="w-5 h-5 text-blue-600" />,
    anomaly: <AlertCircle className="w-5 h-5 text-red-600" />,
    opportunity: <Zap className="w-5 h-5 text-yellow-600" />,
    warning: <AlertCircle className="w-5 h-5 text-orange-600" />,
    achievement: <CheckCircle className="w-5 h-5 text-green-600" />,
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
      <div className="flex items-start gap-3">
        <div className="mt-1">{typeIcons[insight.type]}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{insight.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
          {insight.confidence && (
            <div className="mt-2">
              <span className="text-xs text-gray-500">
                Confidence: {(insight.confidence * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ModuleCard({ title, description, endpoint }: any) {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-indigo-600 hover:shadow-lg transition">
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      <a
        href={endpoint}
        target="_blank"
        rel="noopener noreferrer"
        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium inline-flex items-center gap-1"
      >
        View API
        <BarChart3 className="w-4 h-4" />
      </a>
    </div>
  );
}
