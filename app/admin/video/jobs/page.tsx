'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Play, Database } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

export default function AdminVideoJobsPage() {
  const { session, user, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [startedAfter, setStartedAfter] = useState<string | null>(null);
  const [startedBefore, setStartedBefore] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  // Debounced search: when searchTerm changes, reset page and refetch
  useEffect(() => {
    const id = setTimeout(() => {
      setPage(1);
      fetchLogs();
    }, 350);
    return () => clearTimeout(id);
  }, [searchTerm]);

  useEffect(() => {
    fetchLogs();
  }, [page, perPage, statusFilter, startedAfter, startedBefore]);

  const buildQuery = () => {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('per_page', String(perPage));
    if (statusFilter) params.set('status', statusFilter);
    if (startedAfter) params.set('started_after', new Date(startedAfter).toISOString());
    if (startedBefore) params.set('started_before', new Date(startedBefore).toISOString());
    if (searchTerm) params.set('q', searchTerm);
    return params.toString();
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const q = buildQuery();
      const res = await fetch(`/api/admin/video/jobs?${q}`);
      const data = await res.json();
      if (data.logs) setLogs(data.logs);
      if (data.total !== undefined) setTotal(data.total);
    } catch (e) {
      console.error('Failed fetching logs', e);
    } finally {
      setLoading(false);
    }
  };

  const runNow = async () => {
    // Require signed-in user; server will verify admin role
    if (!session) {
      alert('Please sign in as an admin to run the scheduler');
      return;
    }

    setRunning(true);
    try {
      const res = await fetch('/api/admin/video/run', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${session.access_token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        alert('Scheduler run triggered');
        fetchLogs();
      } else {
        alert('Failed to trigger run: ' + (data.error || 'unknown'));
      }
    } catch (e) {
      console.error('Run failed', e);
      alert('Run failed');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Video Scheduler Jobs</h1>
        <div className="flex items-center space-x-2">
          <button onClick={runNow} disabled={running || authLoading} className="px-3 py-2 bg-blue-600 text-white rounded flex items-center space-x-2">
            <Play className="w-4 h-4" />
            <span>{running ? 'Running...' : 'Run Now'}</span>
          </button>
          <button onClick={fetchLogs} disabled={loading} className="px-3 py-2 bg-gray-100 rounded flex items-center space-x-2">
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>

          <input placeholder="Search logs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="px-2 py-2 border rounded w-64" />

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-2 py-2 border rounded">
            <option value="">All status</option>
            <option value="running">running</option>
            <option value="completed">completed</option>
            <option value="failed">failed</option>
          </select>

          <input type="datetime-local" onChange={(e) => setStartedAfter(e.target.value || null)} className="px-2 py-2 border rounded" />
          <input type="datetime-local" onChange={(e) => setStartedBefore(e.target.value || null)} className="px-2 py-2 border rounded" />

          <select value={perPage} onChange={(e) => setPerPage(parseInt(e.target.value, 10))} className="px-2 py-2 border rounded">
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>

          <button onClick={() => {
            const q = buildQuery();
            window.location.href = `/api/admin/video/jobs?${q}&export=csv`;
          }} className="px-3 py-2 bg-green-600 text-white rounded">Export CSV</button>

          <table className="w-full mt-4 border">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">Job</th>
                <th className="text-left px-3 py-2">Started</th>
                <th className="text-left px-3 py-2">Finished</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Activated</th>
                <th className="text-left px-3 py-2">Deactivated</th>
                <th className="text-left px-3 py-2">Error</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-500">No logs found</td></tr>
              )}
              {logs.map((l) => (
                <tr key={l.id} className="border-t cursor-pointer" onClick={() => setSelectedLog(l)}>
                  <td className="px-3 py-2 font-medium">{l.job_name}</td>
                  <td className="px-3 py-2">{new Date(l.started_at).toLocaleString()}</td>
                  <td className="px-3 py-2">{l.finished_at ? new Date(l.finished_at).toLocaleString() : '—'}</td>
                  <td className="px-3 py-2">{l.status}</td>
                  <td className="px-3 py-2">{l.activated_count}</td>
                  <td className="px-3 py-2">{l.deactivated_count}</td>
                  <td className="px-3 py-2 text-xs text-red-600">{l.error_message || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Details modal */}
          {selectedLog && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded shadow-lg w-11/12 max-w-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold">Job details</h2>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => { navigator.clipboard?.writeText(JSON.stringify(selectedLog, null, 2)); }} className="px-3 py-1 border rounded text-sm">Copy JSON</button>
                    <button onClick={() => setSelectedLog(null)} className="px-3 py-1 border rounded text-sm">Close</button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div><strong>Name:</strong> {selectedLog.job_name}</div>
                  <div><strong>Status:</strong> {selectedLog.status}</div>
                  <div><strong>Started:</strong> {new Date(selectedLog.started_at).toLocaleString()}</div>
                  <div><strong>Finished:</strong> {selectedLog.finished_at ? new Date(selectedLog.finished_at).toLocaleString() : '—'}</div>
                  <div><strong>Activated:</strong> {selectedLog.activated_count}</div>
                  <div><strong>Deactivated:</strong> {selectedLog.deactivated_count}</div>
                  <div><strong>Error:</strong> <pre className="whitespace-pre-wrap text-sm text-red-600">{selectedLog.error_message || '—'}</pre></div>
                  <div><strong>Metadata (JSON):</strong>
                    <pre className="bg-gray-100 p-3 rounded text-sm max-h-64 overflow-auto">{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
