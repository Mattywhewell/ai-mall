import React from 'react';

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Live Shopping Events</h1>
        <p className="mb-8 text-gray-600">Discover upcoming, live, and past shopping events hosted by creators.</p>
        {/* TODO: List events from Supabase */}
        <div className="bg-white rounded-lg shadow p-6 text-gray-700">
          <p>Event listing coming soon...</p>
        </div>
      </div>
    </div>
  );
}
