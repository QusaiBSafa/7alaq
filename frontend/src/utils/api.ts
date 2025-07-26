import axios from 'axios';
import { AuthResponse, User, Shop, Service, Availability, Appointment } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (data: {
    email: string;
    password: string;
    name: string;
    role: 'barber' | 'customer';
    phone?: string;
  }) => api.post<AuthResponse>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data),

  getMe: () => api.get<{ user: User }>('/auth/me'),

  logout: () => api.post('/auth/logout'),
};

// User API
export const userAPI = {
  getProfile: () => api.get<{ user: User }>('/users/profile'),
  updateProfile: (data: { name?: string; phone?: string }) =>
    api.put<{ user: User }>('/users/profile', data),
};

// Shop API
export const shopAPI = {
  create: (data: {
    name: string;
    description?: string;
    address: string;
    city: string;
    phone: string;
  }) => api.post<{ shop: Shop }>('/shops', data),

  getMyShops: () => api.get<{ shops: Shop[] }>('/shops/my'),
  getShop: (id: string) => api.get<{ shop: Shop }>(`/shops/${id}`),
  updateShop: (id: string, data: Partial<Shop>) =>
    api.put<{ shop: Shop }>(`/shops/${id}`, data),
  deleteShop: (id: string) => api.delete(`/shops/${id}`),

  addBarber: (shopId: string, email: string) =>
    api.post(`/shops/${shopId}/barbers`, { email }),
  removeBarber: (shopId: string, barberId: string) =>
    api.delete(`/shops/${shopId}/barbers/${barberId}`),

  searchByCity: (city: string) =>
    api.get<{ shops: Shop[] }>(`/shops/search/city/${city}`),
  search: (params: { city?: string; name?: string }) =>
    api.get<{ shops: Shop[] }>('/shops/search', { params }),
};

// Service API
export const serviceAPI = {
  create: (data: {
    shopId: string;
    name: string;
    description?: string;
    price: number;
    duration: number;
  }) => api.post<{ service: Service }>('/services', data),

  getShopServices: (shopId: string) =>
    api.get<{ services: Service[] }>(`/services/shop/${shopId}`),
  updateService: (id: string, data: Partial<Service>) =>
    api.put<{ service: Service }>(`/services/${id}`, data),
  deleteService: (id: string) => api.delete(`/services/${id}`),
};

// Availability API
export const availabilityAPI = {
  set: (data: {
    shopId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }) => api.post<{ availability: Availability }>('/availability', data),

  getBarberAvailability: (barberId: string) =>
    api.get<{ availability: Availability[] }>(`/availability/barber/${barberId}`),
  getMyAvailability: () =>
    api.get<{ availability: Availability[] }>('/availability/my'),
  updateAvailability: (id: string, data: Partial<Availability>) =>
    api.put<{ availability: Availability }>(`/availability/${id}`, data),
  deleteAvailability: (id: string) => api.delete(`/availability/${id}`),

  getAvailableSlots: (barberId: string, date: string) =>
    api.get<{ slots: string[] }>(`/availability/slots/${barberId}/${date}`),
};

// Appointment API
export const appointmentAPI = {
  book: (data: {
    barberId: string;
    shopId: string;
    serviceId: string;
    appointmentDate: string;
    startTime: string;
    notes?: string;
  }) => api.post<{ appointment: Appointment }>('/appointments', data),

  getMyAppointments: () =>
    api.get<{ appointments: Appointment[] }>('/appointments/my'),
  getBarberAppointments: () =>
    api.get<{ appointments: Appointment[] }>('/appointments/barber/my'),
  getAppointment: (id: string) =>
    api.get<{ appointment: Appointment }>(`/appointments/${id}`),

  updateStatus: (id: string, status: string) =>
    api.put<{ appointment: Appointment }>(`/appointments/${id}/status`, { status }),
  cancelAppointment: (id: string) => api.delete(`/appointments/${id}`),
};

export default api;

