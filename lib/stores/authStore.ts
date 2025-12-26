// lib/stores/authStore.ts - FIXED
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

interface AuthState {
  user: FrontendUser | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (authData: AuthResponse) => void;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
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
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: true,

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
          isLoading: false
        });
        
        console.log('✅ [AuthStore] Login complete, user:', frontendUser);
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

        // Clear OAuth-specific localStorage items only
        localStorage.removeItem('pending_invite_token');
        
        set({ user: null, token: null, refreshToken: null, isLoading: false });
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
        refreshToken: state.refreshToken 
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setLoading(false);
        }
      }
    }
  )
);

export const useAuth = () => useAuthStore();