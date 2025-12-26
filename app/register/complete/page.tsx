// app/register/complete/page.tsx - SIMPLIFIED AND FIXED
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BackgroundPattern from '../../../components/BackgroundPattern';
import { useAuth } from '../../../lib/stores/authStore';
import RegistrationForm from '../../../components/RegistrationForm';

export default function CompleteRegistrationPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();
  const [shouldShowForm, setShouldShowForm] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkUserState = async () => {
      setIsChecking(true);
      console.log('🔍 CompleteRegistrationPage - Checking user state...');

      // Wait for auth store to initialize
      await new Promise(resolve => setTimeout(resolve, 300));

      // Check 1: Already logged in user with auth store token
      if (user && token && !isLoading) {
        console.log('🔍 User is already logged in via auth store, redirecting to /global');
        router.push('/global');
        return;
      }

      // Check 2: OAuth user data in localStorage (new user or user completing registration)
      const oauthAccessToken = localStorage.getItem('oauth_access_token');
      const oauthUserData = localStorage.getItem('oauth_user_data');
      
      if (oauthAccessToken && oauthUserData) {
        console.log('✅ OAuth user data found, showing registration form');
        setShouldShowForm(true);
        setIsChecking(false);
        return;
      }

      // Check 3: No user data found at all
      console.log('❌ No user data found, redirecting to home');
      router.push('/');
      setIsChecking(false);
    };

    checkUserState();
  }, [user, token, isLoading, router]);

  if (isChecking) {
    return (
      <main className="min-h-screen bg-[#2A2A2A] text-white">
        <BackgroundPattern />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7CFC9D] mx-auto mb-4"></div>
            <p>Checking registration status...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!shouldShowForm) {
    return (
      <main className="min-h-screen bg-[#2A2A2A] text-white">
        <BackgroundPattern />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7CFC9D] mx-auto mb-4"></div>
            <p>Redirecting...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#2A2A2A] text-white">
      <BackgroundPattern />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-4xl">
          <RegistrationForm />
        </div>
      </div>
    </main>
  );
}