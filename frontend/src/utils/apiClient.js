"use client";
import axios from 'axios';

// Create axios instance
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // Always send cookies
});

// Request interceptor to add Authorization header
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
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

// Response interceptor to handle authentication errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if unauthorized
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        // Redirect to login if not on login page
        if (!window.location.pathname.includes('/login')) {
          console.log('Unauthorized - redirecting to login');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;