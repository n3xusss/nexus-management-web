import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logout, exchangeGoogleCode, formatFrontendUser, traditionalLogin, FrontendUser, AuthResponse } from '../api';

interface AuthState {
  user: FrontendUser | null;
  token: string | null;
  isLoading: boolean;
  refreshToken: string | null;
  login: (userData: FrontendUser, authToken: string, refreshToken?: string) => void;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  exchangeGoogleAuth: (code: string) => Promise<{ user: FrontendUser; token: string; refreshToken?: string }>;
  traditionalAuth: (username: string, password: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isLoading: true,
      refreshToken: null,

      // Actions
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      login: (userData: FrontendUser, authToken: string, refreshToken?: string) => {
        console.log('Zustand login:', userData);
        set({ 
          user: userData, 
          token: authToken, 
          isLoading: false,
          refreshToken: refreshToken || null // local storage will be triggered only if value changes
        });
        
        console.log('Login complete, redirecting to /global');
        window.location.href = '/global';
      },

      logout: async () => {
        const { refreshToken } = get();
        
        try {
          // Try to invalidate refresh token on server
          if (refreshToken) {
            await logout(refreshToken);
            console.log('Server-side logout successful');
          }
        } catch (error) {
          console.warn('Server logout failed, continuing with client-side logout:', error);
        }

        // Clear client state
        set({ user: null, token: null, refreshToken: null, isLoading: false });
        console.log('Logout complete, redirecting to /');
        window.location.href = '/';
      },

      exchangeGoogleAuth: async (code: string) => {
        console.log('Exchanging Google code for token...', code);
        const data: AuthResponse = await exchangeGoogleCode(code);
        const frontendUser = formatFrontendUser(data.user);
        
        console.log('Google auth exchange successful:', frontendUser);
        return { 
          user: frontendUser, 
          token: data.access,
          refreshToken: data.refresh 
        };
      },

      traditionalAuth: async (username: string, password: string) => {
        console.log('Traditional auth attempt for:', username);
        const data = await traditionalLogin(username, password);
        
        if (data.access && data.user) {
          const userData = {
            id: data.user.id.toString(),
            name: data.user.username || data.user.email,
            email: data.user.email,
            role: data.user.role || 'member'
          };

          console.log('Traditional auth successful:', userData);
          get().login(userData, data.access, data.refresh);
        } else {
          throw new Error('Invalid response from server');
        }
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
          
          // Force admin role on rehydration too
          if (state.user && (state.user.email === 'nexus@estin.dz' || state.user.name === 'nexus')) {
            console.log('Rehydrated admin user - forcing admin role');
            state.user.role = 'admin';
          }
        }
      }
    }
  )
);

// Hook for components to access auth state
export const useAuth = () => {
  const { user, token, isLoading, login, logout, setLoading, exchangeGoogleAuth, traditionalAuth } = useAuthStore();
  
  return {
    user,
    token,
    isLoading,
    login,
    logout,
    setLoading,
    exchangeGoogleAuth,
    traditionalAuth
  };
};