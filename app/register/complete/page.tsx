// app/register/complete/page.tsx - FIXED VERSION
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import RegistrationForm from '../../../components/RegistrationForm';

export default function CompleteRegistrationPage() {
  const router = useRouter();
  const [hasPendingRegistration, setHasPendingRegistration] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Add a small delay to ensure localStorage is available after navigation
    const checkTimeout = setTimeout(() => {
      console.log('🔍 CompleteRegistrationPage - Starting check...');
      
      // Check if we have pending registration data
      const accessToken = localStorage.getItem('oauth_access_token');
      const refreshToken = localStorage.getItem('oauth_refresh_token');
      const userData = localStorage.getItem('oauth_user_data');
      const inviteToken = localStorage.getItem('invite_token');
      
      console.log('🔍 CompleteRegistrationPage - localStorage data:', {
        hasAccessToken: !!accessToken,
        accessTokenLength: accessToken?.length || 0,
        hasRefreshToken: !!refreshToken,
        hasUserData: !!userData,
        hasInviteToken: !!inviteToken,
        inviteToken: inviteToken,
        allKeys: Object.keys(localStorage)
      });
      
      if (!accessToken || !inviteToken) {
        console.log('❌ Missing registration data');
        
        // Check if user is already logged in (has auth-storage)
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          try {
            const auth = JSON.parse(authStorage);
            if (auth.state?.user) {
              console.log('✅ User already logged in, redirecting to /global');
              router.push('/global');
              setChecking(false);
              return;
            }
          } catch (e) {
            console.error('Failed to parse auth storage:', e);
          }
        }
        
        console.log('Redirecting to home');
        
        // Clear any partial data
        localStorage.removeItem('oauth_access_token');
        localStorage.removeItem('oauth_refresh_token');
        localStorage.removeItem('oauth_user_data');
        localStorage.removeItem('invite_token');
        
        router.push('/');
      } else {
        console.log('✅ All registration data present, showing form');
        setHasPendingRegistration(true);
      }
      
      setChecking(false);
    }, 200); // Small delay to ensure localStorage is ready

    return () => clearTimeout(checkTimeout);
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#2A2A2A] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7CFC9D] mx-auto mb-4"></div>
          <p>Checking registration status...</p>
        </div>
      </div>
    );
  }

  if (!hasPendingRegistration) {
    return (
      <div className="min-h-screen bg-[#2A2A2A] flex items-center justify-center">
        <div className="text-white text-center">
          <p>Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2A2A2A] text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Complete Your Registration</h1>
            <p className="text-gray-400">
              Please fill in the remaining details to complete your registration.
            </p>
          </div>
          
          <RegistrationForm />
        </div>
      </div>
    </div>
  );
}