// frontend/src/services/api.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mini-investment-platform.onrender.com/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  
  signup: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    riskAppetite: string;
  }) => api.post('/auth/signup', data),
  
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  
  resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
    api.post('/auth/reset-password', data),
  
  getProfile: () => api.get('/auth/profile'),
  
  generatePassword: () => api.get('/auth/generate-password'),
};

// Products API
export const productsAPI = {
  getProducts: (params?: any) => api.get('/products', { params }),
  
  getProduct: (id: string) => api.get(`/products/${id}`),
  
  getRecommendations: () => api.get('/products/recommendations'),
  
  getInsights: () => api.get('/products/insights'),
  
  createProduct: (data: any) => api.post('/products', data),
  
  updateProduct: (id: string, data: any) => api.put(`/products/${id}`, data),
  
  deleteProduct: (id: string) => api.delete(`/products/${id}`),
};

// Investments API
export const investmentsAPI = {
  createInvestment: (data: { productId: string; amount: number }) =>
    api.post('/investments', data),
  
  simulateInvestment: (data: { productId: string; amount: number }) =>
    api.post('/investments/simulate', data),
  
  getPortfolio: () => api.get('/investments/portfolio'),
  
  getPerformance: (params?: any) => api.get('/investments/performance', { params }),
  
  getInvestment: (id: string) => api.get(`/investments/${id}`),
};

// Admin API
export const adminAPI = {
  getLogs: (params?: any) => api.get('/admin/logs', { params }),
  
  getDashboardStats: () => api.get('/admin/logs/dashboard'),
  
  getErrorSummary: (params?: any) => api.get('/admin/logs/errors/summary', { params }),
  
  getSystemHealth: (params?: any) => api.get('/admin/logs/health', { params }),
  
  getUserLogs: (identifier: string) => api.get(`/admin/logs/user/${identifier}`),
  
  cleanupLogs: (data: { olderThanDays: number }) => api.delete('/admin/logs/cleanup', { data }),
};

// Health check
export const healthAPI = {
  check: () => api.get('/health'),
};
