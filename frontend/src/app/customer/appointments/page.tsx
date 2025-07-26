'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { appointmentAPI } from '@/utils/api';
import { Appointment } from '@/types';
import { Calendar, Clock, MapPin, User, DollarSign, X, CheckCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function CustomerAppointmentsPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (user?.role !== 'customer') {
      return;
    }
    loadAppointments();

    // Show success message if redirected from booking
    if (searchParams.get('success') === 'true') {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [user, searchParams]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const response = await appointmentAPI.getMyAppointments();
      setAppointments(response.data.appointments);
    } catch (error) {
      console.error('Load appointments error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    setCancellingId(appointmentId);
    try {
      await appointmentAPI.cancelAppointment(appointmentId);
      await loadAppointments(); // Reload appointments
    } catch (error) {
      console.error('Cancel appointment error:', error);
      alert('Failed to cancel appointment');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isUpcoming = (appointment: Appointment) => {
    const appointmentDateTime = new Date(`${appointment.appointmentDate.split('T')[0]}T${appointment.startTime}`);
    return appointmentDateTime > new Date() && appointment.status !== 'cancelled';
  };

  const upcomingAppointments = appointments.filter(isUpcoming);
  const pastAppointments = appointments.filter(app => !isUpcoming(app));

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
        <h1 className="text-3xl font-bold text-gray-900">My Appointments</h1>
        <p className="mt-2 text-gray-600">
          Manage your barber appointments
        </p>
      </div>

      {showSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          Appointment booked successfully!
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading appointments...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Upcoming Appointments */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Upcoming Appointments ({upcomingAppointments.length})
            </h2>
            {upcomingAppointments.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No upcoming appointments</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment._id} className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {appointment.serviceId.name}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              {formatDate(appointment.appointmentDate)}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              {appointment.startTime} - {appointment.endTime}
                            </div>
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-2" />
                              ${appointment.serviceId.price}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2" />
                              {appointment.barberId.name}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2" />
                              {appointment.shopId.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {appointment.shopId.address}, {appointment.shopId.city}
                            </div>
                          </div>
                        </div>

                        {appointment.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-600">
                              <strong>Notes:</strong> {appointment.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {appointment.status === 'pending' && (
                        <button
                          onClick={() => handleCancelAppointment(appointment._id)}
                          disabled={cancellingId === appointment._id}
                          className="ml-4 flex items-center px-3 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                        >
                          <X className="h-4 w-4 mr-1" />
                          {cancellingId === appointment._id ? 'Cancelling...' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Appointments */}
          {pastAppointments.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Past Appointments ({pastAppointments.length})
              </h2>
              <div className="space-y-4">
                {pastAppointments.map((appointment) => (
                  <div key={appointment._id} className="bg-white rounded-lg shadow-sm border p-6 opacity-75">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {appointment.serviceId.name}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2" />
                              {formatDate(appointment.appointmentDate)}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              {appointment.startTime} - {appointment.endTime}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-2" />
                              {appointment.barberId.name}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2" />
                              {appointment.shopId.name}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

