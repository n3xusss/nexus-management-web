'use client';

import { useDashboardStore } from '../../lib/stores/dashboardStore';
import { useAuth } from '../../lib/stores/authStore';
import { useState, useEffect } from 'react';

// Simplified BackgroundPattern component for sidebar
const SidebarBackgroundPattern = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <div className="absolute inset-0 overflow-hidden rounded-lg">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00d084]/5 via-transparent to-[#007a52]/5"></div>
      
      {/* Floating organic shapes */}
      <div className="blob-sidebar absolute -top-6 -left-6 w-32 h-32 rounded-[40%_60%_70%_30%/40%_50%_60%_50%] bg-gradient-to-br from-[#00d084]/10 to-[#007a52]/5 border border-[#00d084]/20"></div>
      
      <div className="blob-sidebar absolute -bottom-6 -right-6 w-28 h-28 rounded-[60%_40%_30%_70%/60%_30%_70%_40%] bg-gradient-to-tr from-[#007a52]/10 to-transparent border border-[#00d084]/15" 
        style={{animationDelay: '2s'}}></div>
      
      {/* Glowing orbs */}
      <div className="pulse-sidebar absolute top-4 left-4 w-8 h-8 bg-[#00d084]/20 rounded-full"></div>
      <div className="pulse-sidebar absolute bottom-4 right-4 w-6 h-6 bg-[#00d084]/15 rounded-full" 
        style={{animationDelay: '1s'}}></div>
      
      {/* Particle trails */}
      <div 
        className="absolute top-1/2 left-0 w-16 h-[1px] bg-gradient-to-r from-transparent via-[#00d084]/30 to-transparent"
        style={{animation: 'particle-trail 8s ease-in-out infinite'}}
      ></div>
      <div 
        className="absolute top-1/3 right-0 w-12 h-[1px] bg-gradient-to-l from-transparent via-[#007a52]/25 to-transparent"
        style={{animation: 'particle-trail 6s ease-in-out 2s infinite'}}
      ></div>
      
      {/* Small floating particles */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-[#00d084] rounded-full"
          style={{
            top: `${20 + Math.random() * 60}%`,
            left: `${10 + Math.random() * 80}%`,
            animation: `particle-trail ${5 + Math.random() * 8}s ease-in-out ${Math.random() * 5}s infinite`,
            opacity: 0.3
          }}
        ></div>
      ))}
      
      {/* Rotating ring accent */}
      <div 
        className="absolute top-1/2 left-1/2 w-12 h-12 border border-[#00d084]/20 rounded-full -translate-x-1/2 -translate-y-1/2"
        style={{animation: 'rotate-orb 20s linear infinite'}}
      >
        <div className="absolute top-0 left-1/2 w-1 h-1 bg-[#00d084] rounded-full -translate-x-1/2"></div>
      </div>
      
      {/* Noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      ></div>
    </div>
  );
};

const adminNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { id: 'projects', label: 'Projects', icon: 'M12 2 2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5' },
  { id: 'departments', label: 'Departments', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75' },
  { id: 'members', label: 'Members', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8' },
  { id: 'tasks', label: 'Tasks', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8' },
  { id: 'meetings', label: 'Meetings', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  { id: 'events', label: 'Events', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z' },
  { id: 'issues', label: 'Issues & Reports', icon: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3 M12 17h.01' },
];

export default function AdminSidebar() {
  const { activeSection, setActiveSection } = useDashboardStore();
  const { user } = useAuth();

  // Get user initials with fallback
  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user?.name) {
      const names = user.name.split(' ');
      if (names.length >= 2) {
        return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
      }
      return user.name.substring(0, 2).toUpperCase();
    }
    return 'A';
  };

  // Get user role display name
  const getUserRoleDisplay = () => {
    switch (user?.role) {
      case 'admin': return 'Administrator';
      case 'manager': return 'Manager';
      case 'member': return 'Member';
      default: return 'User';
    }
  };

  return (
    <>
      <div className="w-64 bg-[#1e1e1e] border-r border-[#3a3a3a] flex flex-col min-h-screen sticky top-0">
        {/* Sidebar Header */}
        <div className="px-6 h-17 border-b border-[#3a3a3a] flex items-center gap-2">
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
                flex items-center gap-3 w-full p-3 mb-2 rounded-lg transition-all duration-200 cursor-pointer
                relative overflow-hidden group
                ${activeSection === item.id
                  ? 'bg-gradient-to-r from-[#00d084] to-[#00a66c] text-white shadow-lg shadow-[#00d084]/20'
                  : 'text-[#808080] hover:text-white hover:bg-[#2a2a2a]'
                }
              `}
            >
              {/* Enhanced hover effects */}
              {activeSection !== item.id && (
                <>
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00d084]/0 to-transparent group-hover:via-[#00d084]/10 transition-all duration-300"></div>
                  
                  {/* Hover shine effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
                  </div>
                </>
              )}
              
              <svg
                className="w-5 h-5 group-hover:scale-110 transition-transform duration-200"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              
              <span className="text-sm font-medium group-hover:tracking-wider transition-all duration-200">
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Profile Footer with Enhanced Background */}
        <div className="p-4 border-t border-[#3a3a3a]">
          <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-[#1e1e1e] to-[#2a2a2a] border border-[#3a3a3a] group transition-all duration-300 hover:border-[#00d084]/50 hover:shadow-lg hover:shadow-[#00d084]/10">
            {/* Background Pattern */}
            <SidebarBackgroundPattern />
            
            {/* Glow effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#00d084]/0 via-[#00d084]/0 to-[#00d084]/0 group-hover:via-[#00d084]/2 group-hover:to-[#00d084]/5 transition-all duration-500"></div>
            
            {/* Content */}
            <div className="relative z-10 flex items-center gap-3 p-4">
              {/* Animated Avatar Container */}
              <div className="relative">
                {/* Avatar glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-[#00d084] to-[#00a66c] rounded-full blur opacity-30 group-hover:opacity-50 transition-all duration-300"></div>
                
                {/* Avatar */}
                {user?.image ? (
                  <img 
                    src={user.image} 
                    alt={user.name}
                    className="relative w-12 h-12 rounded-full object-cover border-2 border-[#00d084] shadow-lg z-10"
                  />
                ) : (
                  <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-[#00d084] to-[#00a66c] flex items-center justify-center border-2 border-white/20 shadow-lg z-10">
                    <span className="text-white text-lg font-bold">
                      {getUserInitials()}
                    </span>
                  </div>
                )}
                
                {/* Online status indicator */}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00d084] rounded-full border-2 border-[#1e1e1e] shadow-md z-20">
                  <div className="absolute inset-0 bg-[#00d084] rounded-full animate-ping opacity-75"></div>
                </div>
              </div>
              
              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-semibold truncate group-hover:text-[#00d084] transition-colors duration-300">
                  {user?.name || 'Admin User'}
                </div>
                <div className="text-[#808080] text-xs truncate group-hover:text-white/80 transition-colors duration-300">
                  {getUserRoleDisplay()}
                </div>
                
                {/* User Stats - Only show if available */}
                {user?.department && (
                  <div className="flex items-center gap-2 mt-1">
                    <svg className="w-3 h-3 text-[#00d084]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                    <span className="text-xs text-[#808080] truncate">
                      {user.department.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Hover accent line */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#00d084] to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center"></div>
            
            {/* Interactive background elements that appear on hover */}
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-[#00d084]/10 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-[#00a66c]/10 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          </div>
        </div>
      </div>
      
      {/* Global styles moved outside the main div */}
      <style jsx global>{`
        @keyframes float-sidebar {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(15px, -10px) scale(1.05); }
          66% { transform: translate(-10px, 15px) scale(0.95); }
        }
        
        @keyframes pulse-sidebar {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.5; }
        }
        
        @keyframes particle-trail {
          0% { transform: translateX(-20px) translateY(0); opacity: 0; }
          20% { opacity: 0.4; }
          80% { opacity: 0.4; }
          100% { transform: translateX(60px) translateY(-15px); opacity: 0; }
        }
        
        @keyframes rotate-orb {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes pop-in {
          0% {
            transform: scale(1);
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          }
          50% {
            transform: scale(1.02);
            box-shadow: 0 10px 25px -5px rgba(0, 208, 132, 0.2), 0 5px 10px -5px rgba(0, 208, 132, 0.04);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        
        .blob-sidebar { animation: float-sidebar 15s ease-in-out infinite; }
        .pulse-sidebar { animation: pulse-sidebar 3s ease-in-out infinite; }
        
        .group:hover {
          animation: pop-in 0.3s ease-out;
          box-shadow: 0 10px 25px -5px rgba(0, 208, 132, 0.1), 0 5px 10px -5px rgba(0, 208, 132, 0.04);
        }
        
        .animate-shimmer {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.1) 50%,
            transparent 100%
          );
          background-size: 1000px 100%;
          animation: shimmer 2s infinite linear;
        }
      `}</style>
    </>
  );
}