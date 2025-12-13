// app/hooks/useRegistrationCheck.ts - FIXED
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../lib/stores/authStore';

export function useRegistrationCheck() {
  const { user, token, isLoading } = useAuth();
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkRegistration = async () => {
      if (isLoading) return;
      if (!user || !token) {
        setNeedsRegistration(false);
        setChecking(false);
        return;
      }

      setChecking(true);

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/check-registration/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          console.error('Failed to check registration status');
          setNeedsRegistration(false);
          setChecking(false);
          return;
        }

        const data = await res.json();
        console.log('🔍 Registration check result:', data);
        setNeedsRegistration(data.needs_registration || false);
      } catch (error) {
        console.error('Registration check error:', error);
        setNeedsRegistration(false);
      } finally {
        setChecking(false);
      }
    };

    checkRegistration();
  }, [user, token, isLoading]);

  return { needsRegistration, checking };
}