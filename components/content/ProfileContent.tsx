'use client';

import { useAuth } from '../../lib/stores/authStore';

export default function ProfileContent() {
  const { user } = useAuth();

  return (
    <div>
      <h2 className="text-3xl font-bold text-white mb-2">My Profile</h2>
      <p className="text-[#808080] mb-8">View and manage your personal information</p>
      <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-[#7CFC9D] rounded-full flex items-center justify-center text-black text-2xl font-bold">
            {user?.name?.charAt(0) || 'M'}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">{user?.name}</h3>
            <p className="text-[#808080]">{user?.email}</p>
            <div className="mt-1">
              <span className="bg-[#2a2a2a] text-[#00d084] text-xs font-semibold px-3 py-1 rounded-full">
                {user?.role}
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-[#2a2a2a] rounded-lg p-4">
            <div className="text-[#808080] text-sm mb-1">Email</div>
            <div className="text-white">{user?.email}</div>
          </div>
          <div className="bg-[#2a2a2a] rounded-lg p-4">
            <div className="text-[#808080] text-sm mb-1">Role</div>
            <div className="text-white capitalize">{user?.role}</div>
          </div>
          <div className="bg-[#2a2a2a] rounded-lg p-4">
            <div className="text-[#808080] text-sm mb-1">Member Since</div>
            <div className="text-white">Dec 2025</div>
            
          </div>
        </div>
        
      </div>



        <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-6">
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-white mb-2">Meetings Section</h3>
          <p className="text-[#808080]">Component to be implemented BY ZIANI</p>
        </div>
      </div>
    </div>
  );
}
