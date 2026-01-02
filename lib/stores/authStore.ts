// lib/stores/authStore.ts - Cleaned up version
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  logout, 
  formatFrontendUser, 
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

// Create the store
export const authStore = create<AuthState>()(
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
          inviteToken: null
        });
      },

      setOAuthPending: (data: OAuthPendingData) => {
        set({ oauthPending: data, isLoading: false });
      },

      clearOAuthPending: () => {
        set({ oauthPending: null });
      },

      completeOAuthRegistration: (updatedUser: BackendUser) => {
        const { oauthPending } = get();
        if (!oauthPending) {
          console.error('No pending OAuth data to complete');
          return;
        }
        
        const authData: AuthResponse = {
          access: oauthPending.access,
          refresh: oauthPending.refresh,
          user: updatedUser
        };
        
        get().login(authData);
      },

      setInviteToken: (token: string) => {
        set({ inviteToken: token });
      },

      clearInviteToken: () => {
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
            console.log("AuthStore: Updating profile with data:", data);
            
            let updatedUser: BackendUser;
            
            if (data instanceof FormData) {
              // Handle FormData for file uploads
              console.log("AuthStore: Using FormData");
              
              const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/profile/`, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  // Don't set Content-Type for FormData - browser will set it with boundary
                },
                body: data,
              });

              if (!response.ok) {
                const errorText = await response.text();
                console.error('AuthStore: Profile update failed:', errorText);
                throw new Error(`Failed to update profile: ${response.status}`);
              }

              updatedUser = await response.json();
            } else {
              // Handle regular JSON data
              console.log("AuthStore: Using JSON data");
              
              const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/profile/`, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
              });

              if (!response.ok) {
                const errorText = await response.text();
                console.error('AuthStore: Profile update failed:', errorText);
                throw new Error(`Failed to update profile: ${response.status}`);
              }

              updatedUser = await response.json();
            }
            
            console.log("AuthStore: Updated user from backend:", updatedUser);
            console.log("AuthStore: Updated user role:", updatedUser.role);
            
            const frontendUser = formatFrontendUser(updatedUser);
            console.log("AuthStore: Formatted frontend user:", frontendUser);
            
            set({ user: frontendUser });
            return frontendUser;
          } catch (error) {
            console.error('AuthStore: Failed to update profile:', error);
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
          state.setLoading(false);
        }
      }
    }
  )
);

// Export the hook
export const useAuth = () => authStore();