'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../../lib/stores/authStore';
import { useDashboardStore } from '../../lib/stores/dashboardStore';
import { 
  getDashboardStats, 
  getRecentActivities,
  getMemberCalendarEvents,
  DashboardStats,
  Activity,
  CalendarEvent
} from '../../lib/api';
import Calendar from '../Calendar';

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

export default function ManagerDashboardContent() {
  const { user, token } = useAuth();
  const { setActiveSection } = useDashboardStore();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  
  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);

  const fetchManagerDashboardData = useCallback(async () => {
    if (isFetchingRef.current || !token || hasFetchedRef.current) {
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      
      // Add debouncing delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Fetch manager stats
      const statsData = await getDashboardStats(token);
      setStats(statsData);
      
      // Fetch calendar events for manager
      await new Promise(resolve => setTimeout(resolve, 500));
      const calendarData = await getMemberCalendarEvents(token);
      
      // Combine all events for calendar
      const allEvents = [
        ...calendarData.meetings.map(meeting => ({ ...meeting, type: 'meeting' as const })),
        ...calendarData.events.map(event => ({ ...event, type: 'event' as const })),
        ...calendarData.issues.map(issue => ({ ...issue, type: 'issue' as const })),
      ];
      setCalendarEvents(allEvents);
      
      // Fetch recent activities
      await new Promise(resolve => setTimeout(resolve, 500));
      const activitiesData = await getRecentActivities(token);
      setActivities(activitiesData);
      
      hasFetchedRef.current = true;
    } catch (error) {
      console.error('Failed to fetch manager dashboard data:', error);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && !hasFetchedRef.current) {
      const timeoutId = setTimeout(() => {
        fetchManagerDashboardData();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
    
    return () => {
      isFetchingRef.current = false;
    };
  }, [token, fetchManagerDashboardData]);

  const handleStatClick = (statType: string) => {
    setActiveSection(statType);
  };

  const handleEventClick = (event: CalendarEvent) => {
    switch (event.type) {
      case 'meeting':
        setActiveSection('meetings');
        break;
      case 'event':
        setActiveSection('events');
        break;
      case 'issue':
        setActiveSection('issues');
        break;
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'create-task':
        setActiveSection('tasks');
        break;
      case 'schedule-meeting':
        setActiveSection('meetings');
        break;
      case 'view-issues':
        setActiveSection('issues');
        break;
      case 'view-projects':
        setActiveSection('projects');
        break;
      default:
        console.log(`Action: ${action}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7CFC9D] mx-auto mb-4"></div>
          <p className="text-white">Loading manager dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Manager Dashboard
        </h1>
        <p className="text-[#808080]">
          Welcome back, {user?.firstName || user?.name?.split(' ')[0] || 'Manager'}! Manage your department efficiently.
        </p>
      </div>

      {/* Stats Grid - Manager Specific */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Department Projects"
          value={stats?.departmentProjects || 0}
          subtitle="Active in your department"
          icon={
            <svg className="w-5 h-5 text-[#00d084]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            </svg>
          }
          badge={{ text: 'Active', type: 'active' }}
          onClick={() => handleStatClick('projects')}
        />
        
        <StatCard
          title="Department Members"
          value={stats?.departmentMembers || 0}
          subtitle="In your department"
          icon={
            <svg className="w-5 h-5 text-[#3498db]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          }
        />
        
        <StatCard
          title="Active Tasks"
          value={stats?.activeTasks || 0}
          subtitle="In progress"
          icon={
            <svg className="w-5 h-5 text-[#e67e22]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
            </svg>
          }
          badge={{ text: `${stats?.departmentTasksCompleted || 0} completed`, type: 'success' }}
          onClick={() => handleStatClick('projects')}
        />
        
        <StatCard
          title="Reported Issues"
          value={stats?.openIssues || 0}
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
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <QuickAction
            title="Create Task"
            description="Assign new tasks to members"
            icon={
              <svg className="w-6 h-6 text-[#00d084]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M12 5v14m-7-7h14"></path>
              </svg>
            }
            onClick={() => handleQuickAction('create-task')}
          />
          
          <QuickAction
            title="Schedule Meeting"
            description="Organize department meetings"
            icon={
              <svg className="w-6 h-6 text-[#00d084]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            }
            onClick={() => handleQuickAction('schedule-meeting')}
          />
          
          <QuickAction
            title="View Issues"
            description="Check reported problems"
            icon={
              <svg className="w-6 h-6 text-[#00d084]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            }
            onClick={() => handleQuickAction('view-issues')}
          />
          
          <QuickAction
            title="View Projects"
            description="Manage department projects"
            icon={
              <svg className="w-6 h-6 text-[#00d084]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              </svg>
            }
            onClick={() => handleQuickAction('view-projects')}
          />
        </div>
      </div>

      {/* Recent Activity & Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
              <button 
                onClick={() => handleQuickAction('view-tasks')}
                className="text-sm text-[#808080] hover:text-white transition-colors"
              >
                View All
              </button>
            </div>
            
            <div className="space-y-3">
              {activities.length > 0 ? (
                activities.slice(0, 4).map((activity, index) => (
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
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p>No recent activities</p>
                </div>
              )}
            </div>
          </div>

          {/* Department Stats */}
          <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Department Overview</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-[#808080] mb-1">
                  <span>Task Completion Rate</span>
                  <span>
                    {stats?.activeTasks && stats?.departmentTasksCompleted ? 
                      `${Math.round((stats.departmentTasksCompleted / (stats.activeTasks + stats.departmentTasksCompleted)) * 100)}%` : 
                      '0%'}
                  </span>
                </div>
                <div className="w-full bg-[#2a2a2a] rounded-full h-2">
                  <div 
                    className="bg-[#00d084] h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: stats?.activeTasks && stats?.departmentTasksCompleted ? 
                        `${(stats.departmentTasksCompleted / (stats.activeTasks + stats.departmentTasksCompleted)) * 100}%` : 
                        '0%' 
                    }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm text-[#808080] mb-1">
                  <span>Issue Resolution</span>
                  <span>{stats?.openIssues || 0} pending</span>
                </div>
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(stats?.openIssues || 0, 5) }).map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-[#e74c3c]"></div>
                  ))}
                  {stats && stats.openIssues > 5 && (
                    <span className="text-xs text-[#808080]">+{stats.openIssues - 5}</span>
                  )}
                </div>
              </div>
              
              <div className="pt-4 border-t border-[#3a3a3a]">
                <div className="text-sm text-[#808080] mb-2">Your Department</div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3498db] to-[#2980b9] flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-white">{user?.department?.name || 'No Department Assigned'}</div>
                    <div className="text-xs text-[#808080]">
                      {stats?.departmentMembers || 0} members • {stats?.departmentProjects || 0} projects
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Section */}
        <div className="lg:col-span-2">
          <Calendar 
            events={calendarEvents} 
            onEventClick={handleEventClick}
            className="h-full"
          />
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Department Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#2a2a2a] rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#00d084]/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#00d084]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <div>
                <div className="text-lg font-bold text-white">{stats?.departmentTasksCompleted || 0}</div>
                <div className="text-sm text-[#808080]">Tasks Completed</div>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-[#2a2a2a] rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
              </div>
              <div>
                <div className="text-lg font-bold text-white">{stats?.upcomingMeetings || 0}</div>
                <div className="text-sm text-[#808080]">Upcoming Meetings</div>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-[#2a2a2a] rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <div className="text-lg font-bold text-white">
                  {stats?.activeTasks ? Math.round((stats.departmentTasksCompleted || 0) / stats.activeTasks * 100) : 0}%
                </div>
                <div className="text-sm text-[#808080]">Efficiency Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}