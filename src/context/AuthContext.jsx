import React, { createContext, useState, useEffect, useContext } from 'react';
import { Box, CircularProgress } from '@mui/material';
import authService from '../services/authService';

export const AuthContext = createContext();

// Export useAuth hook directly from here
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

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  // Updated login: accepts entityType (null on first try, set on retry)
  const login = async (email, password, entityType = null) => {
    try {
      console.log('AuthContext: Starting login process for:', email, 'Type:', entityType);
      const response = await authService.login(email, password, entityType);
      console.log('AuthContext: Login successful', response.data.user);
      setUser(response.data.user);
      return response;
    } catch (error) {
      console.error('AuthContext: Login failed', error.message);
      // Re-throw the ORIGINAL error object so LoginForm can read
      // error.response.data.Matched_Accounts from it
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      console.log('AuthContext: Logout successful');
    } catch (error) {
      console.error('AuthContext: Logout error', error);
      setUser(null);
    }
  };

  // Forgot password — sends OTP to email
  const forgotPassword = async (email, entityType = null) => {
    try {
      console.log('AuthContext: Forgot password for:', email);
      const response = await authService.forgotPassword(email, entityType);
      console.log('AuthContext: Forgot password response:', response);
      return response;
    } catch (error) {
      console.error('AuthContext: Forgot password failed:', error.message);
      throw error;
    }
  };

  // Reset password — verifies OTP and sets new password
  const resetPassword = async (email, otp, password) => {
    try {
      console.log('AuthContext: Reset password for:', email);
      const response = await authService.resetPassword(email, otp, password);
      console.log('AuthContext: Reset password response:', response);
      return response;
    } catch (error) {
      console.error('AuthContext: Reset password failed:', error.message);
      throw error;
    }
  };

  const value = {
    user,
    login,
    logout,
    forgotPassword,
    resetPassword,
    isAuthenticated: !!user,
    loading,
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};