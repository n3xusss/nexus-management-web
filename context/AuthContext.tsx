'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { exchangeGoogleCode, formatFrontendUser, FrontendUser, AuthResponse } from '../lib/api';

interface AuthContextType {
  user: FrontendUser | null;
  token: string | null;
  login: (userData: FrontendUser, authToken: string) => void;
  logout: () => void;
  isLoading: boolean;
  exchangeGoogleAuth: (code: string) => Promise<{ user: FrontendUser; token: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FrontendUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const userData = localStorage.getItem('user');
        const authToken = localStorage.getItem('auth_token');
        
        console.log('Auth check - userData:', userData, 'token:', authToken);
        
        if (userData && authToken) {
          let parsedUser = JSON.parse(userData);

          
          console.log('Found user in storage:', parsedUser);
          setUser(parsedUser);
          setToken(authToken);
        } else {
          console.log('No auth data found in storage');
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (userData: FrontendUser, authToken: string) => {
    console.log('Logging in user:', userData);
    
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('auth_token', authToken);
    
    console.log('Login complete, redirecting to /global');
    window.location.href = '/global';
  };

  const logout = () => {
    console.log('Logging out...');
    
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    
    console.log('Logout complete, redirecting to /');
    window.location.href = '/';
  };

  const exchangeGoogleAuth = async (code: string) => {
    console.log('Exchanging Google code for token...', code);
    
    const data: AuthResponse = await exchangeGoogleCode(code);
    const frontendUser = formatFrontendUser(data.user);
    
    console.log('Google auth exchange successful:', frontendUser);
    return { user: frontendUser, token: data.access };
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      isLoading,
      exchangeGoogleAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}