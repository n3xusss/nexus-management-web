'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../lib/stores/authStore';

export function useRegistrationCheck() {
  const { user, isLoading } = useAuth();
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Skip if loading
    if (isLoading) {
      setChecking(true);
      return;
    }

    // If no user, no registration needed
    if (!user) {
      setNeedsRegistration(false);
      setChecking(false);
      return;
    }

    // Check if user has completed their profile
    // Also check for OAuth data in localStorage
    const hasCompleteProfile = user.firstName && user.lastName;
    
    // Check for OAuth data
    const oauthAccessToken = localStorage.getItem('oauth_access_token');
    const oauthUserData = localStorage.getItem('oauth_user_data');
    
    if (oauthAccessToken && oauthUserData) {
      try {
        const parsedUser = JSON.parse(oauthUserData);
        const oauthHasCompleteProfile = parsedUser.first_name && parsedUser.last_name;
        
        if (!oauthHasCompleteProfile) {
          console.log('🔍 OAuth user needs registration (from localStorage)');
          setNeedsRegistration(true);
          setChecking(false);
          return;
        }
      } catch (error) {
        console.error('Failed to parse OAuth data:', error);
      }
    }
    
    console.log('🔍 Registration check:', {
      hasUser: !!user,
      firstName: user?.firstName,
      lastName: user?.lastName,
      needsRegistration: !hasCompleteProfile
    });
    
    setNeedsRegistration(!hasCompleteProfile);
    setChecking(false);
  }, [user, isLoading]);

  return { needsRegistration, checking };
}