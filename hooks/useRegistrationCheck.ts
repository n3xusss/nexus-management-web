// hooks/useRegistrationCheck.ts - UPDATED
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../lib/stores/authStore';

export function useRegistrationCheck() {
  const { user, isLoading, oauthPending } = useAuth(); // Added oauthPending
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Skip if loading
    if (isLoading) {
      setChecking(true);
      return;
    }

    // Check 1: OAuth pending registration
    if (oauthPending) {
      console.log('🔍 OAuth user needs registration (from auth store)');
      setNeedsRegistration(true);
      setChecking(false);
      return;
    }

    // Check 2: Logged in user without complete profile
    if (user) {
      const hasCompleteProfile = user.firstName && user.lastName;
      console.log('🔍 Registration check:', {
        hasUser: !!user,
        firstName: user?.firstName,
        lastName: user?.lastName,
        needsRegistration: !hasCompleteProfile
      });
      
      setNeedsRegistration(!hasCompleteProfile);
      setChecking(false);
      return;
    }

    // No user
    setNeedsRegistration(false);
    setChecking(false);
  }, [user, isLoading, oauthPending]);

  return { needsRegistration, checking };
}