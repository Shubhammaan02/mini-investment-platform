// frontend/src/services/api.ts
import axios from 'axios';

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // If we're in the browser, check the current origin
    const isProduction = window.location.hostname.includes('onrender.com');
    
    if (isProduction) {
      // In production, use relative URL since frontend and backend are same origin
      return '/api';
    }

    // In local development, use the full URL
    if (process.env.NEXT_PUBLIC_API_URL) {
      return process.env.NEXT_PUBLIC_API_URL;
    }
  }

  // Default fallback for SSR or local development
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

console.log('API Base URL:', API_BASE_URL);

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mini-investment-platform.onrender.com/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout to prevent hanging requests
  timeout: 30000,
  // Important for cookies/auth to work
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Add request ID for debugging
      config.headers['X-Request-ID'] = Date.now();
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log(`API Success: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
    });

    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        // Redirect to login with a return URL
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/signup') {
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }
      }
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error - server may be down');
      if (typeof window !== 'undefined') {
        // You could show a notification here
        console.warn('Cannot connect to server. Please check your internet connection.');
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to test API connection
export const testApiConnection = async () => {
  try {
    const response = await api.get('/health');
    return {
      connected: true,
      data: response.data,
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
    };
  }
};

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

  // Add test endpoint
  testPost: (data: any) => api.post('/test-post', data),
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

// Export a default instance
export default api;
