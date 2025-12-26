'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/stores/authStore';
import { getTags, getSchools } from '../lib/api';

interface Tag {
  id: number;
  tag_name: string;
  color: string;
}

interface School {
  id: number;
  school_name: string;
  school_description?: string;
}

interface RegistrationData {
  first_name: string;
  last_name: string;
  phone_number?: string;
  academic_level?: string;
  tag_ids?: number[];
  school_id?: number;
}

const LS_KEYS = {
  access: 'oauth_access_token',
  refresh: 'oauth_refresh_token',
  user: 'oauth_user_data',
  invite: 'pending_invite_token',
} as const;

export default function RegistrationForm() {
  const router = useRouter();
  const { updateProfile, login, user, token } = useAuth();

  const [formData, setFormData] = useState<RegistrationData>({
    first_name: '',
    last_name: '',
    phone_number: '',
    academic_level: '',
    tag_ids: [],
    school_id: undefined,
  });

  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [availableSchools, setAvailableSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'personal' | 'academic'>('personal');

  // Check if this is an OAuth user (has tokens in localStorage)
  const isOAuthUser = () => {
    return !!localStorage.getItem(LS_KEYS.access);
  };

  useEffect(() => {
    console.log('🔍 RegistrationForm - Initializing...');
    
    const loadInitialData = async () => {
      try {
        // For logged-in users: if already have complete profile, redirect immediately
        if (user && token && user.firstName && user.lastName && !isOAuthUser()) {
          console.log('✅ User already has complete profile, redirecting to /global');
          router.push('/global');
          return;
        }

        // Pre-fill form with any existing data
        if (user && token) {
          // Logged-in user completing profile
          setFormData((prev) => ({
            ...prev,
            first_name: user.firstName || prev.first_name || '',
            last_name: user.lastName || prev.last_name || '',
            phone_number: user.phoneNumber || prev.phone_number || '',
            academic_level: user.academicLevel || prev.academic_level || '',
          }));
        } else if (isOAuthUser()) {
          // OAuth user completing registration
          const userData = localStorage.getItem(LS_KEYS.user);
          if (userData) {
            try {
              const parsedUser = JSON.parse(userData);
              const emailName = parsedUser?.email?.split('@')?.[0] || '';
              setFormData((prev) => ({
                ...prev,
                first_name: parsedUser?.first_name || prev.first_name || emailName,
                last_name: parsedUser?.last_name || prev.last_name || '',
              }));
            } catch (err) {
              console.error('Failed to parse OAuth user data:', err);
            }
          }
        }

        // Load tags and schools
        const [tags, schools] = await Promise.all([getTags(), getSchools()]);
        
        const normalizedTags: Tag[] = tags.map((t: any) => ({
          id: t.id,
          tag_name: t.tag_name ?? t.tagname ?? '',
          color: t.color,
        })).filter((t: Tag) => !!t.tag_name);

        const normalizedSchools: School[] = schools.map((s: any) => ({
          id: s.id,
          school_name: s.school_name ?? s.schoolname ?? '',
          school_description: s.school_description ?? '',
        })).filter((s: School) => !!s.school_name);

        setAvailableTags(normalizedTags);
        setAvailableSchools(normalizedSchools);

      } catch (err) {
        console.error('Failed to load form data:', err);
        setError('Failed to load registration data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [user, token, router]);

  const validateForm = (): string | null => {
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      return 'First name and last name are required';
    }
    
    if (formData.phone_number && !/^0[567]\d{8}$/.test(formData.phone_number)) {
      return 'Phone number must be a valid Moroccan number (05, 06, or 07 followed by 8 digits)';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Validate form
      const validationError = validateForm();
      if (validationError) {
        throw new Error(validationError);
      }

      console.log('📤 Submitting profile data:', formData);

      if (isOAuthUser()) {
        // Handle OAuth users (Google login)
        const accessToken = localStorage.getItem(LS_KEYS.access);
        const refreshToken = localStorage.getItem(LS_KEYS.refresh) || '';
        const userData = localStorage.getItem(LS_KEYS.user);

        if (!accessToken) {
          throw new Error('No authentication token found. Please restart the registration process.');
        }

        const base = process.env.NEXT_PUBLIC_API_BASE_URL;
        
        // Prepare data in the format backend expects
        const requestData: any = {
          first_name: formData.first_name,
          last_name: formData.last_name,
        };
        
        if (formData.phone_number) {
          requestData.phone_number = formData.phone_number;
        }
        
        if (formData.academic_level) {
          requestData.academic_level = formData.academic_level;
        }
        
        if (formData.tag_ids && formData.tag_ids.length > 0) {
          requestData.tag_ids = formData.tag_ids;
        }
        
        if (formData.school_id) {
          requestData.school_id = formData.school_id;
        }

        const response = await fetch(`${base}/profile/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Backend error response:', errorText);
          try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.detail || errorData.error || errorData.message || 'Profile update failed');
          } catch {
            throw new Error(`Profile update failed: ${response.status} - ${errorText.substring(0, 100)}`);
          }
        }

        const updatedUser = await response.json();
        console.log('✅ Profile update successful:', updatedUser);

        // Clear OAuth data from localStorage
        localStorage.removeItem(LS_KEYS.access);
        localStorage.removeItem(LS_KEYS.refresh);
        localStorage.removeItem(LS_KEYS.user);
        localStorage.removeItem(LS_KEYS.invite);

        // Create auth response and log in - CRITICAL FIX: Ensure we use the updated user data
        const authResponse = {
          access: accessToken,
          refresh: refreshToken,
          user: {
            ...updatedUser,
            first_name: formData.first_name, // Ensure first_name is set
            last_name: formData.last_name,   // Ensure last_name is set
          },
        };

        console.log('✅ Final auth response for login:', authResponse);
        
        // Login user via auth store - this updates the auth state
        login(authResponse);
        
        // Redirect will happen via CompleteRegistrationPage's useEffect
        // when it detects the user now has complete profile
        
      } else {
        // Handle logged-in users updating profile
        const updateData: any = {};
        
        // Always include first_name and last_name
        updateData.first_name = formData.first_name;
        updateData.last_name = formData.last_name;
        
        if (formData.phone_number) {
          updateData.phone_number = formData.phone_number;
        }
        
        if (formData.academic_level) {
          updateData.academic_level = formData.academic_level;
        }
        
        if (formData.tag_ids && formData.tag_ids.length > 0) {
          updateData.tag_ids = formData.tag_ids;
        }
        
        if (formData.school_id) {
          updateData.school_id = formData.school_id;
        }

        console.log('📤 Sending update data:', updateData);
        
        // Call updateProfile - this should update the auth store
        await updateProfile(updateData);
        
        // No redirect here - CompleteRegistrationPage will handle it
      }

    } catch (err: any) {
      console.error('❌ Registration error:', err);
      
      // More specific error handling
      if (err.message.includes('phone number')) {
        setError('Invalid phone number format. Please use 05, 06, or 07 followed by 8 digits.');
      } else if (err.message.includes('required')) {
        setError('Please fill in all required fields (First Name and Last Name).');
      } else {
        setError(err.message || 'Failed to update profile. Please check your information and try again.');
      }
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#7CFC9D] mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 bg-[#7CFC9D] rounded-full animate-ping"></div>
            </div>
          </div>
          <p className="text-white mt-6 text-lg font-medium">
            Loading your registration form...
          </p>
          <p className="text-gray-400 mt-2 text-sm">
            Getting everything ready for you
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] py-8 px-4">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#7CFC9D]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#7CFC9D]/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#7CFC9D] to-[#4CAF50] rounded-2xl mb-6 shadow-lg shadow-[#7CFC9D]/20">
            <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            {isOAuthUser() ? 'Complete Your Profile' : 'Update Your Profile'}
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            {isOAuthUser() 
              ? 'Just a few more details to personalize your NexusHub experience'
              : 'Update your profile information to enhance your experience'}
          </p>
        </div>

        {/* Progress Steps for OAuth users */}
        {isOAuthUser() && (
          <div className="flex justify-center mb-10">
            <div className="flex items-center space-x-8">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-[#7CFC9D] flex items-center justify-center">
                  <span className="text-black font-bold">1</span>
                </div>
                <div className="ml-3">
                  <p className="text-white font-medium">Account Created</p>
                  <p className="text-gray-500 text-sm">Google authentication</p>
                </div>
              </div>
              
              <div className="h-0.5 w-16 bg-gray-700"></div>
              
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-[#7CFC9D] flex items-center justify-center animate-pulse">
                  <span className="text-black font-bold">2</span>
                </div>
                <div className="ml-3">
                  <p className="text-white font-medium">Profile Setup</p>
                  <p className="text-gray-500 text-sm">Complete your details</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Form Container */}
        <div className="bg-[#1e1e1e]/80 backdrop-blur-sm rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
          {/* Form Tabs */}
          <div className="flex border-b border-gray-800">
            <button
              type="button"
              onClick={() => setActiveTab('personal')}
              className={`flex-1 py-5 px-6 text-center font-medium transition-all duration-300 ${activeTab === 'personal' 
                ? 'text-white bg-gradient-to-r from-[#7CFC9D]/10 to-transparent border-b-2 border-[#7CFC9D]' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <div className="flex items-center justify-center space-x-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Personal Information</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('academic')}
              className={`flex-1 py-5 px-6 text-center font-medium transition-all duration-300 ${activeTab === 'academic' 
                ? 'text-white bg-gradient-to-r from-[#7CFC9D]/10 to-transparent border-b-2 border-[#7CFC9D]' 
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <div className="flex items-center justify-center space-x-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                </svg>
                <span>Academic Details</span>
              </div>
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mx-6 mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-red-300 font-medium">Registration Error</p>
                <p className="text-red-400/80 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-8">
            {/* Personal Information Tab */}
            {activeTab === 'personal' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center">
                      <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center mr-3">
                        <span className="text-gray-400">👤</span>
                      </div>
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7CFC9D] focus:border-transparent transition-all duration-300"
                      placeholder="Enter your first name"
                      maxLength={50}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center">
                      <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center mr-3">
                        <span className="text-gray-400">👤</span>
                      </div>
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7CFC9D] focus:border-transparent transition-all duration-300"
                      placeholder="Enter your last name"
                      maxLength={50}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center mr-3">
                      <span className="text-gray-400">📱</span>
                    </div>
                    Phone Number
                    <span className="text-xs text-gray-500 ml-2">(Moroccan format: 05XXXXXXXX)</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7CFC9D] focus:border-transparent transition-all duration-300"
                    placeholder="05XXXXXXXX"
                    pattern="^0[567]\d{8}$"
                    maxLength={10}
                  />
                  <p className="text-xs text-gray-500 mt-2 ml-11">
                    Must start with 05, 06, or 07 followed by 8 digits
                  </p>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('academic')}
                    className="w-full bg-gradient-to-r from-gray-800 to-gray-900 text-white font-semibold py-3 px-4 rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300 flex items-center justify-center"
                  >
                    Continue to Academic Details
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Academic Details Tab */}
            {activeTab === 'academic' && (
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center mr-3">
                      <span className="text-gray-400">🎓</span>
                    </div>
                    Academic Level
                  </label>
                  <select
                    value={formData.academic_level}
                    onChange={(e) => setFormData({ ...formData, academic_level: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#7CFC9D] focus:border-transparent appearance-none transition-all duration-300"
                  >
                    <option value="">Select your academic level</option>
                    <option value="High School">High School</option>
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Graduate">Graduate</option>
                    <option value="PhD">PhD</option>
                    <option value="Postdoctoral">Postdoctoral</option>
                    <option value="Faculty">Faculty</option>
                    <option value="Professional">Professional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center mr-3">
                      <span className="text-gray-400">🏫</span>
                    </div>
                    School
                  </label>
                  <select
                    value={formData.school_id || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData({ 
                        ...formData, 
                        school_id: value ? parseInt(value) : undefined 
                      });
                    }}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#7CFC9D] focus:border-transparent appearance-none transition-all duration-300"
                  >
                    <option value="">Select your school</option>
                    {availableSchools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.school_name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-2 ml-11">
                    Please select your school from the list
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-semibold text-gray-300 flex items-center">
                      <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center mr-3">
                        <span className="text-gray-400">🏷️</span>
                      </div>
                      Select Your Interests (Tags)
                    </label>
                    <span className="text-xs text-gray-500">
                      {formData.tag_ids?.length || 0} of {availableTags.length} selected
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {availableTags.map((tag) => {
                      const isSelected = formData.tag_ids?.includes(tag.id) || false;
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => {
                            const currentTags = formData.tag_ids || [];
                            if (isSelected) {
                              setFormData({ 
                                ...formData, 
                                tag_ids: currentTags.filter((id) => id !== tag.id) 
                              });
                            } else {
                              setFormData({ 
                                ...formData, 
                                tag_ids: [...currentTags, tag.id] 
                              });
                            }
                          }}
                          className={`p-4 rounded-xl border-2 transition-all duration-300 flex items-center justify-between ${
                            isSelected
                              ? 'border-[#7CFC9D] bg-[#7CFC9D]/10'
                              : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: tag.color }}
                            ></div>
                            <span className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                              {tag.tag_name}
                            </span>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected 
                              ? 'border-[#7CFC9D] bg-[#7CFC9D]' 
                              : 'border-gray-600'
                          }`}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  
                  {(formData.tag_ids?.length || 0) === 0 && (
                    <div className="mt-6 p-4 bg-gray-800/50 rounded-xl border border-dashed border-gray-700 text-center">
                      <p className="text-gray-400">No interests selected yet</p>
                      <p className="text-gray-500 text-sm mt-1">Select tags that match your skills and interests</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setActiveTab('personal')}
                    className="py-3 px-4 bg-gray-800 text-white font-semibold rounded-xl border border-gray-700 hover:border-gray-600 transition-all duration-300 flex items-center justify-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back
                  </button>
                  
                  <button
                    type="submit"
                    disabled={submitting || !formData.first_name || !formData.last_name}
                    className="py-3 px-4 bg-gradient-to-r from-[#7CFC9D] to-[#4CAF50] text-black font-bold rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-[#7CFC9D]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        {isOAuthUser() ? 'Complete Registration' : 'Update Profile'}
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Need help? Contact your administrator at{' '}
            <a href="mailto:admin@nexushub.com" className="text-[#7CFC9D] hover:underline">
              admin@nexushub.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}