'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BackgroundPattern from '../../components/BackgroundPattern';
import GoogleAuthButton from '../../components/GoogleAuthButton';

export default function TokenVerifyPage() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [verifiedToken, setVerifiedToken] = useState<string | null>(null);

  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('pending_invite_token') || 
                       sessionStorage.getItem('pending_invite_token');
    if (storedToken) {
      setVerifiedToken(storedToken);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!token.trim()) {
      setError('Please enter a token');
      return;
    }

    if (token.length < 3) {
      setError('Token must be at least 3 characters');
      return;
    }

    // Store the token for OAuth flow
    localStorage.setItem('pending_invite_token', token);
    sessionStorage.setItem('pending_invite_token', token);
    setVerifiedToken(token);
    console.log('✅ Token stored for OAuth:', token);
  };

  const handleClearToken = () => {
    localStorage.removeItem('pending_invite_token');
    sessionStorage.removeItem('pending_invite_token');
    setVerifiedToken(null);
    setToken('');
    setError('');
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
            New users need a valid invite token to register. Contact your administrator to get one.
          </p>
          
          {/* If token is stored, show Google button */}
          {verifiedToken ? (
            <div className="space-y-6">
              <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                <p className="text-green-300 font-medium mb-2">✓ Token Stored</p>
                <p className="text-green-400/80 text-sm break-all">
                  Token: {verifiedToken}
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="text-left space-y-2">
                  <p className="text-gray-300">
                    Now click "Continue with Google" to create your account. 
                    The invite token will be verified by the backend during registration.
                  </p>
                </div>
                
                <GoogleAuthButton 
                  inviteToken={verifiedToken}
                  isNewUser={true}
                />
                
                <button
                  onClick={handleClearToken}
                  className="w-full text-gray-400 hover:text-white text-sm transition-colors py-2"
                >
                  Use different token
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded text-sm">
                  {error}
                </div>
              )}
              
              <div>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter your invite token"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7CFC9D] focus:border-transparent"
                  required
                  autoComplete="off"
                  autoFocus
                />
              </div>
              
              <button
                type="submit"
                disabled={!token.trim()}
                className="w-full bg-[#7CFC9D] text-black font-semibold py-3 px-4 rounded-lg transition-all duration-300 hover:bg-[#6ee089] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Store Token & Continue
              </button>
            </form>
          )}
          
          <div className="mt-6">
            <button
              onClick={() => router.push('/')}
              className="text-gray-400 hover:text-white text-sm transition-colors flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Login
            </button>
          </div>
          
          {/* Note */}
          <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <p className="text-sm text-gray-400">
              <strong>Note:</strong> 
              <br />• If you already have an account, use the Google button on the login page.
              <br />• The token will be verified by the backend during registration.
              <br />• If token is invalid, you'll get an error and can try again.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}