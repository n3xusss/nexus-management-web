'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/stores/authStore';
import Sidebar from '../../components/Sidebar';
import { useDashboardStore } from '../../lib/stores/dashboardStore';

// Import content components
import DashboardContent from '../../components/content/AdminDashboardContent';
import ProjectsContent from '../../components/content/ProjectsContent';
import DepartmentsContent from '../../components/content/DepartmentsContent';
import MembersContent from '../../components/content/MembersContent';
import TasksContent from '../../components/content/TasksContent';
import MeetingsContent from '../../components/content/MeetingsContent';
import EventsContent from '../../components/content/EventsContent';
import IssuesContent from '../../components/content/IssuesContent';
import ProfileContent from '../../components/content/ProfileContent';
import MemberDashboardContent from '../../components/content/MemberDashboardContent';

const adminComponentMap = {
  dashboard: DashboardContent,
  projects: ProjectsContent,
  departments: DepartmentsContent,
  members: MembersContent,
  tasks: TasksContent,
  meetings: MeetingsContent,
  events: EventsContent,
  issues: IssuesContent,
  profile: ProfileContent, // Added for admin
};

const memberComponentMap = {
  dashboard: MemberDashboardContent,
  projects: ProjectsContent,
  tasks: TasksContent,
  meetings: MeetingsContent,
  profile: ProfileContent,
};

export default function GlobalPage() {
  const { user, isLoading, logout } = useAuth();
  const { activeSection, setActiveSection } = useDashboardStore();
  const router = useRouter();
  const [hasCheckedProfile, setHasCheckedProfile] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only run check once when auth state changes
    if (isLoading) return;

    // No user at all → redirect to login
    if (!user) {
      console.log('❌ Global page: No user found, redirecting to login');
      router.push('/');
      return;
    }

    // User exists but hasn't been checked yet
    if (!hasCheckedProfile) {
      const hasCompleteProfile = user.firstName && user.lastName;
      console.log('🔍 Global page - Profile check:', {
        hasUser: !!user,
        firstName: user.firstName,
        lastName: user.lastName,
        needsRegistration: !hasCompleteProfile
      });
      
      if (!hasCompleteProfile) {
        console.log('⚠️ User needs profile completion, redirecting to /register/complete');
        router.push('/register/complete');
      } else {
        console.log('✅ User profile complete, allowing access');
        setHasCheckedProfile(true);
      }
    }
  }, [user, isLoading, router, hasCheckedProfile]);

  // Show loading while checking
  if (isLoading || (user && !hasCheckedProfile)) {
    return (
      <div className="min-h-screen bg-[#2A2A2A] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7CFC9D] mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If no user after loading, show nothing (redirect will happen in useEffect)
  if (!user) {
    return null;
  }

  // Choose component map based on role
  const componentMap = user?.role === 'member' ? memberComponentMap : adminComponentMap;
  const activeSectionKey = activeSection as keyof typeof componentMap;
  const ActiveComponent = componentMap[activeSectionKey] || DashboardContent;

  // Safely get user display name
  const getUserDisplayName = () => {
    if (user.name) return user.name;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    return 'User';
  };

  // Safely get user initials
  const getUserInitials = () => {
    if (user.name) return user.name.charAt(0).toUpperCase();
    if (user.firstName) return user.firstName.charAt(0).toUpperCase();
    return 'U';
  };

  // Safely get user role display
  const getUserRoleDisplay = () => {
    switch (user.role) {
      case 'admin': return 'Administrator';
      case 'manager': return 'Manager';
      case 'member': return 'Member';
      default: return 'User';
    }
  };

  return (
    <div className="min-h-screen bg-[#2A2A2A] text-white flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Topbar - Redesigned */}
        <div className="bg-gradient-to-r from-[#1e1e1e] to-[#2a2a2a] px-6 py-2 border-b border-[#3a3a3a] flex justify-between items-center shadow-lg">
          {/* Left side: Branding & Breadcrumb */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#00d084] to-[#00a66c] rounded-lg flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">
                  {isClient && activeSection 
                    ? activeSection.charAt(0).toUpperCase() + activeSection.slice(1) 
                    : 'Dashboard'} Dashboard
                </h1>
                <div className="flex items-center gap-2 text-xs text-[#808080]">
                  <span>Club Management</span>
                  <span className="text-[#00d084]">•</span>
                  <span>{getUserRoleDisplay()}</span>
                  {user.department && user.department.name && (
                    <>
                      <span className="text-[#00d084]">•</span>
                      <span>{user.department.name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors group">
              <svg className="w-5 h-5 text-[#808080] group-hover:text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#e74c3c] rounded-full"></span>
            </button>

            <div 
              className="flex items-center gap-3 p-2 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors cursor-pointer group"
              onClick={() => setActiveSection('profile')}
            >
              <div className="relative">
                {user.image ? (
                  <img 
                    src={user.image} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full object-cover border-2 border-[#00d084]"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00d084] to-[#007a52] flex items-center justify-center border border-[#3a3a3a] shadow-md">
                    <span className="text-white text-sm font-bold">
                      {getUserInitials()}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-2 h-2 bg-[#00d084] rounded-full border border-[#1e1e1e]"></div>
              </div>
              
              <div className="hidden md:block">
                <div className="text-sm font-semibold text-white group-hover:text-[#00d084] transition-colors">
                  {getUserDisplayName()}
                </div>
                <div className="text-xs text-[#808080]">
                  {getUserRoleDisplay()}
                </div>
              </div>

              <svg className="w-4 h-4 text-[#808080] group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path>
              </svg>
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#e74c3c] to-[#c0392b] hover:from-[#ff6b6b] hover:to-[#e74c3c] text-white font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer group"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {isClient && <ActiveComponent />}
        </div>
      </div>
    </div>
  );
}