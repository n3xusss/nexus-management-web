// components/TraditionalLoginForm.tsx - STANDALONE VERSION
'use client';

import { useState } from 'react';
import { useAuth } from '../lib/stores/authStore';

export default function TraditionalLoginForm() {
  const { traditionalAuth } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await traditionalAuth(formData.username, formData.password);
    } catch (err: any) {
      console.error('Traditional login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1e1e1e]/80 backdrop-blur-sm rounded-2xl border border-gray-800 shadow-2xl p-8 max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl flex items-center justify-center mx-auto mb-4 border border-gray-700">
          <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Admin Login</h2>
        <p className="text-gray-400">Traditional username/password authentication</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-red-300 font-medium">Login Failed</p>
              <p className="text-red-400/80 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-3">
            Username or Email
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7CFC9D] focus:border-transparent transition-all duration-300"
            placeholder="Enter username or email"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-3">
            Password
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7CFC9D] focus:border-transparent transition-all duration-300"
            placeholder="Enter your password"
            required
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !formData.username || !formData.password}
          className="w-full bg-gradient-to-r from-[#7CFC9D] to-[#4CAF50] text-black font-bold py-3 px-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-[#7CFC9D]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      <div className="mt-8 pt-8 border-t border-gray-800">
        <p className="text-center text-gray-500 text-sm">
          Forgot your credentials? Contact your system administrator.
        </p>
      </div>
    </div>
  );
}