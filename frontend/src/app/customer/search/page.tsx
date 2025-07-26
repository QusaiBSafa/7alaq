'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { shopAPI } from '@/utils/api';
import { Shop, PALESTINE_CITIES } from '@/types';
import { MapPin, Phone, Users, Search, Scissors } from 'lucide-react';
import Link from 'next/link';

export default function CustomerSearchPage() {
  const { user } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [searchName, setSearchName] = useState('');

  useEffect(() => {
    if (user?.role !== 'customer') {
      return;
    }
    searchShops();
  }, [user]);

  const searchShops = async () => {
    setLoading(true);
    try {
      const params: { city?: string; name?: string } = {};
      if (selectedCity) params.city = selectedCity;
      if (searchName) params.name = searchName;

      const response = await shopAPI.search(params);
      setShops(response.data.shops);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchShops();
  };

  if (user?.role !== 'customer') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Access denied. Customer account required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Find Barber Shops</h1>
        <p className="mt-2 text-gray-600">
          Discover the best barber shops in Palestine
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <select
                id="city"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Cities</option>
                {PALESTINE_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Shop Name
              </label>
              <input
                id="name"
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="Search by shop name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <Search className="h-4 w-4 mr-2" />
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Searching...</p>
          </div>
        ) : shops.length === 0 ? (
          <div className="text-center py-8">
            <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No barber shops found. Try adjusting your search criteria.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <div key={shop._id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{shop.name}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {shop.city}
                    </span>
                  </div>

                  {shop.description && (
                    <p className="text-gray-600 text-sm mb-4">{shop.description}</p>
                  )}

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      {shop.address}
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      {shop.phone}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      {shop.barbers.length} barber{shop.barbers.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  <div className="mt-6">
                    <Link
                      href={`/customer/book?shopId=${shop._id}`}
                      className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Scissors className="h-4 w-4 mr-2" />
                      Book Appointment
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

