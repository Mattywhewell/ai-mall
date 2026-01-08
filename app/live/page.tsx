'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function LiveEventsPage() {
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
    const interval = setInterval(loadEvents, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadEvents = async () => {
    try {
      const [liveRes, upcomingRes] = await Promise.all([
        fetch('/api/live-events?status=live'),
        fetch('/api/live-events?upcoming=true')
      ]);

      const liveData = await liveRes.json();
      const upcomingData = await upcomingRes.json();

      setLiveEvents(liveData.events || []);
      setUpcomingEvents(upcomingData.events || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading live events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎥 Live Shopping Events
          </h1>
          <p className="text-lg text-gray-600">
            Shop in real-time with your favorite creators
          </p>
        </div>

        {/* Live Now */}
        {liveEvents.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <h2 className="text-2xl font-bold text-gray-900">
                Live Now ({liveEvents.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/live/${event.id}`}
                  className="group relative"
                >
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition">
                    {/* Cover Image */}
                    <div className="relative h-48 bg-gradient-to-br from-purple-500 to-pink-500">
                      {event.cover_image && (
                        <Image
                          src={event.cover_image}
                          alt={event.title}
                          fill
                          className="object-cover group-hover:scale-105 transition"
                        />
                      )}
                      {/* Live Badge */}
                      <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        LIVE
                      </div>
                      {/* Viewers */}
                      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                        👁️ {event.viewers_current || 0}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        {event.creator?.logo_url && (
                          <div className="w-10 h-10 relative rounded-full overflow-hidden flex-shrink-0">
                            <Image
                              src={event.creator.logo_url}
                              alt={event.creator.brand_name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {event.creator?.brand_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            ⭐ {event.creator?.rating?.toFixed(1) || 'New'}
                          </p>
                        </div>
                      </div>

                      <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                        {event.title}
                      </h3>

                      {event.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <div className="text-gray-600">
                          💬 {event.messages_count || 0} messages
                        </div>
                        {event.event_discount_percent > 0 && (
                          <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                            {event.event_discount_percent}% OFF
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* No Live Events */}
        {liveEvents.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center mb-12">
            <div className="text-6xl mb-4">📺</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No Live Events Right Now
            </h3>
            <p className="text-gray-600 mb-6">
              Check out upcoming events below or follow creators to get notified!
            </p>
          </div>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              📅 Coming Soon
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => {
                const startDate = new Date(event.scheduled_start);
                const isToday = startDate.toDateString() === new Date().toDateString();
                const timeString = startDate.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={event.id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden"
                  >
                    {/* Cover Image */}
                    <div className="relative h-48 bg-gradient-to-br from-indigo-500 to-purple-500">
                      {event.cover_image && (
                        <Image
                          src={event.cover_image}
                          alt={event.title}
                          fill
                          className="object-cover"
                        />
                      )}
                      {/* Date Badge */}
                      <div className="absolute top-4 left-4 bg-white text-gray-900 px-3 py-1 rounded-full text-sm font-bold">
                        {isToday ? `Today at ${timeString}` : startDate.toLocaleDateString()}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        {event.creator?.logo_url && (
                          <div className="w-10 h-10 relative rounded-full overflow-hidden flex-shrink-0">
                            <Image
                              src={event.creator.logo_url}
                              alt={event.creator.brand_name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">
                            {event.creator?.brand_name}
                          </p>
                        </div>
                      </div>

                      <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                        {event.title}
                      </h3>

                      {event.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {event.description}
                        </p>
                      )}

                      <button className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold">
                        🔔 Remind Me
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Upcoming Events */}
        {upcomingEvents.length === 0 && liveEvents.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎬</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              More Events Coming Soon!
            </h3>
            <p className="text-gray-600 mb-6">
              Follow your favorite creators to get notified when they go live
            </p>
            <Link
              href="/discover"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
            >
              Discover Creators
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
