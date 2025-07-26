'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Scissors, User, LogOut, Calendar, Store } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <Scissors className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">BarberBook</span>
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-700">
                    Welcome, {user.name}
                  </span>
                  
                  {user.role === 'barber' ? (
                    <div className="flex items-center space-x-2">
                      <Link
                        href="/barber/dashboard"
                        className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                      >
                        <Store className="h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Link
                        href="/customer/search"
                        className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                      >
                        <Scissors className="h-4 w-4" />
                        <span>Find Barbers</span>
                      </Link>
                      <Link
                        href="/customer/appointments"
                        className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                      >
                        <Calendar className="h-4 w-4" />
                        <span>My Appointments</span>
                      </Link>
                    </div>
                  )}

                  <Link
                    href="/profile"
                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>

                  <button
                    onClick={logout}
                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    href="/login"
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

