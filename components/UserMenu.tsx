'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [devUser, setDevUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('test_user') === 'true') {
        setDevUser({ id: 'test-id', email: 'test@example.com', user_metadata: { full_name: 'Test User' } });
      }
    }
  }, []);

  const effectiveUser = user || devUser;

  const handleSignOut = async () => {
    // clear dev user if present
    setDevUser(null as any);
    await signOut();
    router.push('/');
    router.refresh();
  };

  // Show user avatar if available, else fallback to icon. Always clickable.
  const accountHref = effectiveUser ? "/profile" : "/auth/login";
  // Try to get avatar URL from user_metadata or user object
  const avatarUrl = effectiveUser?.user_metadata?.avatar_url || effectiveUser?.avatar_url || null;
  return (
    <Link
      href={accountHref}
      aria-label="Account"
      className="w-8 h-8 rounded-full flex items-center justify-center hover:scale-105 transition-transform bg-gradient-to-br from-purple-500 to-blue-500 pointer-events-auto"
      style={{ overflow: 'hidden' }}
      tabIndex={0}
      role="button"
      onClick={e => {
        // Fallback: if Link fails, use router.push
        if (typeof window !== 'undefined') {
          e.preventDefault();
          router.push(accountHref);
        }
      }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="User avatar"
          className="w-8 h-8 object-cover rounded-full"
          referrerPolicy="no-referrer"
        />
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A9.001 9.001 0 0112 15c2.21 0 4.21.805 5.879 2.146M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )}
    </Link>
  );
}
