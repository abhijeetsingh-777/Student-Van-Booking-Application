import axios from 'axios';
import Constants from 'expo-constants';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Auth APIs
export const authAPI = {
  register: async (data: any) => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },
  login: async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};

// Route APIs
export const routeAPI = {
  getAll: async (schoolCollege?: string) => {
    const params = schoolCollege ? { school_college: schoolCollege } : {};
    const response = await api.get('/api/routes', { params });
    return response.data;
  },
  getMyRoutes: async () => {
    const response = await api.get('/api/routes/my');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/api/routes/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/api/routes', data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/api/routes/${id}`);
    return response.data;
  },
};

// Booking APIs
export const bookingAPI = {
  create: async (data: any) => {
    const response = await api.post('/api/bookings', data);
    return response.data;
  },
  getMy: async () => {
    const response = await api.get('/api/bookings/my');
    return response.data;
  },
  update: async (id: string, status: string) => {
    const response = await api.put(`/api/bookings/${id}`, { status });
    return response.data;
  },
  startTrip: async (id: string) => {
    const response = await api.post(`/api/bookings/${id}/start-trip`);
    return response.data;
  },
  endTrip: async (id: string) => {
    const response = await api.post(`/api/bookings/${id}/end-trip`);
    return response.data;
  },
};

// Review APIs
export const reviewAPI = {
  create: async (data: any) => {
    const response = await api.post('/api/reviews', data);
    return response.data;
  },
  getDriverReviews: async (driverId: string) => {
    const response = await api.get(`/api/reviews/driver/${driverId}`);
    return response.data;
  },
};

// Driver APIs
export const driverAPI = {
  updateProfile: async (data: any) => {
    const response = await api.put('/api/drivers/profile', data);
    return response.data;
  },
  getAll: async () => {
    const response = await api.get('/api/drivers');
    return response.data;
  },
};

// SOS APIs
export const sosAPI = {
  create: async (data: any) => {
    const response = await api.post('/api/sos', data);
    return response.data;
  },
  getAll: async () => {
    const response = await api.get('/api/sos');
    return response.data;
  },
  resolve: async (id: string) => {
    const response = await api.put(`/api/sos/${id}/resolve`);
    return response.data;
  },
};

// Admin APIs
export const adminAPI = {
  getUsers: async () => {
    const response = await api.get('/api/admin/users');
    return response.data;
  },
  getPendingDrivers: async () => {
    const response = await api.get('/api/admin/drivers/pending');
    return response.data;
  },
  verifyDriver: async (driverId: string, action: string, reason?: string) => {
    const response = await api.put(`/api/admin/drivers/${driverId}/verify`, { action, reason });
    return response.data;
  },
  getLiveTrips: async () => {
    const response = await api.get('/api/admin/trips/live');
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/api/admin/stats');
    return response.data;
  },
};

export default api;
