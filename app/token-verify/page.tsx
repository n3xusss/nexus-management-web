// app/token-verify/page.tsx - UPDATED
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BackgroundPattern from '../../components/BackgroundPattern';
import GoogleAuthButton from '../../components/GoogleAuthButton';
import { useAuth } from '../../lib/stores/authStore'; // NEW

export default function TokenVerifyPage() {
  const router = useRouter();
  const { inviteToken, setInviteToken, clearInviteToken } = useAuth(); // NEW
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState('');
  
  // No longer need local state for verifiedToken - use auth store directly

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!tokenInput.trim()) {
      setError('Please enter a token');
      return;
    }

    if (tokenInput.length < 3) {
      setError('Invalid token length');
      return;
    }

    // Store the token in auth store
    setInviteToken(tokenInput);
    console.log('✅ Token stored in auth store:', tokenInput);
  };

  const handleClearToken = () => {
    clearInviteToken();
    setTokenInput('');
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
          
          {/* If token is stored in auth store, show Google button */}
          {inviteToken ? (
            <div className="space-y-6">
              <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                <p className="text-green-300 font-medium mb-2">✓ Token Stored</p>
                <p className="text-green-400/80 text-sm break-all">
                  Token: {inviteToken}
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
                  inviteToken={inviteToken}
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
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Enter your invite token"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7CFC9D] focus:border-transparent"
                  required
                  autoComplete="off"
                  autoFocus
                />
              </div>
              
              <button
                type="submit"
                disabled={!tokenInput.trim()}
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