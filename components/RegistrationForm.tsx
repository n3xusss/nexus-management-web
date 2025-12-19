// app/components/RegistrationForm.tsx - BEAUTIFUL REDESIGN
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/stores/authStore';

type ApiTag = { id: number; tagname?: string; tag_name?: string; color: string };
type ApiSchool = { id: number; schoolname?: string; school_name?: string };

interface Tag {
  id: number;
  tag_name: string;
  color: string;
}

interface School {
  id: number;
  school_name: string;
}

const LS_KEYS = {
  access: 'oauth_access_token',
  refresh: 'oauth_refresh_token',
  user: 'oauth_user_data',
  invite: 'invite_token',
} as const;

export default function RegistrationForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    invite_token: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    academic_level: '',
    tags: [] as number[],
    school: '' as string | number,
  });

  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [availableSchools, setAvailableSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'personal' | 'academic'>('personal');

  useEffect(() => {
    console.log('🔍 RegistrationForm - Initializing...');

    const accessToken = localStorage.getItem(LS_KEYS.access);
    const refreshToken = localStorage.getItem(LS_KEYS.refresh);
    const userData = localStorage.getItem(LS_KEYS.user);
    const inviteToken = localStorage.getItem(LS_KEYS.invite);

    console.log('🔍 RegistrationForm - localStorage data:', {
      accessToken: !!accessToken,
      refreshToken: !!refreshToken,
      userData: !!userData,
      inviteToken: !!inviteToken,
    });

    if (!accessToken || !inviteToken) {
      console.error('❌ Missing required registration data');
      router.replace('/');
      return;
    }

    setFormData((prev) => ({ ...prev, invite_token: inviteToken }));

    if (userData) {
      try {
        const user = JSON.parse(userData);
        const emailName = user?.email?.split('@')?.[0] || '';
        setFormData((prev) => ({
          ...prev,
          first_name: user?.first_name || user?.firstname || prev.first_name || emailName,
          last_name: user?.last_name || user?.lastname || prev.last_name || '',
        }));
      } catch (err) {
        console.error('Failed to parse user data:', err);
      }
    }

    const loadFormData = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_API_BASE_URL;
        const [tagsRes, schoolsRes] = await Promise.all([
          fetch(`${base}/tags/`),
          fetch(`${base}/schools/`),
        ]);

        if (tagsRes.ok) {
          const tagsJson: ApiTag[] = await tagsRes.json();
          const normalized: Tag[] = tagsJson.map((t) => ({
            id: t.id,
            tag_name: t.tag_name ?? t.tagname ?? '',
            color: t.color,
          })).filter((t) => !!t.tag_name);
          setAvailableTags(normalized);
        }

        if (schoolsRes.ok) {
          const schoolsJson: ApiSchool[] = await schoolsRes.json();
          const normalized: School[] = schoolsJson.map((s) => ({
            id: s.id,
            school_name: s.school_name ?? s.schoolname ?? '',
          })).filter((s) => !!s.school_name);
          setAvailableSchools(normalized);
        }
      } catch (err) {
        console.error('Failed to load form data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFormData();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const base = process.env.NEXT_PUBLIC_API_BASE_URL;
      const accessToken = localStorage.getItem(LS_KEYS.access);
      const refreshToken = localStorage.getItem(LS_KEYS.refresh) || '';
      const userData = localStorage.getItem(LS_KEYS.user);

      if (!accessToken) {
        throw new Error('No authentication token found. Please restart the registration process.');
      }

      const payload: Record<string, any> = {
        invite_token: formData.invite_token,
        first_name: formData.first_name,
        last_name: formData.last_name,
        tags: formData.tags,
      };

      if (formData.phone_number) payload.phone_number = formData.phone_number;
      if (formData.academic_level) payload.academic_level = formData.academic_level;
      if (formData.school) payload.school = formData.school;

      console.log('📤 Sending registration data:', payload);

      const response = await fetch(`${base}/complete-registration/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('📥 Registration response:', data);

      if (!response.ok) {
        throw new Error(data.error || data.detail || 'Registration failed');
      }

      console.log('✅ Registration successful');

      localStorage.removeItem(LS_KEYS.access);
      localStorage.removeItem(LS_KEYS.refresh);
      localStorage.removeItem(LS_KEYS.user);
      localStorage.removeItem(LS_KEYS.invite);

      const fallbackUser = (() => {
        try {
          return userData ? JSON.parse(userData) : {};
        } catch {
          return {};
        }
      })();

      const authResponse = {
        access: accessToken,
        refresh: refreshToken,
        user: data.user || fallbackUser,
      };

      login(authResponse);
    } catch (err: any) {
      console.error('❌ Registration error:', err);
      setError(err.message || 'Network error');
    } finally {
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
          <p className="text-white mt-6 text-lg font-medium">Loading your registration form...</p>
          <p className="text-gray-400 mt-2 text-sm">Getting everything ready for you</p>
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
            Complete Your Profile
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Just a few more details to personalize your NexusHub experience
          </p>
        </div>

        {/* Progress Steps */}
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

        {/* Main Form Container */}
        <div className="bg-[#1e1e1e]/80 backdrop-blur-sm rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
          {/* Form Tabs */}
          <div className="flex border-b border-gray-800">
            <button
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
            <div className="mx-6 mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3 animate-shake">
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
              <div className="space-y-8 animate-fadeIn">
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
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center mr-3">
                      <span className="text-gray-400">🔐</span>
                    </div>
                    Invite Token
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.invite_token}
                      readOnly
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-300 font-mono focus:outline-none cursor-not-allowed"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">
                        Verified
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 ml-11">This token was verified during Google authentication</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3 flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center mr-3">
                      <span className="text-gray-400">📱</span>
                    </div>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7CFC9D] focus:border-transparent transition-all duration-300"
                    placeholder="+1 (555) 123-4567"
                  />
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
              <div className="space-y-8 animate-fadeIn">
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
                    value={formData.school}
                    onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#7CFC9D] focus:border-transparent appearance-none transition-all duration-300"
                  >
                    <option value="">Select your school</option>
                    {availableSchools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.school_name}
                      </option>
                    ))}
                  </select>
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-300 mb-3">Or enter new school</label>
                    <input
                      type="text"
                      placeholder="Type new school name here"
                      onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7CFC9D] focus:border-transparent transition-all duration-300"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-semibold text-gray-300 flex items-center">
                      <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center mr-3">
                        <span className="text-gray-400">🏷️</span>
                      </div>
                      Select Your Interests
                    </label>
                    <span className="text-xs text-gray-500">
                      {formData.tags.length} of {availableTags.length} selected
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {availableTags.map((tag) => {
                      const isSelected = formData.tags.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setFormData({ ...formData, tags: formData.tags.filter((id) => id !== tag.id) });
                            } else {
                              setFormData({ ...formData, tags: [...formData.tags, tag.id] });
                            }
                          }}
                          className={`p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-between ${
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
                  
                  {formData.tags.length === 0 && (
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
                        Complete Registration
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

      {/* Add custom animations to global CSS */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #1e1e1e;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #7CFC9D;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #6ee089;
        }
        
        /* Selection color */
        ::selection {
          background: #7CFC9D;
          color: black;
        }
        
        /* Smooth transitions */
        * {
          transition: background-color 0.3s ease, border-color 0.3s ease;
        }
      `}</style>
    </div>
  );
}