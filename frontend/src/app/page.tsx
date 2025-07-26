'use client';

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Scissors, Calendar, MapPin, Clock, Star, Users } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <Scissors className="h-16 w-16 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
          Welcome to BarberBook
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          The easiest way to book barber appointments in Palestine. 
          Find the best barbers in your city and book your next haircut with just a few clicks.
        </p>
        
        {!user && (
          <div className="flex justify-center space-x-4">
            <Link
              href="/register?role=customer"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Book as Customer
            </Link>
            <Link
              href="/register?role=barber"
              className="px-6 py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors"
            >
              Join as Barber
            </Link>
          </div>
        )}

        {user && user.role === 'customer' && (
          <div className="flex justify-center">
            <Link
              href="/customer/search"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Find Barbers Near You
            </Link>
          </div>
        )}

        {user && user.role === 'barber' && (
          <div className="flex justify-center">
            <Link
              href="/barber/dashboard"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <MapPin className="h-12 w-12 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Find Local Barbers</h3>
          <p className="text-gray-600">
            Search for barber shops in your city across Palestine. 
            From Ramallah to Hebron, find the perfect barber near you.
          </p>
        </div>

        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Calendar className="h-12 w-12 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Easy Booking</h3>
          <p className="text-gray-600">
            Book appointments instantly based on real-time availability. 
            Choose your preferred time and service with just a few clicks.
          </p>
        </div>

        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Clock className="h-12 w-12 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900">Manage Schedule</h3>
          <p className="text-gray-600">
            Barbers can easily manage their availability, services, and appointments 
            all in one convenient dashboard.
          </p>
        </div>
      </div>

      {/* Cities Section */}
      <div className="bg-white rounded-lg shadow-sm p-8">
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Available in Palestine Cities
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          {[
            'Ramallah', 'Nablus', 'Hebron', 'Bethlehem', 'Jenin',
            'Tulkarm', 'Qalqilya', 'Salfit', 'Jericho', 'Tubas'
          ].map((city) => (
            <div key={city} className="p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700 font-medium">{city}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-blue-600 rounded-lg text-white p-8">
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="space-y-2">
            <div className="flex justify-center">
              <Users className="h-8 w-8" />
            </div>
            <div className="text-3xl font-bold">500+</div>
            <div className="text-blue-100">Happy Customers</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-center">
              <Scissors className="h-8 w-8" />
            </div>
            <div className="text-3xl font-bold">50+</div>
            <div className="text-blue-100">Professional Barbers</div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-center">
              <Star className="h-8 w-8" />
            </div>
            <div className="text-3xl font-bold">4.9</div>
            <div className="text-blue-100">Average Rating</div>
          </div>
        </div>
      </div>
    </div>
  );
}

