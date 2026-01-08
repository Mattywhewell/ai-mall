'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { CheckCircle, XCircle, Loader, Mail } from 'lucide-react';

export default function VerifyEmailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'pending'>('pending');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams?.get('token');
    const type = searchParams?.get('type');

    if (token && type === 'email') {
      verifyEmail(token);
    }
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    setStatus('loading');

    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email',
      });

      if (error) {
        setStatus('error');
        setMessage(error.message || 'Verification failed. The link may be expired.');
      } else {
        setStatus('success');
        setMessage('Email verified successfully! Redirecting...');

        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/profile');
        }, 2000);
      }
    } catch (err: any) {
      setStatus('error');
      setMessage('An unexpected error occurred. Please try again.');
    }
  };

  const resendVerification = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.email) {
      setMessage('Please log in to resend verification email.');
      return;
    }

    setStatus('loading');

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
    });

    if (error) {
      setStatus('error');
      setMessage('Failed to resend verification email.');
    } else {
      setStatus('pending');
      setMessage('Verification email sent! Please check your inbox.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {status === 'loading' && (
          <div className="text-center">
            <Loader className="w-16 h-16 text-purple-600 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email...</h1>
            <p className="text-gray-600">Please wait while we verify your email address.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <div className="animate-pulse text-sm text-gray-500">Redirecting to your profile...</div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={resendVerification}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Resend Verification Email
            </button>
          </div>
        )}

        {status === 'pending' && (
          <div className="text-center">
            <Mail className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h1>
            <p className="text-gray-600 mb-6">
              {message || 'We sent a verification link to your email. Please click the link to verify your account.'}
            </p>
            <button
              onClick={resendVerification}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors mb-3"
            >
              Resend Verification Email
            </button>
            <button
              onClick={() => router.push('/auth/login')}
              className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
