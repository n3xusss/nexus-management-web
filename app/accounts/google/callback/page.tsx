// app/callback/page.tsx 
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BackgroundPattern from '../../../../components/BackgroundPattern';
import { useAuth } from '../../../../lib/stores/authStore';
import { exchangeGoogleCode, getUserProfile } from '../../../../lib/api';

export default function GoogleCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams?.get('code');
        const errorParam = searchParams?.get('error');
        
        console.log('🔍 OAuth Callback received:', { 
          code: !!code, 
          errorParam,
          state: searchParams?.get('state')
        });

        if (errorParam) {
          throw new Error(`Google OAuth error: ${errorParam}`);
        }

        if (!code) {
          throw new Error('No authorization code received from Google');
        }

        // Get pending invite token from storage
        const pendingToken = localStorage.getItem('pending_invite_token') || 
                            sessionStorage.getItem('pending_invite_token');
        
        const redirectUri = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_REDIRECT_URI || 
                           `${window.location.origin}/callback`;
        
        console.log('🔍 Processing callback...', {
          hasInviteToken: !!pendingToken,
          redirectUri
        });

        // Exchange code for tokens (with invite token if present)
        const authData = await exchangeGoogleCode(code, redirectUri, pendingToken || undefined);
        
        // NEW: Check if this is a NEW user (invite token present)
        const isNewUser = !!pendingToken;
        
        console.log('🔍 User type check:', { isNewUser, pendingToken });

        if (isNewUser) {
          // NEW USER FLOW: Always go to registration, even if backend returns incomplete data
          console.log('🔄 New user with invite token, redirecting to registration');
          
          // Store OAuth data in localStorage for registration page
          localStorage.setItem('oauth_access_token', authData.access);
          localStorage.setItem('oauth_refresh_token', authData.refresh || '');
          localStorage.setItem('oauth_user_data', JSON.stringify(authData.user));
          
          // Clear invite token now (we've used it)
          localStorage.removeItem('pending_invite_token');
          sessionStorage.removeItem('pending_invite_token');
          
          // Redirect to complete registration
          router.push('/register/complete');
          
        } else {
          // EXISTING USER FLOW: Check if they have completed profile
          console.log('🔍 Fetching complete user profile for existing user...');
          const completeUserProfile = await getUserProfile(authData.access);
          
          // Merge profile data
          authData.user = {
            ...authData.user,
            ...completeUserProfile
          };

          console.log('✅ Existing user profile:', {
            user: authData.user,
            hasPhone: !!authData.user.phone_number,
            hasAcademicLevel: !!authData.user.academic_level,
            hasTags: !!(authData.user.tags && authData.user.tags.length > 0),
            hasSchool: !!authData.user.school,
            hasFirstName: !!authData.user.first_name,
            hasLastName: !!authData.user.last_name
          });

          // Check if user has completed registration
          const hasRegistrationData = 
            authData.user.phone_number || 
            authData.user.academic_level || 
            (authData.user.tags && authData.user.tags.length > 0) ||
            authData.user.school ||
            authData.user.first_name ||
            authData.user.last_name;

          console.log('🔍 Registration check for existing user:', {
            hasRegistrationData,
            phone: authData.user.phone_number,
            academicLevel: authData.user.academic_level,
            tags: authData.user.tags,
            school: authData.user.school,
            firstName: authData.user.first_name,
            lastName: authData.user.last_name
          });

          if (!hasRegistrationData) {
            console.log('🔄 Existing user needs to complete profile');
            
            // Store OAuth data in localStorage for registration page
            localStorage.setItem('oauth_access_token', authData.access);
            localStorage.setItem('oauth_refresh_token', authData.refresh || '');
            localStorage.setItem('oauth_user_data', JSON.stringify(authData.user));
            
            // Redirect to complete registration
            router.push('/register/complete');
          } else {
            console.log('✅ Existing user with complete profile, logging in');
            
            // Ensure user data has at least something for the name field
            if (!authData.user.first_name && !authData.user.last_name && authData.user.username) {
              authData.user.first_name = authData.user.username;
              authData.user.last_name = '';
              console.log('⚠️ Using username as fallback name:', authData.user.username);
            }
            
            // Login user (this will store tokens in auth store)
            login(authData);
            
            // Wait a moment for state update then redirect
            setTimeout(() => {
              router.push('/global');
            }, 100);
          }
        }
        
        setStatus('success');
        
      } catch (err: any) {
        console.error('❌ OAuth callback error:', err);
        setError(err.message || 'Authentication failed');
        setStatus('error');
      }
    };

    if (searchParams) {
      handleCallback();
    }
  }, [searchParams, login, router]);

  // Loading, error, and success UI remain exactly the same...
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
              <div className="mb-6 p-4 bg-red-500/10 rounded-lg border border-red-500/30 text-left">
                <p className="font-medium mb-2 text-red-300">Error details:</p>
                <p className="text-sm text-red-400/80 break-words">{error}</p>
              </div>
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
                {error.toLowerCase().includes('invite') || error.toLowerCase().includes('token') ? (
                  <button 
                    onClick={() => {
                      localStorage.removeItem('pending_invite_token');
                      sessionStorage.removeItem('pending_invite_token');
                      router.push('/token-verify');
                    }}
                    className="w-full border-2 border-yellow-600 text-yellow-400 hover:bg-yellow-600/10 px-6 py-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Enter Invite Token Again
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

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