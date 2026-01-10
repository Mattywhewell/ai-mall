/**
 * 2FA Setup Page
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, ArrowLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

export default function TwoFactorSetupPage() {
  const [qrCode, setQrCode] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const { enable2FA, verify2FA, user } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    handleEnable2FA();
  }, [user, router]);

  const handleEnable2FA = async () => {
    setLoading(true);
    setError('');

    try {
      const { error, qrCode: qrCodeUri } = await enable2FA();

      if (error) {
        throw error;
      }

      if (qrCodeUri) {
        setQrCode(qrCodeUri);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to enable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setVerifying(true);

    try {
      const { error } = await verify2FA(code);

      if (error) {
        throw error;
      }

      setSuccess(true);

      // Redirect after success
      setTimeout(() => {
        router.push('/profile/security');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setVerifying(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              2FA Enabled Successfully!
            </h1>

            <p className="text-gray-600 mb-6">
              Two-factor authentication has been enabled for your account. You'll now need to enter a verification code from your authenticator app when signing in.
            </p>

            <Link
              href="/profile/security"
              className="block w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Go to Security Settings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Back Link */}
        <Link
          href="/profile/security"
          className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Security Settings
        </Link>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-purple-600" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Enable Two-Factor Authentication
            </h1>

            <p className="text-gray-600">
              Add an extra layer of security to your account
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Setting up 2FA...</p>
            </div>
          ) : qrCode ? (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Step 1: Scan QR Code
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Use an authenticator app like Google Authenticator, Authy, or 1Password to scan this QR code.
                </p>

                <div className="bg-gray-50 p-4 rounded-lg inline-block">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`}
                    alt="2FA QR Code"
                    className="w-48 h-48 mx-auto"
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Step 2: Enter Verification Code
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Enter the 6-digit code from your authenticator app to complete setup.
                </p>

                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div>
                    <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                      Verification Code
                    </label>
                    <input
                      id="code"
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                      placeholder="000000"
                      maxLength={6}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={verifying || code.length !== 6}
                    className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {verifying ? 'Verifying...' : 'Enable 2FA'}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">Initializing 2FA setup...</p>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <Shield className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-900 mb-1">
                  What is 2FA?
                </h3>
                <p className="text-xs text-blue-700">
                  Two-factor authentication adds an extra layer of security by requiring a code from your phone in addition to your password.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help? <Link href="/contact" className="text-purple-600 hover:underline">Contact Support</Link>
          </p>
        </div>
      </div>
    </div>
  );
}