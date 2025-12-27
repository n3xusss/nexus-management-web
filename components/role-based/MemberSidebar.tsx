// app/global/components/role-based/MemberSidebar.tsx - ALTERNATIVE
'use client';

import { useDashboardStore } from '../../lib/stores/dashboardStore';
import { useAuth } from '../../lib/stores/authStore';

const memberNavItems = [
  { id: 'dashboard', label: 'My Dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { id: 'tasks', label: 'My Tasks', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8' },
  { id: 'meetings', label: 'Meetings', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
];

export default function MemberSidebar() {
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
        {memberNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id)}
            className={`
              flex items-center gap-3 w-full p-3 mb-2 rounded-lg transition-all duration-200 cursor-pointer
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
          <div className="w-10 h-10 bg-[#7CFC9D] rounded-full flex items-center justify-center text-black font-bold text-lg">
            {user?.name?.charAt(0) || 'M'}
          </div>
          <div>
            <div className="text-white text-sm font-semibold">{user?.name || 'Member'}</div>
            <div className="text-[#808080] text-xs">Club Member</div>
          </div>
        </div>
      </div>
    </div>
  );
}