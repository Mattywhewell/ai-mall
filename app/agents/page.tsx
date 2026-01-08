import React from 'react';

export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">AI Shopping Agents</h1>
        <p className="mb-8 text-gray-600">Meet your personal AI shopping concierges. Each agent is tailored to your style and preferences.</p>
        {/* TODO: List agents from Supabase */}
        <div className="bg-white rounded-lg shadow p-6 text-gray-700">
          <p>Agent listing coming soon...</p>
        </div>
      </div>
    </div>
  );
}
