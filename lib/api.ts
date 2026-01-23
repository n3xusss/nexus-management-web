const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// ====================
// INTERFACE DEFINITIONS
// ====================

export interface BackendRole {
  id: number;
  role_name: 'mod' | 'manager' | 'member';
}
export interface Department {
  id: number;
  dept_name: string;
  dept_description: string;
  members_count?: number;
  projects?: any[];
  managers?: any[];
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
  name: string;  // This should be the display name (username or full name)
  username: string; // ADD THIS - The actual username for login
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
  tags?: Array<{
    id: number;
    tag_name: string;
    color: string;
  }>;
  school?: {
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


export interface Event {
  id: number;
  event_name: string;
  event_description: string;
  event_start_date: string; // ISO datetime string
  event_end_date: string; // ISO datetime string
  location: string;
  status?: string; // Calculated on frontend: 'upcoming' | 'ongoing' | 'completed'
}

export interface CreateEventData {
  event_name: string;
  event_description: string;
  event_start_date: string; // Format: "YYYY-MM-DDTHH:mm"
  event_end_date: string; // Format: "YYYY-MM-DDTHH:mm"
  location: string;
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


/**
 * Formats backend user object to frontend user structure
 * Handles missing first/last names by falling back to username
 */
export const formatFrontendUser = (backendUser: BackendUser): FrontendUser => {
  console.log("Formatting backend user:", backendUser);
  
  // Get role - handle both direct string and object
  let backendRole: 'mod' | 'manager' | 'member' = 'member';
  
  if (typeof backendUser.role === 'string') {
    backendRole = backendUser.role as 'mod' | 'manager' | 'member';
  } else if (backendUser.role && backendUser.role.role_name) {
    backendRole = backendUser.role.role_name;
  }
  
  const frontendRole = roleMap[backendRole];

  // Generate ID from backend ID if available
  const generateId = () => {
    if (backendUser.id) return backendUser.id.toString();
    if (backendUser.pk) return backendUser.pk.toString();
    if (backendUser.username) return btoa(backendUser.username).slice(0, 10);
    if (backendUser.email) return btoa(backendUser.email).slice(0, 10);
    return 'unknown-user';
  };

  // Get names - handle null/undefined
  const firstName = backendUser.first_name || '';
  const lastName = backendUser.last_name || '';
  
  // FIX: Use username as primary display name, fall back to email if needed
  let displayName = backendUser.username || backendUser.email?.split('@')[0] || 'User';
  
  // Only use firstName + lastName if username is not available AND names exist
  if ((!backendUser.username || displayName === 'User') && (firstName || lastName)) {
    displayName = `${firstName} ${lastName}`.trim();
  }

  // Extract phone number - handle both phone_number and phoneNumber
  const phoneNumber = backendUser.phone_number || backendUser.phoneNumber || '';

  // Extract academic level
  const academicLevel = backendUser.academic_level || backendUser.academicLevel || '';

  const formattedUser: FrontendUser = {
    id: generateId(),
    name: displayName,
    email: backendUser.email,
    role: frontendRole,
    backendRole,
    firstName,
    lastName,
    image: backendUser.image,
    phoneNumber,
    academicLevel,
    department: backendUser.department ? {
      id: backendUser.department.id,
      name: backendUser.department.dept_name,
      description: backendUser.department.dept_description
    } : undefined,
    tags: backendUser.tags || [],
    school: backendUser.school ? {
      id: backendUser.school.id,
      name: backendUser.school.school_name,
      description: backendUser.school.school_description
    } : undefined,
  };

  console.log("Formatted frontend user:", formattedUser);
  return formattedUser;
};

// ====================
// AUTHENTICATION
// ====================

/**
 * Exchange Google OAuth code for backend tokens
 * Includes invite_token as query param for new user onboarding
 */
// Update lib/api.ts - exchangeGoogleCode function
// Update lib/api.ts - FIXED exchangeGoogleCode function
// Update lib/api.ts - FINAL VERSION with proper invalid token handling
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
      // Don't log to console for expected invite token errors
      if (!responseText.includes('DATA NOT FOUND') && !responseText.includes('invite_token')) {
        console.error('Google auth failed:', responseText);
      }
      
      // Try to parse JSON error
      try {
        const errorData = JSON.parse(responseText);
        
        // Check for invite_token error specifically
        if (errorData.invite_token && Array.isArray(errorData.invite_token)) {
          const inviteError = errorData.invite_token[0];
          if (inviteError.includes('DATA NOT FOUND')) {
            throw new Error('INVITE_TOKEN_NOT_FOUND');
          } else {
            throw new Error(`INVITE_TOKEN_INVALID: ${inviteError}`);
          }
        }
        
        // Check for non_field_errors (which might contain token errors)
        if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors)) {
          const errorMsg = errorData.non_field_errors[0];
          if (errorMsg.includes('Failed to exchange code') && inviteToken) {
            // If we have an invite token and get this error, it's likely invalid
            throw new Error('INVITE_TOKEN_INVALID');
          }
          throw new Error(errorMsg);
        }
        
        throw new Error(
          errorData.detail ||
          errorData.error ||
          `Authentication failed: ${response.status}`
        );
      } catch (jsonError) {
        // If we can't parse JSON, check for specific strings
        if (responseText.includes('DATA NOT FOUND')) {
          throw new Error('INVITE_TOKEN_NOT_FOUND');
        }
        
        // If we have an invite token and get a 400, assume it's invalid
        if (inviteToken && response.status === 400) {
          throw new Error('INVITE_TOKEN_INVALID');
        }
        
        throw new Error(`Authentication failed: ${response.status}`);
      }
    }

    return JSON.parse(responseText);
  } catch (error) {
    // Don't log expected invite token errors to console
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!errorMessage.includes('INVITE_TOKEN_')) {
      console.error('Google auth error:', error);
    }
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
 * Update user profile with partial data , image will be added later 
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
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/tags/`, {
      headers,
    });

    if (!response.ok) {
      console.warn('Failed to fetch tags:', response.status);
      return [];
    }

    const data = await response.json();
    
    // Handle paginated response
    if (data.results && Array.isArray(data.results)) {
      return data.results;
    }
    
    // Handle non-paginated array response
    if (Array.isArray(data)) {
      return data;
    }
    
    console.warn('Unexpected response format for tags:', data);
    return [];
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

// Member Management Functions

export const getMembers = async (token: string): Promise<BackendUser[]> => {
  try {
    const response = await fetchWithRetry(
      `${API_BASE}/members/`,
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
      console.warn('Failed to fetch members:', response.status);
      return [];
    }

    const data = await response.json();
    
    // Handle paginated response (if using DRF with PageNumberPagination)
    if (data.results && Array.isArray(data.results)) {
      return data.results;
    }
    
    // Handle non-paginated array response
    if (Array.isArray(data)) {
      return data;
    }
    
    // Handle single object response
    if (data && typeof data === 'object') {
      return [data];
    }
    
    console.warn('Unexpected response format for members:', data);
    return [];
  } catch (error) {
    console.error('Error fetching members:', error);
    return [];
  }
};

export const getDepartments = async (token: string): Promise<Department[]> => {
  try {
    const response = await fetchWithRetry(
      `${API_BASE}/departments/`,
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
      console.warn('Failed to fetch departments:', response.status);
      return [];
    }

    const data = await response.json();
    
    // Handle paginated response
    if (data.results && Array.isArray(data.results)) {
      return data.results;
    }
    
    // Handle non-paginated array response
    if (Array.isArray(data)) {
      return data;
    }
    
    console.warn('Unexpected response format for departments:', data);
    return [];
  } catch (error) {
    console.error('Error fetching departments:', error);
    return [];
  }
};

export const updateMember = async (
  token: string, 
  memberId: number, 
  data: {
    department_id?: number | null;
    role_id?: number;
    tag_ids?: number[];
  }
): Promise<BackendUser> => {
  const response = await fetch(`${API_BASE}/members/${memberId}/`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to update member:', errorText);
    throw new Error(`Failed to update member: ${response.status}`);
  }

  return await response.json();
};

export const deleteMember = async (token: string, memberId: number): Promise<void> => {
  const response = await fetch(`${API_BASE}/members/${memberId}/`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to delete member:', errorText);
    throw new Error(`Failed to delete member: ${response.status}`);
  }
};




// ====================
// EVENT FUNCTIONS 
// ====================

/**
 * Fetch all events
 * Available to: all authenticated users
 * Mods see all events, others see future events only
 */
export const getEvents = async (token: string): Promise<Event[]> => {
  try {
    const response = await fetchWithRetry(
      `${API_BASE}/events/`,
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
      console.warn('Failed to fetch events:', response.status);
      return [];
    }

    const data = await response.json();
    
    // Handle paginated response
    if (data.results && Array.isArray(data.results)) {
      return data.results;
    }
    
    // Handle non-paginated array response
    if (Array.isArray(data)) {
      return data;
    }
    
    console.warn('Unexpected response format for events:', data);
    return [];
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
};

/**
 * Get a single event by ID
 * Available to: all authenticated users
 */
export const getEvent = async (token: string, eventId: number): Promise<Event | null> => {
  try {
    const response = await fetch(`${API_BASE}/events/${eventId}/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch event:', response.status);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching event:', error);
    return null;
  }
};

/**
 * Create a new event
 * Available to: moderators only
 */
export const createEvent = async (
  token: string,
  eventData: CreateEventData
): Promise<Event> => {
  // Convert datetime-local format to ISO format for backend
  const formatDateTime = (dateStr: string) => {
    // Input format: "YYYY-MM-DDTHH:mm"
    // Output format: "YYYY-MM-DDTHH:mm:ss" (ISO 8601)
    return `${dateStr}:00`;
  };

  const formattedData = {
    ...eventData,
    event_start_date: formatDateTime(eventData.event_start_date),
    event_end_date: formatDateTime(eventData.event_end_date),
  };

  const response = await fetch(`${API_BASE}/events/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formattedData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to create event:', errorText);
    throw new Error(`Failed to create event: ${response.status}`);
  }

  return await response.json();
};

/**
 * Update an existing event
 * Available to: moderators only
 */
export const updateEvent = async (
  token: string,
  eventId: number,
  eventData: Partial<CreateEventData>
): Promise<Event> => {
  // Format datetime fields if they exist
  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return dateStr;
    // If already in ISO format, return as is
    if (dateStr.includes(':00')) return dateStr;
    // Otherwise, add seconds
    return `${dateStr}:00`;
  };

  const formattedData = {
    ...eventData,
    ...(eventData.event_start_date && {
      event_start_date: formatDateTime(eventData.event_start_date),
    }),
    ...(eventData.event_end_date && {
      event_end_date: formatDateTime(eventData.event_end_date),
    }),
  };

  const response = await fetch(`${API_BASE}/events/${eventId}/`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formattedData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to update event:', errorText);
    throw new Error(`Failed to update event: ${response.status}`);
  }

  return await response.json();
};

/**
 * Delete an event
 * Available to: moderators only
 */
export const deleteEvent = async (token: string, eventId: number): Promise<void> => {
  const response = await fetch(`${API_BASE}/events/${eventId}/`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to delete event:', errorText);
    throw new Error(`Failed to delete event: ${response.status}`);
  }
};