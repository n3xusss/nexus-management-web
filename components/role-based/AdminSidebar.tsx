// app/global/components/role-based/AdminSidebar.tsx
'use client';

import { useDashboardStore } from '../../lib/stores/dashboardStore';
import { useAuth } from '../../lib/stores/authStore';

const adminNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { id: 'projects', label: 'Projects', icon: 'M12 2 2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5' },
  { id: 'departments', label: 'Departments', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75' },
  { id: 'members', label: 'Members', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
  { id: 'meetings', label: 'Meetings', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  { id: 'events', label: 'Events', icon: 'M3 4h18M3 8h18M3 12h18M3 16h18M3 20h18' },
  { id: 'issues', label: 'Issues & Reports', icon: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3 M12 17h.01' },
];

export default function AdminSidebar() {
  const { activeSection, setActiveSection } = useDashboardStore();
  const { user } = useAuth();

  return (
    <div className="w-64 bg-[#1e1e1e] border-r border-[#3a3a3a] flex flex-col min-h-screen sticky top-0">
      {/* Sidebar Header */}
      <div className="px-6 py-4 border-b border-[#3a3a3a] flex items-center gap-2">
        {/* Icon */}
        <img
          src="/favicon.svg"
          alt="EX HUB Icon"
          className="h-9 w-auto object-contain"
        />

        {/* Text */}
          <span className="text-[#f2f2f2]/40 text-2xl font-bold tracking-wide">
            EX HUB
          </span>

      </div>
      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        {adminNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`
              flex items-center gap-3 w-full p-3 mb-2 rounded-lg transition-all duration-200  cursor-pointer
              ${activeSection === item.id
                ? 'bg-[#00d084] text-white'
                : 'text-[#808080] hover:bg-[#2a2a2a] hover:text-white'
              }
            `}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
            </svg>
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Profile Footer */}
      <div className="p-4 border-t border-[#3a3a3a]">
        <div className="flex items-center gap-3 p-3 bg-[#2a2a2a] rounded-lg">
          <div className="w-10 h-10 bg-[#00d084] rounded-full flex items-center justify-center text-white font-bold text-lg">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-sm font-semibold truncate">{user?.name || 'Admin'}</div>
            <div className="text-[#808080] text-xs truncate">System Administrator</div>
          </div>
        </div>
      </div>
    </div>
  );
}