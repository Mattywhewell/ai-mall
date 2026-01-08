'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { useRouter } from 'next/navigation';

export default function TestAuthPage() {
  const auth = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Auth Test Page</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <div>
          <strong>Auth Context Status:</strong>
          <pre className="mt-2 p-4 bg-gray-100 rounded">
            {JSON.stringify({
              isLoading: auth.loading,
              hasUser: !!auth.user,
              hasSession: !!auth.session,
              userEmail: auth.user?.email,
              hasSignUp: typeof auth.signUp === 'function',
              hasSignIn: typeof auth.signIn === 'function',
            }, null, 2)}
          </pre>
        </div>

        <div className="space-y-2">
          <a 
            href="/auth/signup" 
            className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Go to Sign Up (href)
          </a>
          
          <button 
            onClick={() => router.push('/auth/signup')}
            className="block w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
          >
            Go to Sign Up (navigate)
          </button>
        </div>
      </div>
    </div>
  );
}
