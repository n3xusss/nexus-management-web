'use client';

import { useAuth } from '../../lib/stores/authStore';

export default function DashboardContent() {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h2>
        <p className="text-[#808080]">
          {user?.role === 'admin' 
            ? "Welcome back! Here's what's happening with your club."
            : "Welcome back! Here's your personal dashboard."
          }
        </p>
      </div> 
          <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-6">
          <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-white mb-2">Dashboard Section</h3>
          <p className="text-[#808080]">Component to be implemented BY ZIANI</p>
        </div>
      </div>     
    </div>
  );
}