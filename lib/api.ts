// lib/api.ts - FIXED with better error handling
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

export interface BackendRole {
  id: number;
  role_name: 'mod' | 'manager' | 'member';
}

export interface BackendUser {
  id: number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  role: BackendRole;
  invite_token?: string;
  is_verified?: boolean;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: BackendUser;
  needs_registration?: boolean;
  invite_token_valid?: boolean;
  message?: string;
  error?: string;
}

export interface FrontendUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'member';
  backendRole: 'mod' | 'manager' | 'member';
}

const roleMap: Record<'mod' | 'manager' | 'member', 'admin' | 'manager' | 'member'> = {
  'mod': 'admin',
  'manager': 'manager',
  'member': 'member'
};

export const formatFrontendUser = (backendUser: BackendUser): FrontendUser => {
  const backendRole = backendUser.role?.role_name || 'member';
  
  return {
    id: backendUser.id.toString(),
    name: backendUser.first_name && backendUser.last_name 
      ? `${backendUser.first_name} ${backendUser.last_name}`
      : backendUser.username || backendUser.email?.split('@')[0] || 'User',
    email: backendUser.email,
    role: roleMap[backendRole],
    backendRole: backendRole,
  };
};

// Helper function to parse response
const parseResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type');
  
  if (!contentType || !contentType.includes('application/json')) {
    // If not JSON, try to get text
    const text = await response.text();
    console.error('❌ Non-JSON response:', text.substring(0, 200));
    throw new Error(`Server returned ${response.status}: ${response.statusText}. Expected JSON but got: ${contentType}`);
  }
  
  return response.json();
};

export const logout = async (refreshToken: string) => {
  try {
    const response = await fetch(`${API_BASE}/auth/logout/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    return response.ok;
  } catch (error) {
    console.warn('Logout failed:', error);
    return false;
  }
};

export const googleLogin = async (code: string, redirectUri: string, inviteToken?: string): Promise<AuthResponse> => {
  console.log('🔍 [API] Google login:', { code, redirectUri, inviteToken });
  
  const payload: any = {
    code,
    redirect_uri: redirectUri
  };
  
  if (inviteToken) {
    payload.state = inviteToken;
  }
  
  try {
    const response = await fetch(`${API_BASE}/auth/google/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await parseResponse(response);
    console.log('🔍 [API] Google login response:', data);

    // Handle 200 OK responses that might have errors in them
    if (response.ok) {
      return data;
    }

    // For non-200 responses, throw an error
    throw new Error(data.error || data.detail || `Authentication failed: ${response.status}`);
    
  } catch (error: any) {
    console.error('❌ [API] Google login error:', error);
    throw error;
  }
};


// Traditional login
export const traditionalLogin = async (username: string, password: string): Promise<AuthResponse> => {
  const response = await fetch(`${API_BASE}/auth/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || `Login failed: ${response.status}`);
  }

  return data;
};

// Get user profile
export const getUserProfile = async (token: string): Promise<BackendUser> => {
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

// Complete registration (for OAuth users)
export const completeRegistration = async (
  token: string, 
  data: {
    invite_token: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
    academic_level?: string;
    tags?: number[];
    school?: string | number;
  }
): Promise<any> => {
  const response = await fetch(`${API_BASE}/complete-registration/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || result.detail || 'Registration failed');
  }

  return result;
};

// Verify invite token
export const verifyInviteToken = async (token: string): Promise<{
  valid: boolean;
  token: string;
  token_display: string;
  usage_count: number;
  message: string;
  error?: string;
}> => {
  const response = await fetch(`${API_BASE}/verify-token/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Token verification failed');
  }

  return data;
};

// Check if user exists by email
export const checkUserExists = async (email: string): Promise<{
  exists: boolean;
  has_completed_registration?: boolean;
  first_name?: string;
  last_name?: string;
}> => {
  const response = await fetch(`${API_BASE}/check-user-exists/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    throw new Error('Failed to check user existence');
  }

  return await response.json();
};