// app/global/page.tsx - FIXED
'use client';

import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useAuth } from '../../lib/stores/authStore';
import Sidebar from '../../components/Sidebar';
import { useDashboardStore } from '../../lib/stores/dashboardStore';
import { useRegistrationCheck } from '../../hooks/useRegistrationCheck';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Import content components
import DashboardContent from '../../components/content/DashboardContent';
import ProjectsContent from '../../components/content/ProjectsContent';
import DepartmentsContent from '../../components/content/DepartmentsContent';
import MembersContent from '../../components/content/MembersContent';
import TasksContent from '../../components/content/TasksContent';
import MeetingsContent from '../../components/content/MeetingsContent';
import EventsContent from '../../components/content/EventsContent';
import IssuesContent from '../../components/content/IssuesContent';
import ProfileContent from '../../components/content/ProfileContent';

const adminComponentMap = {
  dashboard: DashboardContent,
  projects: ProjectsContent,
  departments: DepartmentsContent,
  members: MembersContent,
  tasks: TasksContent,
  meetings: MeetingsContent,
  events: EventsContent,
  issues: IssuesContent,
};

const memberComponentMap = {
  dashboard: DashboardContent,
  projects: ProjectsContent,
  tasks: TasksContent,
  meetings: MeetingsContent,
  profile: ProfileContent,
};

export default function GlobalPage() {
  const { user, isLoading } = useRequireAuth();
  const { logout } = useAuth();
  const { activeSection } = useDashboardStore();
  const { needsRegistration, checking } = useRegistrationCheck();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !checking && user && needsRegistration) {
      console.log('⚠️ User needs registration, redirecting...');
      router.push('/register/complete');
    }
  }, [user, isLoading, checking, needsRegistration, router]);

  // Show loading while checking
  if (isLoading || checking) {
    return (
      <div className="min-h-screen bg-[#2A2A2A] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7CFC9D] mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // useRequireAuth will redirect
  }

  // Choose component map based on role
  const componentMap = user?.role === 'member' ? memberComponentMap : adminComponentMap;
  const ActiveComponent = componentMap[activeSection as keyof typeof componentMap] || DashboardContent;

  return (
    <div className="min-h-screen bg-[#2A2A2A] text-white flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <div className="bg-[#1e1e1e] px-8 py-3 border-b border-[#3a3a3a] flex justify-between items-center">
          <div className="text-sm text-[#808080]">
            {user?.role === 'admin' && 'System Administrator'}
            {user?.role === 'manager' && 'Department Manager'}
            {user?.role === 'member' && 'Club Member'}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white hidden md:block">{user?.email}</span>
            <button
              onClick={logout}
              className="bg-red-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
}