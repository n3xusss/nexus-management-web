'use client';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useAuth } from '../../context/AuthContext';

export default function HomePage() {
  const { user, isLoading } = useRequireAuth(); // ✅ Automatic redirect if not authenticated
  const { logout } = useAuth();

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#2A2A2A] flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7CFC9D] mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2A2A2A] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors text-lg"
          >
            Logout
          </button>
        </div>
        
        <div className="bg-[#3A3A3A] rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">
            Welcome back, {user.name}!
          </h2>
          <p className="text-gray-300 mb-2">Email: {user.email}</p>
          <p className="text-gray-300 mb-4">Role: <span className="capitalize">{user.role}</span></p>
          
          {/* Role-specific content */}
          {user.role === 'admin' && (
            <div className="border-t border-gray-600 pt-4">
              <h3 className="text-xl font-semibold mb-4">Admin Dashboard</h3>
              <p className="text-gray-300 mb-6">
                You have full access to manage departments, projects, and users.
              </p>
            </div>
          )}
          
          
            <div className="border-t border-gray-600 pt-4">
              <h3 className="text-xl font-semibold mb-4">Manager Dashboard</h3>
              <p className="text-gray-300 mb-6">
                to be implemented
              </p>
            </div>
          
          
          
        </div>
      </div>
    </div>
  );
}