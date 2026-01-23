// app/global/components/content/DashboardContent.tsx
'use client';

import { useEffect, useState ,useRef,useCallback} from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/stores/authStore';
import { useDashboardStore } from '../../lib/stores/dashboardStore';
import {
  getDashboardStats,
  getRecentActivities,
  getNewMembers,
  DashboardStats,
  Activity,
  NewMember,
} from '../../lib/api';

// Stat Card Component
interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  badge?: { text: string; type: 'active' | 'warning' | 'danger' | 'success' };
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, badge, onClick }) => (
  <div
    onClick={onClick}
    className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-6 hover:border-[#00d084] hover:transform hover:-translate-y-1 transition-all duration-200 cursor-pointer"
  >
    <div className="flex justify-between items-start mb-4">
      <div className="w-10 h-10 bg-[#2a2a2a] rounded-lg flex items-center justify-center">
        {icon}
      </div>
      {badge && (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          badge.type === 'active' ? 'bg-[#00d084] text-white' :
          badge.type === 'warning' ? 'bg-[#e67e22] text-white' :
          badge.type === 'danger' ? 'bg-[#e74c3c] text-white' :
          'bg-[#2ecc71] text-white'
        }`}>
          {badge.text}
        </span>
      )}
    </div>
    <div className="text-3xl font-bold text-white mb-1">{value}</div>
    <div className="text-sm text-[#808080]">{title}</div>
    <div className="text-xs text-[#666] mt-1">{subtitle}</div>
  </div>
);

// Activity Item Component
interface ActivityItemProps {
  type: 'project' | 'task' | 'meeting' | 'issue';
  title: string;
  description: string;
  time: string;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ type, title, description, time }) => {
  const getIcon = () => {
    switch (type) {
      case 'project': return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
        </svg>
      );
      case 'task': return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
      );
      case 'meeting': return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      );
      case 'issue': return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      );
    }
  };

  const getColor = () => {
    switch (type) {
      case 'project': return 'bg-blue-500/10 text-blue-400';
      case 'task': return 'bg-[#00d084]/10 text-[#00d084]';
      case 'meeting': return 'bg-purple-500/10 text-purple-400';
      case 'issue': return 'bg-red-500/10 text-red-400';
    }
  };

  return (
    <div className="flex gap-3 p-3 bg-[#2a2a2a] rounded-lg">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getColor()}`}>
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white mb-1">{title}</div>
        <div className="text-xs text-[#808080]">{description}</div>
      </div>
      <div className="text-xs text-[#808080] whitespace-nowrap">{time}</div>
    </div>
  );
};

// New Member Item Component
interface NewMemberItemProps {
  member: NewMember;
}

const NewMemberItem: React.FC<NewMemberItemProps> = ({ member }) => {
  const { setActiveSection } = useDashboardStore();
  const router = useRouter();

  const handleViewMember = () => {
    setActiveSection('members');
  };

  return (
    <div 
      onClick={handleViewMember}
      className="flex items-center gap-3 p-3 bg-[#2a2a2a] rounded-lg hover:bg-[#3a3a3a] transition-colors cursor-pointer"
    >
      <div className="w-10 h-10 bg-[#00d084] rounded-full flex items-center justify-center text-black font-bold text-lg">
        {member.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white mb-1">{member.name}</div>
        <div className="text-xs text-[#808080]">
          <div>{member.level} • {member.department}</div>
          <div className="flex flex-wrap gap-1 mt-1">
            {member.tags.map((tag, index) => (
              <span key={index} className="px-2 py-0.5 bg-[#1e1e1e] text-xs rounded">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="text-xs text-[#666] whitespace-nowrap">{member.joinDate}</div>
    </div>
  );
};

// Quick Action Component
interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

const QuickAction: React.FC<QuickActionProps> = ({ title, description, icon, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-4 text-left hover:border-[#00d084] hover:transform hover:-translate-y-1 transition-all duration-200 ${
      disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
    }`}
  >
    <div className="w-12 h-12 bg-[#2a2a2a] rounded-lg flex items-center justify-center mb-3">
      {icon}
    </div>
    <div className="text-base font-semibold text-white mb-1">{title}</div>
    <div className="text-sm text-[#808080]">{description}</div>
  </button>
);


  export default function DashboardContent() {
  const { user, token } = useAuth();
  const { setActiveSection } = useDashboardStore();
  const router = useRouter();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newMembers, setNewMembers] = useState<NewMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Add these refs to prevent duplicate requests
  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);

const fetchDashboardData = useCallback(async () => {
  // Prevent multiple simultaneous requests
  if (isFetchingRef.current || !token || hasFetchedRef.current) {
    return;
  }

  try {
    isFetchingRef.current = true;
    setLoading(true);
    
    // Add debouncing delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Fetch stats first
    const statsData = await getDashboardStats(token);
    setStats(statsData);
    
    // Add delay between calls
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Fetch activities
    const activitiesData = await getRecentActivities(token);
    setActivities(activitiesData);
    
    // Add delay before optional call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Only fetch new members for admin
    let newMembersData: NewMember[] = [];
    if (user?.role === 'admin') {
      newMembersData = await getNewMembers(token);
    }
    
    setNewMembers(newMembersData);
    hasFetchedRef.current = true;
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
  } finally {
    isFetchingRef.current = false;
    setLoading(false);
  }
}, [token, user?.role]);

  useEffect(() => {
    // Only fetch if we have a token AND haven't fetched yet
    if (token && !hasFetchedRef.current) {
    const timeoutId = setTimeout(() => {
      fetchDashboardData();
    }, 1000); // Add 1 second delay on initial load
    
    return () => clearTimeout(timeoutId);
  }
    
    // Cleanup function to reset fetching flag if component unmounts
    return () => {
      isFetchingRef.current = false;
    };
  }, [token, fetchDashboardData]);

  // Optional: Add a refresh function if you want manual refresh capability
  const handleRefresh = () => {
    hasFetchedRef.current = false;
    fetchDashboardData();
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'create-project':
        setActiveSection('projects');
        break;
      case 'create-department':
        setActiveSection('departments');
        break;
      case 'schedule-meeting':
        setActiveSection('meetings');
        break;
      case 'assign-task':
        setActiveSection('tasks');
        break;
      case 'create-event':
        setActiveSection('events');
        break;
      case 'view-projects':
        setActiveSection('projects');
        break;
      case 'view-tasks':
        setActiveSection('tasks');
        break;
      case 'view-meetings':
        setActiveSection('meetings');
        break;
      default:
        console.log(`Action: ${action}`);
    }
  };

  const handleStatClick = (statType: string) => {
    // Navigate to the corresponding section
    setActiveSection(statType);
  };

  // The rest of your JSX remains exactly the same...
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7CFC9D] mx-auto mb-4"></div>
          <p className="text-white">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          {user?.role === 'admin' ? 'Dashboard Overview' : 'My Dashboard'}
        </h1>
        <p className="text-[#808080]">
          {user?.role === 'admin' ? 'Welcome back! Here\'s what\'s happening with your club.' : 'Track your tasks and activities'}
        </p>
      </div>

      {/* Stats Grid - Role-based */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Admin Stats */}
        {user?.role === 'admin' && stats && (
          <>
            <StatCard
              title="Total Projects"
              value={stats.totalProjects || 0}
              subtitle={`${stats.activeProjects || 0} Active`}
              icon={
                <svg className="w-5 h-5 text-[#00d084]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                </svg>
              }
              badge={{ text: `${stats.activeProjects || 0} Active`, type: 'active' }}
              onClick={() => handleStatClick('projects')}
            />
            
            <StatCard
              title="Club Members"
              value={stats.totalMembers || 0}
              subtitle={`${stats.totalDepartments || 0} Departments`}
              icon={
                <svg className="w-5 h-5 text-[#00d084]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              }
              badge={{ text: `${stats.totalDepartments || 0} Depts`, type: 'active' }}
              onClick={() => handleStatClick('members')}
            />
            
            <StatCard
              title="Active Tasks"
              value={stats.totalTasks || 0}
              subtitle="Across all projects"
              icon={
                <svg className="w-5 h-5 text-[#e67e22]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              }
              onClick={() => handleStatClick('tasks')}
            />
            
            <StatCard
              title="Open Issues"
              value={stats.openIssues || 0}
              subtitle="Require attention"
              icon={
                <svg className="w-5 h-5 text-[#e74c3c]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              }
              badge={{ text: 'Needs Review', type: 'danger' }}
              onClick={() => handleStatClick('issues')}
            />
          </>
        )}

        {/* Non-admin Stats */}
        {user?.role !== 'admin' && stats && (
          <>
            <StatCard
              title="My Tasks"
              value={stats.assignedTasks || 0}
              subtitle={`${stats.completedTasks || 0} Completed`}
              icon={
                <svg className="w-5 h-5 text-[#00d084]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              }
              onClick={() => handleStatClick('tasks')}
            />
            
            <StatCard
              title="Upcoming Meetings"
              value={stats.upcomingMeetings || 0}
              subtitle="You're invited to"
              icon={
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              }
              onClick={() => handleStatClick('meetings')}
            />
            
            <StatCard
              title="Tasks Due Soon"
              value={stats.tasksDueSoon || 0}
              subtitle="Next 7 days"
              icon={
                <svg className="w-5 h-5 text-[#e67e22]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              }
              badge={{ text: 'Urgent', type: 'warning' }}
              onClick={() => handleStatClick('tasks')}
            />
            
            <StatCard
              title="Active Projects"
              value={stats.assignedTasks || 0} // Using tasks as project indicator
              subtitle="You're involved in"
              icon={
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                </svg>
              }
              onClick={() => handleStatClick('projects')}
            />
          </>
        )}
      </div>

      {/* Quick Actions - Admin only */}
      {user?.role === 'admin' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickAction
              title="Create Project"
              description="Start a new club project"
              icon={
                <svg className="w-6 h-6 text-[#00d084]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 5v14m-7-7h14"></path>
                </svg>
              }
              onClick={() => handleQuickAction('create-project')}
            />
            
            <QuickAction
              title="Create Department"
              description="Add a new department"
              icon={
                <svg className="w-6 h-6 text-[#00d084]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              }
              onClick={() => handleQuickAction('create-department')}
            />
            
            <QuickAction
              title="Schedule Meeting"
              description="Create a new meeting"
              icon={
                <svg className="w-6 h-6 text-[#00d084]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              }
              onClick={() => handleQuickAction('schedule-meeting')}
            />
          </div>
        </div>
      )}

      {/* Non-admin Quick Actions */}
      {user?.role !== 'admin' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <QuickAction
              title="View My Tasks"
              description="Check your assigned tasks"
              icon={
                <svg className="w-6 h-6 text-[#00d084]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"></path>
                  <rect x="9" y="3" width="6" height="4" rx="2"></rect>
                  <path d="M9 12h6"></path>
                  <path d="M9 16h6"></path>
                </svg>
              }
              onClick={() => handleQuickAction('view-tasks')}
            />
            
            <QuickAction
              title="Upcoming Meetings"
              description="View your meetings"
              icon={
                <svg className="w-6 h-6 text-[#00d084]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              }
              onClick={() => handleQuickAction('view-meetings')}
            />
            
            <QuickAction
              title="Report Issue"
              description="Report task issues"
              icon={
                <svg className="w-6 h-6 text-[#00d084]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              }
              onClick={() => handleQuickAction('report-issue')}
            />
          </div>
        </div>
      )}

      {/* Recent Activity & New Members */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
            <button 
              onClick={() => handleQuickAction('view-projects')}
              className="text-sm text-[#808080] hover:text-white transition-colors"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {activities.length > 0 ? (
              activities.map((activity, index) => (
                <ActivityItem
                  key={index}
                  type={activity.type}
                  title={activity.title}
                  description={activity.description}
                  time={activity.time}
                />
              ))
            ) : (
              <div className="text-center py-8 text-[#808080]">
                No recent activities
              </div>
            )}
          </div>
        </div>

        {/* New Members (Admin only) or Recent Updates */}
        {user?.role === 'admin' ? (
          <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-white">New Members</h2>
                {newMembers.length > 0 && (
                  <span className="bg-[#00d084] text-white text-xs font-semibold px-2 py-1 rounded-full">
                    {newMembers.length} New
                  </span>
                )}
              </div>
              <button 
                onClick={() => handleStatClick('members')}
                className="text-sm text-[#808080] hover:text-white transition-colors"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {newMembers.length > 0 ? (
                newMembers.slice(0, 3).map((member) => (
                  <NewMemberItem key={member.id} member={member} />
                ))
              ) : (
                <div className="text-center py-8 text-[#808080]">
                  No new members in the last 30 days
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">My Updates</h2>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-[#2a2a2a] rounded-lg">
                <div className="text-sm font-semibold text-white mb-2">
                  Welcome!
                </div>
                <div className="text-xs text-[#808080]">
                  Track your tasks and meetings from here. Report any issues you encounter.
                </div>
              </div>
              
              {stats && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#2a2a2a] rounded-lg text-center">
                    <div className="text-lg font-bold text-white">{stats.completedTasks || 0}</div>
                    <div className="text-xs text-[#808080]">Tasks Done</div>
                  </div>
                  <div className="p-3 bg-[#2a2a2a] rounded-lg text-center">
                    <div className="text-lg font-bold text-white">{stats.tasksDueSoon || 0}</div>
                    <div className="text-xs text-[#808080]">Due Soon</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}