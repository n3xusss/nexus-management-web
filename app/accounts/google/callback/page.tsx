// Update app/accounts/google/callback/page.tsx - Fix redirect logic
'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BackgroundPattern from '../../../../components/BackgroundPattern';
import { useAuth } from '../../../../lib/stores/authStore';
import { exchangeGoogleCode, getUserProfile } from '../../../../lib/api';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, setOAuthPending, inviteToken, clearInviteToken } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'redirecting' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');
  const hasProcessed = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      if (hasProcessed.current) return;
      hasProcessed.current = true;

      try {
        const code = searchParams?.get('code');
        const errorParam = searchParams?.get('error');
        
        console.log('🔍 OAuth Callback received:', { 
          code: !!code, 
          errorParam,
          hasInviteTokenInStore: !!inviteToken
        });

        if (errorParam) {
          throw new Error(`Google OAuth error: ${errorParam}`);
        }

        if (!code) {
          throw new Error('No authorization code received from Google');
        }

        // Get invite token from state parameter first
        let inviteTokenFromState: string | null = null;
        const stateParam = searchParams?.get('state');
        if (stateParam) {
          try {
            const stateData = JSON.parse(decodeURIComponent(stateParam));
            inviteTokenFromState = stateData.inviteToken || null;
          } catch (e) {
            // No token in state
          }
        }

        const pendingToken = inviteTokenFromState || inviteToken || undefined;
        const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_REDIRECT_URI || 
                          `${window.location.origin}/accounts/google/callback`;
        
        console.log('🔍 Processing callback...', {
          hasInviteToken: !!pendingToken,
          tokenSource: inviteTokenFromState ? 'state' : inviteToken ? 'store' : 'none'
        });

        // Try to exchange code for tokens
        const authData = await exchangeGoogleCode(code, redirectUri, pendingToken);
        
        // SUCCESS - Clear invite token and proceed
        if (inviteToken && !inviteTokenFromState) {
          clearInviteToken();
        }
        
        // Check if user needs registration
        const completeUserProfile = await getUserProfile(authData.access);
        authData.user = { ...authData.user, ...completeUserProfile };
        
        const hasRegistrationData = 
          authData.user.academic_level || 
          (authData.user.tags && authData.user.tags.length > 0) ||
          authData.user.school;

        if (!hasRegistrationData) {
          console.log('🔄 User needs to complete profile');
          
          setOAuthPending({
            access: authData.access,
            refresh: authData.refresh || '',
            user: authData.user
          });
          
          router.push('/register/complete');
        } else {
          console.log('✅ User authenticated successfully');
          
          if (!authData.user.first_name && !authData.user.last_name && authData.user.username) {
            authData.user.first_name = authData.user.username;
            authData.user.last_name = '';
          }
          
          login(authData);
          setTimeout(() => router.push('/global'), 100);
        }
        
        setStatus('success');
        
      } catch (err: any) {
        const errorMessage = err.message || 'Authentication failed';
        
        console.log('❌ OAuth callback error:', errorMessage);
        
        // Handle specific error types
        if (errorMessage === 'INVITE_TOKEN_NOT_FOUND') {
          // New user without a token
          console.log('🆕 New user detected - needs invite token');
          setMessage('Welcome! It looks like you need an invite token to join.');
          setStatus('redirecting');
          
          // Clear any stored token since it wasn't used
          clearInviteToken();
          
          // Redirect to token entry
          setTimeout(() => {
            router.push('/token-verify?message=welcome');
          }, 800);
          
        } else if (errorMessage.includes('INVITE_TOKEN_INVALID')) {
          // User provided a wrong/invalid token
          console.log('❌ Invalid token provided');
          setMessage('The invite token appears to be invalid or expired. Please try again.');
          setStatus('redirecting');
          
          // Clear the invalid token
          clearInviteToken();
          
          // Redirect to token entry with retry message
          setTimeout(() => {
            router.push('/token-verify?message=retry');
          }, 800);
          
        } else {
          // Other errors
          console.log('⚠️ General authentication error');
          setMessage(errorMessage);
          setStatus('error');
        }
        
        hasProcessed.current = false; // Allow retry
      }
    };

    if (searchParams && !hasProcessed.current) {
      handleCallback();
    }
  }, [searchParams, login, router, setOAuthPending, inviteToken, clearInviteToken]);

  // Loading UI
  if (status === 'loading') {
    return (
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
            <p className="text-white mt-6 text-lg font-medium">Authenticating with Google...</p>
            <p className="text-gray-400 mt-2 text-sm">Please wait</p>
          </div>
        </div>
      </main>
    );
  }

  // Redirecting UI (for new user or invalid token)
  if (status === 'redirecting') {
    return (
      <main className="min-h-screen bg-[#2A2A2A] text-white">
        <BackgroundPattern />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-700 shadow-2xl p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-blue-400 mb-4">
                {message.includes('Welcome') ? 'Welcome!' : 'Oops!'}
              </h1>
              <p className="text-gray-300 mb-6">{message}</p>
              <div className="mb-6">
                <div className="flex items-center justify-center space-x-2 text-blue-300">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-300"></div>
                  <span>Redirecting...</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  clearInviteToken();
                  router.push('/token-verify');
                }}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Go to Token Entry
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Error UI - only for general errors
  if (status === 'error') {
    return (
      <main className="min-h-screen bg-[#2A2A2A] text-white">
        <BackgroundPattern />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-700 shadow-2xl p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-red-400 mb-4">Authentication Error</h1>
              <p className="text-gray-300 mb-6">{message}</p>
              <div className="space-y-3">
                <button 
                  onClick={() => router.push('/')}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Back to Login
                </button>
                <button 
                  onClick={() => {
                    clearInviteToken();
                    router.push('/token-verify?message=retry');
                  }}
                  className="w-full border-2 border-yellow-600 text-yellow-400 hover:bg-yellow-600/10 px-6 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Try Different Token
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Success UI
  return (
    <main className="min-h-screen bg-[#2A2A2A] text-white">
      <BackgroundPattern />
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-700 border-t-[#7CFC9D] rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-[#7CFC9D] rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className="text-white mt-6 text-lg font-medium">Authentication successful!</p>
          <p className="text-gray-400 mt-2 text-sm">Redirecting to dashboard...</p>
        </div>
      </div>
    </main>
  );
}

export default function GoogleCallback() {
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
      <GoogleCallbackContent />
    </Suspense>
  );
}