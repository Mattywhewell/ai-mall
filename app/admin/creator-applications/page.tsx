'use client';

import { useState, useEffect } from 'react';

interface Application {
  id: string;
  user_id: string;
  brand_name: string;
  brand_story: string;
  category: string;
  portfolio_urls: string[];
  social_links: Record<string, string>;
  experience_level: string;
  requested_hall: string;
  requested_street: string;
  application_status: string;
  reviewed_by: string | null;
  reviewer_notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

export default function CreatorApplicationsAdmin() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [stats, setStats] = useState({
    pending: 0,
    reviewing: 0,
    approved: 0,
    rejected: 0,
    waitlisted: 0
  });

  useEffect(() => {
    fetchApplications();
  }, [selectedStatus]);

  const fetchApplications = async () => {
    try {
      const response = await fetch(`/api/admin/creator-applications?status=${selectedStatus}`);
      const result = await response.json();
      
      if (result.success) {
        setApplications(result.applications);
        setStats(result.stats);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (status: string) => {
    if (!selectedApp) return;

    try {
      const response = await fetch('/api/admin/creator-applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: selectedApp.id,
          application_status: status,
          reviewer_notes: reviewNotes,
          reviewed_by: 'admin' // TODO: Get from auth context
        })
      });

      const result = await response.json();

      if (result.success) {
        setSelectedApp(null);
        setReviewNotes('');
        fetchApplications();
        alert(`Application ${status}!`);
      }
    } catch (error) {
      console.error('Failed to update application:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Creator Applications</h1>
          <p className="text-gray-600 mt-2">Review and approve new creator applications</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {Object.entries(stats).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`p-4 rounded-lg text-center transition-all ${
                selectedStatus === status
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-900 hover:shadow-md'
              }`}
            >
              <div className="text-3xl font-bold">{count}</div>
              <div className="text-sm uppercase tracking-wide mt-1">{status}</div>
            </button>
          ))}
        </div>

        {/* Applications List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 capitalize">{selectedStatus} Applications</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : applications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No {selectedStatus} applications
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="p-6 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedApp(app)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{app.brand_name}</h3>
                      <p className="text-sm text-gray-500 mt-1">by {app.user_id}</p>
                      <div className="flex items-center space-x-3 mt-2">
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
                          {app.category}
                        </span>
                        <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                          {app.experience_level}
                        </span>
                        {app.requested_hall && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            📍 {app.requested_hall}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 mt-3 line-clamp-2">{app.brand_story}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm text-gray-500">
                        {new Date(app.submitted_at).toLocaleDateString()}
                      </p>
                      <button className="mt-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                        Review →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Review Modal */}
        {selectedApp && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Review Application</h2>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Brand Info */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Brand Information</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div><strong>Name:</strong> {selectedApp.brand_name}</div>
                    <div><strong>Category:</strong> {selectedApp.category}</div>
                    <div><strong>Experience:</strong> {selectedApp.experience_level}</div>
                    <div><strong>User ID:</strong> {selectedApp.user_id}</div>
                  </div>
                </div>

                {/* Brand Story */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Brand Story</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedApp.brand_story}</p>
                  </div>
                </div>

                {/* Portfolio */}
                {selectedApp.portfolio_urls.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Portfolio</h3>
                    <div className="space-y-2">
                      {selectedApp.portfolio_urls.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-indigo-600 hover:text-indigo-700 underline"
                        >
                          {url}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Social Links */}
                {Object.keys(selectedApp.social_links).length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Social Media</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {Object.entries(selectedApp.social_links).map(([platform, handle]) => 
                        handle ? (
                          <div key={platform} className="bg-gray-50 rounded-lg p-3">
                            <div className="text-sm text-gray-500 capitalize">{platform}</div>
                            <div className="font-medium">{handle}</div>
                          </div>
                        ) : null
                      )}
                    </div>
                  </div>
                )}

                {/* Location Preference */}
                {(selectedApp.requested_hall || selectedApp.requested_street) && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Location Preference</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      {selectedApp.requested_hall && <div><strong>Hall:</strong> {selectedApp.requested_hall}</div>}
                      {selectedApp.requested_street && <div><strong>Street:</strong> {selectedApp.requested_street}</div>}
                    </div>
                  </div>
                )}

                {/* Review Notes */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Review Notes</h3>
                  <textarea
                    rows={4}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Add notes about this application..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => updateApplicationStatus('approved')}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => updateApplicationStatus('waitlisted')}
                    className="flex-1 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-bold"
                  >
                    ⏸ Waitlist
                  </button>
                  <button
                    onClick={() => updateApplicationStatus('rejected')}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold"
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
