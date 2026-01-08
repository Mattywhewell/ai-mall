'use client';

import { useState, useEffect } from 'react';
import type { PromptTemplate, PromptVersion } from '@/lib/services/prompt-versioning';

export default function PromptsManagementPage() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newVersionData, setNewVersionData] = useState({
    promptText: '',
    model: 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxTokens: 2000,
    changeReason: '',
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      loadVersions();
    }
  }, [selectedTemplate]);

  const loadTemplates = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/prompts/templates');
    const json = await res.json();
    setTemplates(json.templates || []);
    setLoading(false);
  };

  const loadVersions = async () => {
    if (!selectedTemplate) return;
    const res = await fetch(`/api/admin/prompts/versions?name=${encodeURIComponent(selectedTemplate)}`);
    const json = await res.json();
    setVersions(json.versions || []);
  };

  const handleActivateVersion = async (version: number) => {
    if (!selectedTemplate) return;
    const res = await fetch('/api/admin/prompts/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'activate', name: selectedTemplate, version, userId: 'admin-user-id' }),
    });
    const json = await res.json();
    if (json.success) {
      alert('Version activated successfully');
      loadVersions();
    } else {
      alert('Failed to activate version');
    }
  };

  const handleLockVersion = async (version: number) => {
    if (!selectedTemplate) return;
    const res = await fetch('/api/admin/prompts/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'lock', name: selectedTemplate, version, userId: 'admin-user-id' }),
    });
    const json = await res.json();
    if (json.success) {
      alert('Version locked successfully');
      loadVersions();
    } else {
      alert('Failed to lock version');
    }
  };

  const handleCreateVersion = async () => {
    if (!selectedTemplate) return;
    const res = await fetch('/api/admin/prompts/versions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: selectedTemplate,
        promptText: newVersionData.promptText,
        model: newVersionData.model,
        temperature: newVersionData.temperature,
        maxTokens: newVersionData.maxTokens,
        changeReason: newVersionData.changeReason,
        createdBy: 'admin-user-id',
      }),
    });
    const json = await res.json();
    if (json.version) {
      alert('Version created successfully');
      setShowCreateModal(false);
      setNewVersionData({
        promptText: '',
        model: 'gpt-4-turbo-preview',
        temperature: 0.7,
        maxTokens: 2000,
        changeReason: '',
      });
      loadVersions();
    } else {
      alert('Failed to create version');
    }
  };

  const handleRollback = async (version: number) => {
    if (!selectedTemplate) return;
    if (!confirm(`Rollback to version ${version}?`)) return;
    const res = await fetch('/api/admin/prompts/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'rollback', name: selectedTemplate, version, userId: 'admin-user-id' }),
    });
    const json = await res.json();
    if (json.success) {
      alert('Rolled back successfully');
      loadVersions();
    } else {
      alert('Rollback failed');
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'auto_listing': return 'bg-blue-100 text-blue-800';
      case 'recommendation': return 'bg-green-100 text-green-800';
      case 'search': return 'bg-purple-100 text-purple-800';
      case 'moderation': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">AI Prompt Management</h1>
        <p className="text-gray-600 mt-2">Manage AI prompt versions, track changes, and control rollbacks</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Templates List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Prompt Templates</h2>
            </div>
            <div className="divide-y">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.name)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                    selectedTemplate === template.name ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{template.name.replace(/_/g, ' ')}</h3>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      <div className="flex gap-2 mt-2">
                        <span className={`text-xs px-2 py-1 rounded ${getCategoryBadgeColor(template.category)}`}>
                          {template.category}
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                          v{template.active_version} active
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Version History */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">Version History: {selectedTemplate.replace(/_/g, ' ')}</h2>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create New Version
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className={`border rounded-lg p-4 ${version.is_active ? 'border-green-500 bg-green-50' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">Version {version.version}</h3>
                          {version.is_active && (
                            <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">ACTIVE</span>
                          )}
                          {version.is_locked && (
                            <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded">LOCKED</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Created {new Date(version.created_at).toLocaleDateString()}
                        </p>
                        {version.change_reason && (
                          <p className="text-sm text-gray-700 mt-2">
                            <strong>Reason:</strong> {version.change_reason}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {!version.is_active && !version.is_locked && (
                          <>
                            <button
                              onClick={() => handleActivateVersion(version.version)}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                            >
                              Activate
                            </button>
                            <button
                              onClick={() => handleRollback(version.version)}
                              className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
                            >
                              Rollback
                            </button>
                          </>
                        )}
                        {!version.is_locked && (
                          <button
                            onClick={() => handleLockVersion(version.version)}
                            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                          >
                            Lock
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <span className="text-gray-600">Model:</span>
                          <span className="ml-2 font-medium">{version.model}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Temperature:</span>
                          <span className="ml-2 font-medium">{version.temperature}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Max Tokens:</span>
                          <span className="ml-2 font-medium">{version.max_tokens}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <span className="text-gray-600 block mb-1">Prompt:</span>
                        <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto max-h-40">
                          {version.prompt_text}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              Select a template to view version history
            </div>
          )}
        </div>
      </div>

      {/* Create Version Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-xl font-bold mb-4">Create New Version</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Prompt Text</label>
                <textarea
                  value={newVersionData.promptText}
                  onChange={(e) => setNewVersionData({ ...newVersionData, promptText: e.target.value })}
                  className="w-full border rounded-lg p-3 h-40"
                  placeholder="Enter prompt text..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Model</label>
                  <select
                    value={newVersionData.model}
                    onChange={(e) => setNewVersionData({ ...newVersionData, model: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  >
                    <option>gpt-4-turbo-preview</option>
                    <option>gpt-4</option>
                    <option>gpt-3.5-turbo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Temperature</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={newVersionData.temperature}
                    onChange={(e) => setNewVersionData({ ...newVersionData, temperature: parseFloat(e.target.value) })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Tokens</label>
                  <input
                    type="number"
                    value={newVersionData.maxTokens}
                    onChange={(e) => setNewVersionData({ ...newVersionData, maxTokens: parseInt(e.target.value) })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Change Reason</label>
                <input
                  type="text"
                  value={newVersionData.changeReason}
                  onChange={(e) => setNewVersionData({ ...newVersionData, changeReason: e.target.value })}
                  className="w-full border rounded-lg p-2"
                  placeholder="Why are you creating this version?"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateVersion}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Create Version
              </button>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
