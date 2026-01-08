'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Zap, CheckCircle, XCircle, Clock, RefreshCw, TrendingUp } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'complete' | 'failed';
  integratedAt?: string;
  error?: string;
  brandAnalysis?: {
    tone: string;
    personality: string;
    recommendedHalls: string[];
    recommendedStreets: string[];
  };
}

interface Job {
  id: string;
  job_type: string;
  entity_id: string;
  status: string;
  priority: string;
  scheduled_for: string;
  started_at?: string;
  completed_at?: string;
  last_error?: string;
  attempts: number;
  max_attempts: number;
}

interface JobStats {
  pending: number;
  inProgress: number;
  completed: number;
  failed: number;
  total: number;
}

export default function IntegrationDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<JobStats>({ pending: 0, inProgress: 0, completed: 0, failed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, [filter]);

  async function fetchJobs() {
    try {
      const response = await fetch(`/api/integration/jobs?status=${filter}`);
      const data = await response.json();
      setJobs(data.jobs || []);
      setStats(data.stats || { pending: 0, inProgress: 0, completed: 0, failed: 0, total: 0 });
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function retryJob(jobId: string) {
    try {
      await fetch('/api/integration/jobs/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId })
      });
      fetchJobs();
    } catch (error) {
      console.error('Error retrying job:', error);
    }
  }

  async function retryAllFailed() {
    const failedIds = jobs.filter(j => j.status === 'failed').map(j => j.id);
    if (failedIds.length === 0) return;
    
    try {
      await fetch('/api/integration/jobs/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobIds: failedIds })
      });
      fetchJobs();
    } catch (error) {
      console.error('Error retrying jobs:', error);
    }
  }

  const jobTypeLabels: Record<string, string> = {
    'supplier_integration': '🏪 Supplier Integration',
    'product_placement': '📍 Product Placement',
    'product_content_generation': '✍️ Content Generation',
    'seo_generation': '🔍 SEO Generation',
    'social_content': '📱 Social Content',
    'description_optimization': '📝 Description Optimization',
    'bundle_creation': '📦 Bundle Creation'
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: any }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', icon: RefreshCw },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      failed: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle }
    };

    const style = styles[status] || styles.pending;
    const Icon = style.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <Icon className={`w-3 h-3 ${status === 'in_progress' ? 'animate-spin' : ''}`} />
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Auto-Integration System</h1>
          </div>
          <p className="text-gray-600">
            Real-time monitoring of AI City's automatic supplier integration pipeline
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <Clock className="w-4 h-4" />
              Pending
            </div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <RefreshCw className="w-4 h-4 animate-spin" />
              In Progress
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <CheckCircle className="w-4 h-4" />
              Completed
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <XCircle className="w-4 h-4" />
              Failed
            </div>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            {stats.failed > 0 && (
              <button
                onClick={retryAllFailed}
                className="text-xs text-red-600 hover:underline mt-1"
              >
                Retry all
              </button>
            )}
          </div>

          <div className="bg-white rounded-lg p-4 shadow">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
              <TrendingUp className="w-4 h-4" />
              Total Jobs
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'in_progress', 'completed', 'failed'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === status
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Jobs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Integration Jobs</h2>
            <button
              onClick={fetchJobs}
              className="flex items-center gap-2 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
              Loading jobs...
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Sparkles className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              No jobs found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Job Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Entity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Scheduled
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Attempts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jobs.map(job => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">
                        {jobTypeLabels[job.job_type] || job.job_type}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                        {job.entity_id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(job.status)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-medium ${
                          job.priority === 'urgent' ? 'text-red-600' :
                          job.priority === 'high' ? 'text-orange-600' :
                          job.priority === 'normal' ? 'text-gray-600' :
                          'text-gray-400'
                        }`}>
                          {job.priority.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(job.scheduled_for).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {job.attempts} / {job.max_attempts}
                      </td>
                      <td className="px-6 py-4">
                        {job.status === 'failed' && (
                          <button
                            onClick={() => retryJob(job.id)}
                            className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                          >
                            Retry
                          </button>
                        )}
                        {job.last_error && (
                          <button
                            onClick={() => alert(job.last_error)}
                            className="text-sm text-red-600 hover:text-red-800 font-medium ml-2"
                          >
                            View Error
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Panel */}
        <div className="mt-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
          <div className="flex items-start gap-4">
            <Sparkles className="w-8 h-8 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold mb-2">How Auto-Integration Works</h3>
              <ul className="space-y-2 text-purple-100">
                <li>✨ <strong>AI Spirits</strong> learn the supplier's brand voice and personality</li>
                <li>📍 <strong>World Renderer</strong> automatically places products in the right streets and districts</li>
                <li>📊 <strong>Analytics</strong> start tracking performance immediately</li>
                <li>🤖 <strong>Autonomous Jobs</strong> generate SEO, descriptions, and optimize pricing</li>
                <li>🎨 <strong>Content Generation</strong> creates social media and marketing materials</li>
                <li>📦 <strong>Bundling Engine</strong> includes products in themed collections</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
