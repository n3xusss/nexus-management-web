// app/token-verify/page.tsx - UPDATED with message handling
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BackgroundPattern from '../../components/BackgroundPattern';
import GoogleAuthButton from '../../components/GoogleAuthButton';
import { useAuth } from '../../lib/stores/authStore';

function TokenVerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { inviteToken, setInviteToken, clearInviteToken } = useAuth();
  const [tokenInput, setTokenInput] = useState('');
  const [message, setMessage] = useState<{
    type: 'welcome' | 'retry' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Check for messages in query params
    const messageType = searchParams?.get('message');
    const errorParam = searchParams?.get('error');
    
    if (messageType === 'welcome') {
      setMessage({
        type: 'welcome',
        text: 'Welcome to NexusHub! Please enter your invite token to continue.'
      });
    } else if (messageType === 'retry' && errorParam) {
      setMessage({
        type: 'retry',
        text: 'The previous token was invalid. Please enter a valid invite token.'
      });
      setError(errorParam);
    } else {
      setMessage({
        type: 'info',
        text: 'Enter your invite token to continue with registration.'
      });
    }
  }, [searchParams]);

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
    
    // Clear any error messages
    setMessage({
      type: 'info',
      text: 'Token saved! Click "Continue with Google" to proceed.'
    });
  };

  const handleClearToken = () => {
    clearInviteToken();
    setTokenInput('');
    setError('');
    setMessage({
      type: 'info',
      text: 'Enter your invite token to continue.'
    });
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
            {message?.type === 'welcome' ? 'Welcome!' : 'Enter Invite Token'}
          </h1>
          
          {/* Message Display */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg border ${
              message.type === 'welcome' 
                ? 'bg-blue-500/20 border-blue-500/30' 
                : message.type === 'retry'
                ? 'bg-red-500/20 border-red-500/30'
                : 'bg-gray-800/50 border-gray-700'
            }`}>
              <p className={`
                ${message.type === 'welcome' ? 'text-blue-300' : 
                  message.type === 'retry' ? 'text-red-300' : 
                  'text-gray-300'}
              `}>
                {message.text}
              </p>
            </div>
          )}
          
          {/* Description */}
          <p className="text-gray-300 mb-8">
            New users need a valid invite token to register. Contact your administrator to get one.
          </p>
          
          {/* If token is stored, show Google button */}
          {inviteToken ? (
            <div className="space-y-6">
              <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                <p className="text-green-300 font-medium mb-2">✓ Token Ready</p>
                <p className="text-green-400/80 text-sm break-all">
                  Token: {inviteToken.substring(0, 4)}...{inviteToken.substring(inviteToken.length - 4)}
                </p>
              </div>
              
              <div className="space-y-4">
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
                  onChange={(e) => {
                    setTokenInput(e.target.value);
                    setError('');
                  }}
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
                Save Token & Continue
              </button>
            </form>
          )}
          
          <div className="mt-6">
            <button
              onClick={() => {
                clearInviteToken();
                router.push('/');
              }}
              className="text-gray-400 hover:text-white text-sm transition-colors flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function TokenVerifyPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#2A2A2A] text-white">
        <BackgroundPattern />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gray-700 border-t-[#7CFC9D] rounded-full animate-spin mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-[#7CFC9D] rounded-full animate-ping opacity-75"></div>
              </div>
            </div>
            <p className="text-white mt-6 text-lg font-medium">Loading...</p>
            <p className="text-gray-400 mt-2 text-sm">Please wait</p>
          </div>
        </div>
      </main>
    }>
      <TokenVerifyPageContent />
    </Suspense>
  );
}