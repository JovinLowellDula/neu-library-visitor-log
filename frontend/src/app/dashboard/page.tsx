'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import VisitorDashboard from '@/components/VisitorDashboard';
import AdminDashboard from '@/components/AdminDashboard';

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading && !user) {
        router.push('/');
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">NEU</div>
            <h1 className="font-semibold text-gray-900">Library Visitor Log</h1>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
              User View
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <button
              onClick={() => { localStorage.removeItem('token'); window.location.href = '/'; }}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg mb-8">
          <h2 className="text-2xl font-bold">Welcome to NEU Library!</h2>
          <p className="text-blue-100 mt-1">Hello, {user.name}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Visitor Check-In</h3>
          <p className="text-gray-600">You are logged in as: <strong>{user.email}</strong></p>
          <p className="text-gray-600">Role: <strong>{user.role}</strong></p>
          
          {user.role === 'ADMIN' && (
            <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-purple-800 font-medium">You have admin privileges!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}