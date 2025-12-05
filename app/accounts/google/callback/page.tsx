// app/accounts/google/callback/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../../lib/stores/authStore';

export default function GoogleCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, exchangeGoogleAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        const code = searchParams.get('code');
        
        if (!code) {
          throw new Error('No authorization code received from Google');
        }
        const data = await exchangeGoogleAuth(code);
        console.log('Google OAuth successful, logging in user:', data);
        const { user, token ,refreshToken} = data 
        login(user, token, refreshToken);

      } catch (err: any) {
        console.error('Google OAuth callback error:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    handleGoogleCallback();
  }, [searchParams, login, exchangeGoogleAuth, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#2A2A2A] flex items-center justify-center">
        <div className="text-white text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-red-400">Authentication Error</h1>
          <p className="mb-4">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2A2A2A] flex items-center justify-center">
      <div className="text-center">
        <div className="text-white text-xl mb-4">
          {isLoading ? 'Authenticating with Google...' : 'Redirecting...'}
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7CFC9D] mx-auto"></div>
      </div>
    </div>
  );
}