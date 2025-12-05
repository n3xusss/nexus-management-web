'use client';

import BackgroundPattern from '../components/BackgroundPattern';
import GoogleAuthButton from '../components/GoogleAuthButton';
import TraditionalLoginForm from '../components/TraditionalLoginForm';
import { useState } from 'react';

export default function Home() {
  const [showTraditionalLogin, setShowTraditionalLogin] = useState(false);

  return (
    <main className="min-h-screen bg-[#2A2A2A] text-white">
      <BackgroundPattern />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-2xl">
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
            <div className="space-y-4">
              <GoogleAuthButton />
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-[#2A2A2A] text-gray-400">Or</span>
                </div>
              </div>
              <button
                onClick={() => setShowTraditionalLogin(true)}
                className="w-full bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg border border-gray-600 hover:bg-gray-600 transition-colors duration-200"
              >
                Admin Access For Development
              </button>
              <p className="text-sm text-gray-400 mt-4">
                for member role access with a normal Google account
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <TraditionalLoginForm />
              <button
                onClick={() => setShowTraditionalLogin(false)}
                className="w-full text-gray-400 hover:text-white py-2 transition-colors"
              >
                ← Back to Google Login
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}