'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { shopAPI, serviceAPI, availabilityAPI, appointmentAPI } from '@/utils/api';
import { Shop, Service, User } from '@/types';
import { Calendar, Clock, DollarSign, User as UserIcon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function BookAppointmentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const shopId = searchParams.get('shopId');

  const [shop, setShop] = useState<Shop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<User | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!shopId || user?.role !== 'customer') {
      return;
    }
    loadShopData();
  }, [shopId, user]);

  useEffect(() => {
    if (selectedBarber && selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedBarber, selectedDate]);

  const loadShopData = async () => {
    setLoading(true);
    try {
      const [shopResponse, servicesResponse] = await Promise.all([
        shopAPI.getShop(shopId!),
        serviceAPI.getShopServices(shopId!)
      ]);
      
      setShop(shopResponse.data.shop);
      setServices(servicesResponse.data.services);
    } catch (error) {
      console.error('Load shop data error:', error);
      setError('Failed to load shop information');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedBarber || !selectedDate) return;

    try {
      const response = await availabilityAPI.getAvailableSlots(selectedBarber._id, selectedDate);
      setAvailableSlots(response.data.slots);
    } catch (error) {
      console.error('Load slots error:', error);
      setAvailableSlots([]);
    }
  };

  const handleBooking = async () => {
    if (!selectedBarber || !selectedService || !selectedDate || !selectedTime) {
      setError('Please fill in all required fields');
      return;
    }

    setBookingLoading(true);
    setError('');

    try {
      await appointmentAPI.book({
        barberId: selectedBarber._id,
        shopId: shopId!,
        serviceId: selectedService._id,
        appointmentDate: selectedDate,
        startTime: selectedTime,
        notes
      });

      router.push('/customer/appointments?success=true');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to book appointment');
    } finally {
      setBookingLoading(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30); // 30 days from now
    return maxDate.toISOString().split('T')[0];
  };

  if (user?.role !== 'customer') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Access denied. Customer account required.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Shop not found</p>
        <Link href="/customer/search" className="text-blue-600 hover:text-blue-500">
          Back to search
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href="/customer/search"
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to search
        </Link>
      </div>

      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Book Appointment</h1>
        <p className="mt-2 text-gray-600">at {shop.name}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        {/* Shop Info */}
        <div className="border-b pb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{shop.name}</h2>
          <p className="text-gray-600">{shop.address}, {shop.city}</p>
          <p className="text-gray-600">{shop.phone}</p>
        </div>

        {/* Barber Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Barber
          </label>
          <div className="grid grid-cols-1 gap-3">
            {shop.barbers.map((barber) => (
              <button
                key={barber._id}
                onClick={() => setSelectedBarber(barber)}
                className={`flex items-center p-3 border rounded-lg text-left ${
                  selectedBarber?._id === barber._id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <UserIcon className="h-5 w-5 mr-3 text-gray-400" />
                <span className="font-medium">{barber.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Service Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Service
          </label>
          <div className="grid grid-cols-1 gap-3">
            {services.map((service) => (
              <button
                key={service._id}
                onClick={() => setSelectedService(service)}
                className={`flex items-center justify-between p-3 border rounded-lg text-left ${
                  selectedService?._id === service._id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div>
                  <div className="font-medium">{service.name}</div>
                  {service.description && (
                    <div className="text-sm text-gray-600">{service.description}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex items-center text-green-600 font-medium">
                    <DollarSign className="h-4 w-4" />
                    {service.price}
                  </div>
                  <div className="flex items-center text-gray-500 text-sm">
                    <Clock className="h-4 w-4 mr-1" />
                    {service.duration} min
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Date Selection */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Select Date
          </label>
          <input
            id="date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={getMinDate()}
            max={getMaxDate()}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Time Selection */}
        {selectedBarber && selectedDate && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Time
            </label>
            {availableSlots.length === 0 ? (
              <p className="text-gray-600">No available slots for this date</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                    className={`p-2 border rounded text-sm ${
                      selectedTime === slot
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any special requests or notes..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Book Button */}
        <div className="pt-4">
          <button
            onClick={handleBooking}
            disabled={!selectedBarber || !selectedService || !selectedDate || !selectedTime || bookingLoading}
            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Calendar className="h-5 w-5 mr-2" />
            {bookingLoading ? 'Booking...' : 'Book Appointment'}
          </button>
        </div>
      </div>
    </div>
  );
}

