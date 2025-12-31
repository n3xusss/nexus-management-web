// app/page.tsx - UPDATED (remove token link)
'use client';

import BackgroundPattern from '../components/BackgroundPattern';
import GoogleAuthButton from '../components/GoogleAuthButton';

export default function Home() {
  // No longer need traditional auth or invite token state here
  // Just a clean Google button

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
          
          {/* Single Google Login Button */}
          <div className="space-y-6">
            <GoogleAuthButton />
            
            {/* Help Text */}
            <div className="mt-8 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
              <p className="text-sm text-gray-300">
                <strong>New to NexusHub?</strong> You'll be asked for an invite token if needed.
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Contact your administrator for access
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}