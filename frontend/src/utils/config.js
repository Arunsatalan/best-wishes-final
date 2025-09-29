// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL_2 || 'https://best-wishes-final-production-e20b.up.railway.app',
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://best-wishes-final-production-e20b.up.railway.app/api',
  
  // For server-side functions (fallback to production)
  getBaseUrl: () => {
    if (typeof window === 'undefined') {
      // Server-side
      return process.env.NEXT_PUBLIC_API_URL_2 || 'https://best-wishes-final-production-e20b.up.railway.app';
    }
    // Client-side
    return process.env.NEXT_PUBLIC_API_URL_2 || 'https://best-wishes-final-production-e20b.up.railway.app';
  },
  
  getApiUrl: () => {
    if (typeof window === 'undefined') {
      // Server-side
      return process.env.NEXT_PUBLIC_API_URL || 'https://best-wishes-final-production-e20b.up.railway.app/api';
    }
    // Client-side
    return process.env.NEXT_PUBLIC_API_URL || 'https://best-wishes-final-production-e20b.up.railway.app/api';
  }
};