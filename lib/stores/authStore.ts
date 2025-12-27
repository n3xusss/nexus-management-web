// lib/stores/authStore.ts - COMPLETE VERSION
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  logout, 
  formatFrontendUser, 
  traditionalLogin, 
  getUserProfile,
  updateUserProfile,
  FrontendUser, 
  AuthResponse,
  BackendUser
} from '../api';

interface OAuthPendingData {
  access: string;
  refresh: string;
  user: BackendUser;
  inviteToken?: string;
}

interface AuthState {
  user: FrontendUser | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  oauthPending: OAuthPendingData | null;
  inviteToken: string | null;
  
  // Methods
  setLoading: (loading: boolean) => void;
  login: (authData: AuthResponse) => void;
  logout: () => Promise<void>;
  traditionalAuth: (username: string, password: string) => Promise<void>;
  loadUserFromToken: () => Promise<void>;
  updateProfile: (data: FormData | {
    username?: string;
    phone_number?: string;
    academic_level?: string;
    tag_ids?: number[];
    school_id?: number;
    image?: File | null;
  }) => Promise<FrontendUser>;
  checkProfileCompletion: () => boolean;
  
  // OAuth methods
  setOAuthPending: (data: OAuthPendingData) => void;
  clearOAuthPending: () => void;
  completeOAuthRegistration: (updatedUser: BackendUser) => void;
  
  // Invite token methods
  setInviteToken: (token: string) => void;
  clearInviteToken: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: true,
      oauthPending: null,
      inviteToken: null,

      setLoading: (loading) => set({ isLoading: loading }),

      login: (authData: AuthResponse) => {
        console.log('🔍 [AuthStore] Login with auth data:', authData);
        
        if (!authData.user || !authData.access) {
          console.error('Invalid auth data:', authData);
          return;
        }
        
        const frontendUser = formatFrontendUser(authData.user);
        
        set({ 
          user: frontendUser, 
          token: authData.access, 
          refreshToken: authData.refresh,
          isLoading: false,
          oauthPending: null,
          inviteToken: null // Clear any invite token on successful login
        });
        
        console.log('✅ [AuthStore] Login complete, user:', frontendUser);
      },

      setOAuthPending: (data: OAuthPendingData) => {
        console.log('🔍 [AuthStore] Setting OAuth pending data:', data);
        set({ oauthPending: data, isLoading: false });
      },

      clearOAuthPending: () => {
        console.log('🔍 [AuthStore] Clearing OAuth pending data');
        set({ oauthPending: null });
      },

      completeOAuthRegistration: (updatedUser: BackendUser) => {
        const { oauthPending } = get();
        if (!oauthPending) {
          console.error('No pending OAuth data to complete');
          return;
        }

        console.log('🔍 [AuthStore] Completing OAuth registration with user:', updatedUser);
        
        // Merge updated user data with OAuth tokens
        const authData: AuthResponse = {
          access: oauthPending.access,
          refresh: oauthPending.refresh,
          user: updatedUser
        };
        
        get().login(authData);
      },

      setInviteToken: (token: string) => {
        console.log('🔍 [AuthStore] Setting invite token:', token);
        set({ inviteToken: token });
      },

      clearInviteToken: () => {
        console.log('🔍 [AuthStore] Clearing invite token');
        set({ inviteToken: null });
      },

      logout: async () => {
        const { refreshToken } = get();
        
        try {
          if (refreshToken) {
            await logout(refreshToken);
          }
        } catch (error) {
          console.warn('Server logout failed:', error);
        }

        // Clear ALL legacy localStorage items

        
        set({ 
          user: null, 
          token: null, 
          refreshToken: null, 
          isLoading: false,
          oauthPending: null,
          inviteToken: null 
        });
        window.location.href = '/';
      },

      traditionalAuth: async (username: string, password: string) => {
        console.log('Traditional auth for:', username);
        const authData = await traditionalLogin(username, password);
        get().login(authData);
      },

      loadUserFromToken: async () => {
        const { token } = get();
        if (!token) {
          set({ isLoading: false });
          return;
        }

        try {
          const backendUser = await getUserProfile(token);
          const frontendUser = formatFrontendUser(backendUser);
          set({ user: frontendUser, isLoading: false });
        } catch (error) {
          console.error('Failed to load user from token:', error);
          set({ isLoading: false });
        }
      },

      updateProfile: async (data) => {
        const { token } = get();
        if (!token) {
          throw new Error('No authentication token');
        }

        try {
          const updatedUser = await updateUserProfile(token, data);
          const frontendUser = formatFrontendUser(updatedUser);
          set({ user: frontendUser });
          return frontendUser;
        } catch (error) {
          console.error('Failed to update profile:', error);
          throw error;
        }
      },

      checkProfileCompletion: () => {
        const { user } = get();
        return !!(user?.firstName && user?.lastName);
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token,
        refreshToken: state.refreshToken,
        oauthPending: state.oauthPending,
        inviteToken: state.inviteToken
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Clear legacy localStorage items on rehydration
          const legacyItems = [
            'oauth_access_token',
            'oauth_refresh_token', 
            'oauth_user_data',
            'pending_invite_token'
          ];
          
          legacyItems.forEach(item => {
            localStorage.removeItem(item);
            sessionStorage.removeItem(item);
          });
          
          state.setLoading(false);
        }
      }
    }
  )
);

export const useAuth = () => useAuthStore();