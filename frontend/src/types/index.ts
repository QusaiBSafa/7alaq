export interface User {
  _id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'barber' | 'customer';
  createdAt: string;
  updatedAt: string;
}

export interface Shop {
  _id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  phone: string;
  owner: User;
  barbers: User[];
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  _id: string;
  shopId: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  createdAt: string;
  updatedAt: string;
}

export interface Availability {
  _id: string;
  barberId: string;
  shopId: Shop;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  _id: string;
  customerId: User;
  barberId: User;
  shopId: Shop;
  serviceId: Service;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  message?: string;
  data?: T;
  error?: string;
}

export const PALESTINE_CITIES = [
  'Ramallah',
  'Nablus',
  'Hebron',
  'Bethlehem',
  'Jenin',
  'Tulkarm',
  'Qalqilya',
  'Salfit',
  'Jericho',
  'Tubas'
] as const;

export type PalestineCity = typeof PALESTINE_CITIES[number];

