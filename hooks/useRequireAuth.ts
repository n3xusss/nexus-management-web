// hooks/useRequireAuth.ts - UPDATED
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/stores/authStore';

export function useRequireAuth() {
  const { user, isLoading, oauthPending } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not loading and no user (and no pending OAuth), redirect to login
    if (!isLoading && !user && !oauthPending) {
      router.push('/');
    }
  }, [user, isLoading, oauthPending, router]);

  return { user, isLoading, oauthPending };
}