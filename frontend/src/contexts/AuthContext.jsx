"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import apiClient from '../utils/apiClient';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (credentials) => {
    try {
      const response = await apiClient.post('/login', credentials);
      
      if (response.data.success) {
        const { user, token } = response.data;
        
        // Store token in localStorage
        if (token) {
          localStorage.setItem('auth_token', token);
        }
        
        setUser(user);
        return { success: true, user };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiClient.post('/register', userData);
      
      if (response.data.success) {
        const { user, token } = response.data;
        
        // Store token in localStorage
        if (token) {
          localStorage.setItem('auth_token', token);
        }
        
        setUser(user);
        return { success: true, user };
      }
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: error.response?.data?.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state
      localStorage.removeItem('auth_token');
      setUser(null);
    }
  };

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await apiClient.get('/myprofile');
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid token
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};