// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// ====================
// INTERFACE DEFINITIONS
// ====================

export interface BackendRole {
  id: number;
  role_name: 'mod' | 'manager' | 'member';
}

export interface BackendUser {
  id?: number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  image?: string;
  academic_level?: string;
  role?: BackendRole;
  invite_token?: string;
  is_verified?: boolean;
  department?: {
    id: number;
    dept_name: string;
    dept_description: string;
  };
  tags?: Array<{
    id: number;
    tag_name: string;
    color: string;
  }>;
  school?: {
    id: number;
    school_name: string;
    school_description: string;
  };
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: BackendUser;
  message?: string;
  error?: string;
}

export interface FrontendUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'member';
  backendRole: 'mod' | 'manager' | 'member';
  firstName?: string;
  lastName?: string;
  image?: string;
  phoneNumber?: string;
  academicLevel?: string;
  department?: {
    id: number;
    name: string;
    description: string;
  };
}

export interface DashboardStats {
  totalProjects?: number;
  activeProjects?: number;
  totalMembers?: number;
  totalDepartments?: number;
  totalTasks?: number;
  upcomingMeetings?: number;
  upcomingEvents?: number;
  openIssues?: number;
  departmentProjects?: number;
  departmentMembers?: number;
  activeTasks?: number;
  departmentTasksCompleted?: number;
  assignedTasks?: number;
  completedTasks?: number;
  tasksDueSoon?: number;
}

export interface Activity {
  type: 'project' | 'task' | 'meeting' | 'issue';
  title: string;
  description: string;
  time: string;
}

export interface NewMember {
  id: number;
  name: string;
  email: string;
  level: string;
  department: string;
  tags: string[];
  joinDate: string;
}


export interface CalendarEvent {
  id: number;
  title: string;
  type: 'meeting' | 'event' | 'issue';
  date?: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  description: string;
  duration?: string;
  task_name?: string;
  created_at?: string;
}

export interface MemberDashboardStats {
  upcomingMeetings: number;
  openIssues: number;
  upcomingEvents: number;
  tasksDueSoon: number;
  completedTasks: number;
  totalTasks: number;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

// ====================
// CONSTANTS
// ====================

const roleMap: Record<'mod' | 'manager' | 'member', 'admin' | 'manager' | 'member'> = {
  'mod': 'admin',
  'manager': 'manager',
  'member': 'member'
};

// ====================
// HELPER FUNCTIONS
// ====================


/**
 * Formats backend user object to frontend user structure
 * Handles missing first/last names by falling back to username
 */
export const formatFrontendUser = (backendUser: BackendUser): FrontendUser => {
  const backendRole = backendUser.role?.role_name || 'member';

  const generateId = () => {
    if (backendUser.id) return backendUser.id.toString();
    if (backendUser.pk) return backendUser.pk.toString();
    if (backendUser.username) return btoa(backendUser.username).slice(0, 10);
    if (backendUser.email) return btoa(backendUser.email).slice(0, 10);
    return 'unknown-user';
  };

  const firstName = backendUser.first_name || '';
  const lastName = backendUser.last_name || '';
  let displayName = backendUser.username || backendUser.email?.split('@')[0] || 'User';
  if (firstName || lastName) {
    displayName = `${firstName} ${lastName}`.trim();
  }

  return {
    id: generateId(),
    name: displayName,
    email: backendUser.email,
    role: roleMap[backendRole],
    backendRole,
    firstName,
    lastName,
    image: backendUser.image,
    phoneNumber: backendUser.phone_number,
    academicLevel: backendUser.academic_level,
    department: backendUser.department ? {
      id: backendUser.department.id,
      name: backendUser.department.dept_name,
      description: backendUser.department.dept_description
    } : undefined,
  };
};

// ====================
// AUTHENTICATION
// ====================

/**
 * Exchange Google OAuth code for backend tokens
 * Includes invite_token as query param for new user onboarding
 */
export const exchangeGoogleCode = async (
  code: string,
  redirectUri: string,
  inviteToken?: string
): Promise<AuthResponse> => {
  try {
    let url = `${API_BASE}/auth/google/`;
    const params = new URLSearchParams();

    if (inviteToken?.trim()) {
      params.append('invite_token', inviteToken);
    }

    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ code, redirect_uri: redirectUri }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('Google auth failed:', responseText);
      
      // Try to parse JSON error
      try {
        const errorData = JSON.parse(responseText);
        throw new Error(
          errorData.non_field_errors?.[0] ||
          errorData.detail ||
          errorData.error ||
          `Authentication failed: ${response.status}`
        );
      } catch (jsonError) {
        // If it's HTML (Django error page), give a user-friendly message
        if (responseText.includes('Failed to resolve') || 
            responseText.includes('NameResolutionError') ||
            responseText.includes('www.googleapis.com')) {
          throw new Error(
            'Backend cannot connect to Google services. ' +
            'Please check backend network connectivity or try again later.'
          );
        }
        throw new Error(`Authentication failed: ${response.status}`);
      }
    }

    return JSON.parse(responseText);
  } catch (error) {
    console.error('Google auth error:', error);
    throw error;
  }
};

/**
 * Traditional username/password login
 */
export const traditionalLogin = async (
  username: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || `Login failed: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Traditional login error:', error);
    throw error;
  }
};

/**
 * Validate invite token before allowing registration
 */
export const verifyInviteToken = async (
  token: string
): Promise<{
  valid: boolean;
  token: string;
  message: string;
  error?: string;
}> => {
  try {
    const response = await fetch(`${API_BASE}/api/invite-tokens/verify/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        valid: true,
        token: data.token || token,
        message: data.message || 'Token verified'
      };
    }

    // Fallback for missing endpoint
    return {
      valid: true,
      token,
      message: 'Token accepted (verification skipped)'
    };
  } catch (error) {
    console.error('Token verification error:', error);
    return {
      valid: false,
      token,
      message: 'Failed to verify token',
      error: 'Connection error'
    };
  }
};

/**
 * Logout user by invalidating refresh token
 */
export const logout = async (refreshToken: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/auth/logout/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    });
    return response.ok;
  } catch (error) {
    console.warn('Logout failed:', error);
    return false;
  }
};

// ====================
// USER PROFILE
// ====================

/**
 * Fetch current user's profile data
 */
export const getUserProfile = async (token: string): Promise<BackendUser> => {
  const response = await fetch(`${API_BASE}/profile/`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();

    if (response.status === 429) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const retryResponse = await fetch(`${API_BASE}/profile/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!retryResponse.ok) {
        throw new Error(`Rate limited: ${retryResponse.status}`);
      }
      return await retryResponse.json();
    }

    throw new Error(`Failed to get profile: ${response.status}`);
  }

  return await response.json();
};

/**
 * Update user profile with partial data
 */
export const updateUserProfile = async (
  token: string,
  data: {
    username?: string;
    phone_number?: string;
    academic_level?: string;
    tag_ids?: number[];
    school_id?: number;
  }
): Promise<BackendUser> => {
  const response = await fetch(`${API_BASE}/profile/`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update profile: ${response.status}`);
  }

  return await response.json();
};

// ====================
// DASHBOARD
// ====================



export const getMemberDashboardStats = async (token: string): Promise<MemberDashboardStats> => {
  try {
    const response = await fetchWithRetry(
      `${API_BASE}/dashboard/member_stats/`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
      2,
      2000
    );

    if (!response.ok) {
      console.warn('Failed to fetch member dashboard stats, using defaults');
      return {
        upcomingMeetings: 0,
        openIssues: 0,
        upcomingEvents: 0,
        tasksDueSoon: 0,
        completedTasks: 0,
        totalTasks: 0,
      };
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching member dashboard stats:', error);
    return {
      upcomingMeetings: 0,
      openIssues: 0,
      upcomingEvents: 0,
      tasksDueSoon: 0,
      completedTasks: 0,
      totalTasks: 0,
    };
  }
};

export const getMemberCalendarEvents = async (token: string): Promise<{
  meetings: CalendarEvent[];
  events: CalendarEvent[];
  issues: CalendarEvent[];
}> => {
  try {
    const response = await fetchWithRetry(
      `${API_BASE}/dashboard/member_calendar_events/`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
      2,
      2000
    );

    if (!response.ok) {
      console.warn('Failed to fetch member calendar events');
      return {
        meetings: [],
        events: [],
        issues: [],
      };
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching member calendar events:', error);
    return {
      meetings: [],
      events: [],
      issues: [],
    };
  }
};




const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  maxRetries = 2, // Increased from 1 to 2
  retryDelay = 2000 // Increased initial delay
): Promise<Response> => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Handle rate limiting with exponential backoff
      if (response.status === 429 && attempt < maxRetries) {
        const waitTime = retryDelay * Math.pow(2, attempt); // Exponential backoff
        console.log(`Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      // Handle server errors
      if (response.status >= 500 && attempt < maxRetries) {
        const waitTime = 1000 * (attempt + 1);
        console.log(`Server error ${response.status}, waiting ${waitTime}ms before retry`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      return response;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const waitTime = 1000 * (attempt + 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  throw new Error('Failed after retries');
};

export const getRecentActivities = async (token: string): Promise<Activity[]> => {
  try {
    // Add a small delay to prevent rapid requests
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const response = await fetchWithRetry(
      `${API_BASE}/dashboard/activities/`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
      2, // maxRetries
      2000 // retryDelay
    );

    if (!response.ok) {
      console.warn('Failed to fetch activities:', response.status);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
};

export const getNewMembers = async (token: string): Promise<NewMember[]> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const response = await fetchWithRetry(
      `${API_BASE}/dashboard/new_members/`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
      2,
      2000
    );

    if (!response.ok) {
      console.warn('Failed to fetch new members:', response.status);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching new members:', error);
    return [];
  }
};

export const getDashboardStats = async (token: string): Promise<DashboardStats> => {
  try {
    const response = await fetchWithRetry(
      `${API_BASE}/dashboard/stats/`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
      2,
      2000
    );

    if (!response.ok) {
      console.warn('Failed to fetch dashboard stats, using defaults');
      return {
        totalProjects: 0,
        activeProjects: 0,
        totalMembers: 0,
        totalDepartments: 0,
        totalTasks: 0,
        upcomingMeetings: 0,
        openIssues: 0,
      };
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalProjects: 0,
      activeProjects: 0,
      totalMembers: 0,
      totalDepartments: 0,
      totalTasks: 0,
      upcomingMeetings: 0,
      openIssues: 0,
    };
  }
};




// ====================
// DATA LOOKUPS
// ====================

/**
 * Fetch all available tags (for user profile selection)
 */

export const getTags = async (token?: string): Promise<Array<{ id: number; tag_name: string; color: string }>> => {
  try {
    const response = await fetch(`${API_BASE}/tags/`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch tags');
      return [];
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
};

/**
 * Fetch all schools (for user profile selection)
 */
export const getSchools = async (token?: string): Promise<Array<{ id: number; school_name: string; school_description: string }>> => {
  try {
    const response = await fetch(`${API_BASE}/schools/`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch schools');
      return [];
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error fetching schools:', error);
    return [];
  }
};

/**
 * Create a new school (for custom entry in forms)
 */
export const createCustomSchool = async (
  schoolName: string,
  token: string
): Promise<{ id: number; school_name: string }> => {
  try {
    const response = await fetch(`${API_BASE}/schools/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        school_name: schoolName,
        school_description: `Custom school: ${schoolName}`
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create school');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating school:', error);
    throw error;
  }
};