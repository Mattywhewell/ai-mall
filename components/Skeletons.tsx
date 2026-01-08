export function DistrictCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
          <div className="h-6 w-32 bg-gray-200 rounded"></div>
        </div>
        <div className="w-6 h-6 bg-gray-200 rounded"></div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
      <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 py-24 md:py-32 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="h-20 w-96 bg-white/10 rounded-2xl mx-auto mb-6"></div>
        <div className="h-6 w-64 bg-white/10 rounded-lg mx-auto mb-4"></div>
        <div className="h-6 w-96 bg-white/10 rounded-lg mx-auto mb-12"></div>
        <div className="flex justify-center gap-4">
          <div className="h-14 w-48 bg-white/10 rounded-full"></div>
          <div className="h-14 w-48 bg-white/10 rounded-full"></div>
          <div className="h-14 w-48 bg-white/10 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}

export function ActivityFeedSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
          <div>
            <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 w-48 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="h-8 w-24 bg-gray-200 rounded-full"></div>
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
