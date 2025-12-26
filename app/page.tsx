// app/page.tsx - UPDATED WITH BACKGROUND PATTERN
'use client';

import BackgroundPattern from '../components/BackgroundPattern';
import GoogleAuthButton from '../components/GoogleAuthButton';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/stores/authStore';

export default function Home() {
  const router = useRouter();
  const { traditionalAuth } = useAuth();
  const [showTraditionalLogin, setShowTraditionalLogin] = useState(false);
  const [traditionalFormData, setTraditionalFormData] = useState({
    username: '',
    password: '',
  });
  const [traditionalError, setTraditionalError] = useState('');
  const [traditionalLoading, setTraditionalLoading] = useState(false);

  const handleTraditionalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setTraditionalError('');
    setTraditionalLoading(true);

    try {
      await traditionalAuth(traditionalFormData.username, traditionalFormData.password);
    } catch (err: any) {
      console.error('Traditional login error:', err);
      setTraditionalError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setTraditionalLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#2A2A2A] text-white">
      <BackgroundPattern />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-2xl w-full">
          {/* Logo */}
          <div className="w-34 h-24 mx-auto mb-8">
            <img 
              src="/logo.svg" 
              alt="NexusHub Logo" 
              className="w-full h-full"
            />
          </div>
          
          {/* Title */}
          <h1 className="text-6xl font-bold mb-6 text-white">
            NexusHub
          </h1>
          
          {/* Tagline */}
          <p className="text-xl text-gray-300 mb-12 leading-relaxed">
            Streamline your organization with powerful tools for task management, scheduling, and team collaboration.
          </p>
          
          {/* Login Options */}
          {!showTraditionalLogin ? (
            <div className="space-y-6">
              {/* Google Login Button for returning users */}
              <GoogleAuthButton />
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[#2A2A2A] text-gray-400">Or</span>
                </div>
              </div>
              
              
              
              {/* New User Section */}
              <div className="mt-8 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
                <p className="text-sm text-gray-300 mb-2">
                  <strong>New User?</strong> You need an invite token from your administrator.
                </p>
                <button
                  onClick={() => router.push('/token-verify')}
                  className="text-[#7CFC9D] text-sm hover:underline font-medium flex items-center justify-center space-x-2"
                >
                  <span>Click here to enter invite token</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>

              
            </div>
          ) : (
            <div className="space-y-6">
              {/* Traditional Login Form */}
              <div className="bg-[#1e1e1e]/80 backdrop-blur-sm rounded-2xl border border-gray-800 shadow-2xl p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl flex items-center justify-center mx-auto mb-4 border border-gray-700">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Admin Access</h2>
                  <p className="text-gray-400">Use your username and password</p>
                </div>

                {traditionalError && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-red-300 font-medium">Login Failed</p>
                      <p className="text-red-400/80 text-sm mt-1">{traditionalError}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleTraditionalLogin} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Username or Email
                    </label>
                    <input
                      type="text"
                      value={traditionalFormData.username}
                      onChange={(e) => setTraditionalFormData({...traditionalFormData, username: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7CFC9D] focus:border-transparent transition-all duration-300"
                      placeholder="Enter username or email"
                      required
                      disabled={traditionalLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Password
                    </label>
                    <input
                      type="password"
                      value={traditionalFormData.password}
                      onChange={(e) => setTraditionalFormData({...traditionalFormData, password: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7CFC9D] focus:border-transparent transition-all duration-300"
                      placeholder="Enter your password"
                      required
                      disabled={traditionalLoading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={traditionalLoading || !traditionalFormData.username || !traditionalFormData.password}
                    className="w-full bg-gradient-to-r from-[#7CFC9D] to-[#4CAF50] text-black font-bold py-3 px-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-[#7CFC9D]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {traditionalLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-800">
                  <button
                    onClick={() => {
                      setShowTraditionalLogin(false);
                      setTraditionalError('');
                      setTraditionalFormData({ username: '', password: '' });
                    }}
                    className="w-full text-gray-400 hover:text-white py-2 transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Back to Google Login</span>
                  </button>
                </div>
              </div>

              {/* Admin Help Text */}
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <p className="text-sm text-blue-300">
                  <strong>Need help?</strong> Contact system administrator at{' '}
                  <a href="mailto:admin@nexushub.com" className="underline hover:text-blue-200">
                    admin@nexushub.com
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}