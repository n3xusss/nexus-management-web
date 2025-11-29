// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

export interface BackendUser {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  role?: 'admin' | 'manager' | 'member'; 
}

export interface AuthResponse {
  user: BackendUser;
  access: string;
  non_field_errors?: string[];
}

export interface FrontendUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'member'; 
}

export const exchangeGoogleCode = async (code: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE}/auth/google/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
      redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_REDIRECT_URI
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.warn('Backend OAuth warning:', data);
    
    if (data.user && data.access) {
      console.log('Proceeding with user data despite warning');
      return data;
    }
    
    const errorData = await response.json().catch(() => ({}));
    throw new Error(data.non_field_errors?.[0] || `Authentication failed: ${response.status}`);
  }

  if (!data.access || !data.user) {
    throw new Error('Invalid response format from backend');
  }

  return data;
};

export const formatFrontendUser = (backendUser: BackendUser): FrontendUser => {
  return {
    id: backendUser.id.toString(),
    name: backendUser.first_name && backendUser.last_name 
      ? `${backendUser.first_name} ${backendUser.last_name}`
      : backendUser.username || backendUser.email?.split('@')[0] || 'User',
    email: backendUser.email,
    role: backendUser.role || 'member',
  };
};

export const getUserProfile = async (token: string) => {
  const response = await fetch(`${API_BASE}/auth/user/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get user profile: ${response.status}`);
  }

  return await response.json();
};

export const traditionalLogin = async (username: string, password: string) => {
  const response = await fetch(`${API_BASE}/auth/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || `Login failed: ${response.status}`);
  }

  return data;
};