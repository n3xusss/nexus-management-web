// components/TraditionalLoginForm.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { traditionalLogin } from '../lib/api';

export default function TraditionalLoginForm() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Attempting traditional login...', formData);

      const data = await traditionalLogin(formData.username, formData.password);

      console.log('Traditional login response:', data);
      console.log('User role from backend:', data.user?.role);

      if (data.access && data.user) {
        const userData = {
          id: data.user.id.toString(),
          name: data.user.username || data.user.email,
          email: data.user.email,
          role: data.user.role || 'member'
        };

        console.log('Traditional login successful - Final user data:', userData);
        login(userData, data.access);
      } else {
        console.error('Missing data in response:', data);
        throw new Error('Invalid response from server - missing user or access token');
      }

    } catch (err: any) {
      console.error('Traditional login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
      
      setFormData({
        username: '',
        password: '',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6  text-center">
        Admin  Login
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            value={formData.username}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7CFC9D] focus:border-transparent"
            placeholder="Enter your username"
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#7CFC9D] focus:border-transparent"
            placeholder="Enter your password"
            disabled={isLoading}
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#7CFC9D] text-black font-semibold py-3 px-4 rounded-lg transition-all duration-300 hover:bg-[#6ee089] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
              Signing in...
            </div>
          ) : (
            'Sign In'
          )}
        </button>
      </form>
      
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-400">
          Use this for admin role Development
        </p>
        
      </div>
    </div>
  );
}