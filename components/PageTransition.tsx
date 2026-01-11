'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageTransition({ children, className = '' }: PageTransitionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const pathname = usePathname();

  useEffect(() => {
    setIsLoading(true);

    // Simulate loading time for smooth transitions
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [pathname, children]);

  return (
    <div className={`relative ${className}`}>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              {/* Animated city silhouette */}
              <div className="text-6xl mb-4 animate-bounce">🏙️</div>
              {/* Pulsing rings */}
              <div className="absolute inset-0 -m-4">
                <div className="w-full h-full border-4 border-purple-500/30 rounded-full animate-ping"></div>
              </div>
              <div className="absolute inset-0 -m-8">
                <div className="w-full h-full border-2 border-blue-500/20 rounded-full animate-ping animation-delay-300"></div>
              </div>
            </div>
            <p className="text-white text-lg mt-4 animate-pulse">Traveling through the city...</p>
          </div>
        </div>
      )}

      {/* Page Content */}
      <div
        className={`transition-all duration-500 ${
          isLoading
            ? 'opacity-0 transform translate-y-4'
            : 'opacity-100 transform translate-y-0'
        }`}
      >
        {displayChildren}
      </div>
    </div>
  );
}

// Hook for programmatic navigation with transitions
export function usePageTransition() {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const navigateWithTransition = async (href: string, delay = 300) => {
    setIsTransitioning(true);
    await new Promise(resolve => setTimeout(resolve, delay));
    window.location.href = href;
  };

  return { isTransitioning, navigateWithTransition };
}