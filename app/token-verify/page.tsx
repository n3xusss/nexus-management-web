// app/token-verify/page.tsx - ONLY FOR NEW USERS
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import BackgroundPattern from '../../components/BackgroundPattern';

export default function TokenVerifyPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Verify token with backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/verify-token/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        }
      );

      const data = await response.json();

      if (response.ok && data.valid) {
        // Token is valid, redirect to Google OAuth WITH the token
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID;
        const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_REDIRECT_URI;
        
        const params = new URLSearchParams({
          client_id: clientId!,
          redirect_uri: redirectUri!,
          response_type: 'code',
          scope: 'openid email profile',
          access_type: 'offline',
          prompt: 'consent',
          state: data.token, // Pass the verified token in state
        });
        
        window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
      } else {
        setError(data.error || 'Invalid token');
      }
    } catch (err: any) {
      setError('Failed to verify token');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/');
  };

  return (
    <main className="min-h-screen bg-[#2A2A2A] text-white">
      <BackgroundPattern />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-md w-full">
          {/* Logo */}
          <div className="w-34 h-24 mx-auto mb-8">
            <img 
              src="/logo.svg" 
              alt="NexusHub Logo" 
              className="w-full h-full"
            />
          </div>
          
          {/* Title */}
          <h1 className="text-3xl font-bold mb-6">
            Enter Invite Token
          </h1>
          
          {/* Description */}
          <p className="text-gray-300 mb-8">
            You need a valid invite token to register as a new user. Contact your administrator to get one.
          </p>
          
          {/* Token Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter your invite token"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7CFC9D]"
                required
                disabled={loading}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-[#7CFC9D] text-black font-semibold py-3 px-4 rounded-lg transition-all duration-300 hover:bg-[#6ee089] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                  Verifying...
                </div>
              ) : (
                'Continue with Google'
              )}
            </button>
          </form>
          
          <div className="mt-6">
            <button
              onClick={handleBackToLogin}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              ← Back to Login
            </button>
          </div>
          
          {/* Note */}
          <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <p className="text-sm text-gray-400">
              <strong>Note:</strong> If you already have an account, just click "Continue with Google" on the login page without entering a token.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}