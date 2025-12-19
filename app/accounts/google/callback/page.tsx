// app/callback/page.tsx - IMPROVED ERROR HANDLING
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../../lib/stores/authStore';

export default function GoogleCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        setLoading(true);
        const code = searchParams?.get('code') || '';
        const state = searchParams?.get('state') || '';
        
        console.log('🔍 [Frontend] Google callback:', { 
          code: code ? '***' : 'none',
          state: state ? '***' : 'none'
        });
        
        if (!code) {
          throw new Error('No authorization code from Google. Please try again.');
        }
        
        // Call backend
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/google/`,
          {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              code,
              redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_REDIRECT_URI,
              state: state || null,
            }),
          }
        );

        // Check content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('❌ [Frontend] Backend returned HTML:', text.substring(0, 500));
          throw new Error('Server error. Please check backend logs.');
        }

        const data = await response.json();
        console.log('🔍 [Frontend] Backend response:', data);

        if (data.error) {
          throw new Error(data.error);
        }

        // Check if user needs to complete registration
        if (data.needs_registration) {
          console.log('🔍 [Frontend] User needs registration');
          
          // Store OAuth data for registration form
          if (data.access) {
            localStorage.setItem('oauth_access_token', data.access);
            if (data.refresh) {
              localStorage.setItem('oauth_refresh_token', data.refresh);
            }
            localStorage.setItem('oauth_user_data', JSON.stringify(data.user));
            
            // Store invite token if provided
            if (state) {
              localStorage.setItem('invite_token', state);
            }
            
            console.log('🔍 [Frontend] Stored registration data');
            
            // Redirect to registration page
            window.location.href = '/register/complete';
            return;
          }
        }
        
        console.log('🔍 [Frontend] User already registered, logging in');
        // User is fully registered, log them in
        login(data);
        
      } catch (err: any) {
        console.error('❌ [Frontend] OAuth error:', err);
        setError(err.message || 'Authentication failed. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (searchParams) {
      handleGoogleCallback();
    }
  }, [searchParams, login, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#2A2A2A] flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Authenticating with Google...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7CFC9D] mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#2A2A2A] flex items-center justify-center">
        <div className="text-white text-center max-w-md p-6">
          <h1 className="text-2xl font-bold mb-4 text-red-400">Authentication Error</h1>
          <div className="mb-6 p-4 bg-red-500/20 rounded-lg border border-red-500">
            <p className="font-medium mb-2">Error details:</p>
            <p className="text-sm">{error}</p>
          </div>
          <div className="space-y-3">
            <button 
              onClick={() => router.push('/')}
              className="w-full bg-gray-600 px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Login
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2A2A2A] flex items-center justify-center">
      <div className="text-center">
        <div className="text-white text-xl mb-4">Redirecting...</div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7CFC9D] mx-auto"></div>
      </div>
    </div>
  );
}