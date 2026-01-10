'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Package, LogOut, ChevronDown } from 'lucide-react';

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [devUser, setDevUser] = useState<any>(null);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('test_user') === 'true') {
        setDevUser({ id: 'test-id', email: 'test@example.com', user_metadata: { full_name: 'Test User' } });
      }
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const effectiveUser = user || devUser;

  const handleSignOut = async () => {
    setDevUser(null as any);
    await signOut();
    router.push('/');
    router.refresh();
  };

  if (!effectiveUser) {
    return (
      <Link
        href="/auth/login"
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
      >
        Sign In
      </Link>
    );
  }

  // Try to get avatar URL from user_metadata or user object
  const avatarUrl = effectiveUser?.user_metadata?.avatar_url || effectiveUser?.avatar_url || null;
  const displayName = effectiveUser?.user_metadata?.full_name || effectiveUser?.email?.split('@')[0] || 'User';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="User menu"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="User avatar"
            className="w-8 h-8 object-cover rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A9.001 9.001 0 0112 15c2.21 0 4.21.805 5.879 2.146M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-500">{effectiveUser?.email}</p>
          </div>

          <div className="py-1">
            <Link
              href="/profile"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <User className="w-4 h-4 mr-3" />
              Profile
            </Link>

            <Link
              href="/orders"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Package className="w-4 h-4 mr-3" />
              Orders
            </Link>
          </div>

          <div className="border-t border-gray-100 pt-1">
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
