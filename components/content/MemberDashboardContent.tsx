'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../../lib/stores/authStore';
import { useDashboardStore } from '../../lib/stores/dashboardStore';
import { 
  getMemberDashboardStats, 
  getMemberCalendarEvents,
  getRecentActivities,
  getDashboardStats,
  MemberDashboardStats,
  CalendarEvent,
  Activity
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

export default function MemberDashboardContent() {
  const { user, token } = useAuth();
  const { setActiveSection } = useDashboardStore();
  
  const [stats, setStats] = useState<MemberDashboardStats | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  
  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);

  const fetchMemberDashboardData = useCallback(async () => {
    if (isFetchingRef.current || !token || hasFetchedRef.current) {
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      
      // Add debouncing delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Fetch member stats
      const statsData = await getMemberDashboardStats(token);
      setStats(statsData);
      
      // Fetch calendar events
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
      console.error('Failed to fetch member dashboard data:', error);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token && !hasFetchedRef.current) {
      const timeoutId = setTimeout(() => {
        fetchMemberDashboardData();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
    
    return () => {
      isFetchingRef.current = false;
    };
  }, [token, fetchMemberDashboardData]);

  const handleStatClick = (statType: string) => {
    switch (statType) {
      case 'meetings':
        setActiveSection('meetings');
        break;
      case 'issues':
        setActiveSection('issues');
        break;
      case 'events':
        setActiveSection('events');
        break;
      case 'tasks':
        setActiveSection('tasks');
        break;
    }
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

  const handleRefresh = () => {
    hasFetchedRef.current = false;
    fetchMemberDashboardData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7CFC9D] mx-auto mb-4"></div>
          <p className="text-white">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Welcome back, {user?.firstName || user?.name?.split(' ')[0] || 'Member'}!
        </h1>
        <p className="text-[#808080]">
          Here's what's happening with your tasks and schedule
        </p>
      </div>

      {/* Stats Grid - Member Specific */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Meetings"
          value={stats?.upcomingMeetings || 0}
          subtitle="Scheduled for you"
          icon={
            <svg className="w-5 h-5 text-[#00d084]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          }
          badge={{ text: `${stats?.upcomingMeetings || 0} upcoming`, type: 'active' }}
          onClick={() => handleStatClick('meetings')}
        />
        
        <StatCard
          title="Help & Problems"
          value={stats?.openIssues || 0}
          subtitle="Need your attention"
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
        
        <StatCard
          title="Coming Events"
          value={stats?.upcomingEvents || 0}
          subtitle="In the next 7 days"
          icon={
            <svg className="w-5 h-5 text-[#3498db]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          }
        />
        
        <StatCard
          title="My Tasks"
          value={stats?.totalTasks || 0}
          subtitle={`${stats?.completedTasks || 0} completed`}
          icon={
            <svg className="w-5 h-5 text-[#e67e22]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
          }
          badge={{ text: `${stats?.tasksDueSoon || 0} due soon`, type: 'warning' }}
          onClick={() => handleStatClick('tasks')}
        />
      </div>

      {/* Recent Activity & Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Section */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
              <button 
                onClick={() => setActiveSection('tasks')}
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

          {/* Quick Status */}
          <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Your Status</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-[#808080] mb-1">
                  <span>Task Completion</span>
                  <span>{stats?.completedTasks || 0}/{stats?.totalTasks || 0}</span>
                </div>
                <div className="w-full bg-[#2a2a2a] rounded-full h-2">
                  <div 
                    className="bg-[#00d084] h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: stats?.totalTasks ? `${(stats.completedTasks / stats.totalTasks) * 100}%` : '0%' 
                    }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm text-[#808080] mb-1">
                  <span>Upcoming commitments</span>
                  <span>{stats?.upcomingMeetings || 0} meetings</span>
                </div>
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(stats?.upcomingMeetings || 0, 5) }).map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-[#00d084]"></div>
                  ))}
                  {stats && stats.upcomingMeetings > 5 && (
                    <span className="text-xs text-[#808080]">+{stats.upcomingMeetings - 5}</span>
                  )}
                </div>
              </div>
              
              <div className="pt-4 border-t border-[#3a3a3a]">
                <div className="text-sm text-[#808080] mb-2">Department</div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00d084] to-[#007a52] flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-white">{user?.department?.name || 'No Department'}</div>
                    <div className="text-xs text-[#808080]">Member since recently</div>
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
    </div>
  );
}