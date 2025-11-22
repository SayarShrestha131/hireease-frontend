/**
 * Authentication Context
 * 
 * This module provides global authentication state management using React Context.
 * It handles user registration, login, logout, and session restoration from AsyncStorage.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AxiosError } from 'axios';
import apiClient, { TOKEN_KEY } from '../services/apiClient';
import { User, AuthResponse, ErrorResponse, AuthContextType } from '../types/auth';

/**
 * Storage key for user data in AsyncStorage
 */
const USER_KEY = 'auth_user';

/**
 * Create the Authentication Context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider Component
 * Wraps the application and provides authentication state and methods to all child components
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Computed property: isAuthenticated
   * Returns true if user is logged in
   */
  const isAuthenticated = user !== null;

  /**
   * Check authentication status on mount
   * Restores user session from AsyncStorage if token exists
   */
  useEffect(() => {
    checkAuthStatus();
  }, []);

  /**
   * Check if user has a valid session stored in AsyncStorage
   */
  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      
      // Retrieve token and user data from AsyncStorage
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const userData = await AsyncStorage.getItem(USER_KEY);

      if (token && userData) {
        // Parse and restore user data
        const parsedUser: User = JSON.parse(userData);
        setUser(parsedUser);
      }
    } catch (err) {
      console.error('Error checking auth status:', err);
      // Clear potentially corrupted data
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register a new user
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise with success status and optional error message
   */
  const register = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      // Make POST request to register endpoint
      const response = await apiClient.post<AuthResponse>('/auth/register', {
        email,
        password,
      });

      // Extract user and token from response
      const { user: userData, token } = response.data.data;

      // Store token and user data in AsyncStorage
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));

      // Update state
      setUser(userData);
      setError(null);

      return { success: true };
    } catch (err) {
      const errorMessage = handleAuthError(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login an existing user
   * @param email - User's email address
   * @param password - User's password
   * @returns Promise with success status and optional error message
   */
  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      // Make POST request to login endpoint
      const response = await apiClient.post<AuthResponse>('/auth/login', {
        email,
        password,
      });

      // Extract user and token from response
      const { user: userData, token } = response.data.data;

      // Store token and user data in AsyncStorage
      await AsyncStorage.setItem(TOKEN_KEY, token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));

      // Update state
      setUser(userData);
      setError(null);

      return { success: true };
    } catch (err) {
      const errorMessage = handleAuthError(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout the current user
   * Clears token and user data from AsyncStorage and resets state
   */
  const logout = async (): Promise<void> => {
    try {
      setLoading(true);

      // Clear token and user data from AsyncStorage
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);

      // Reset state
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('Error during logout:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear error state
   */
  const clearError = (): void => {
    setError(null);
  };

  /**
   * Handle authentication errors and return user-friendly messages
   * @param err - Error object from axios request
   * @returns User-friendly error message
   */
  const handleAuthError = (err: unknown): string => {
    if (err instanceof AxiosError) {
      // Network error (no response from server)
      if (!err.response) {
        return 'Unable to connect to server. Please check your internet connection.';
      }

      // Extract error response
      const errorResponse = err.response.data as ErrorResponse;

      // Handle specific status codes
      switch (err.response.status) {
        case 400:
          // Validation errors
          if (errorResponse.error?.errors && errorResponse.error.errors.length > 0) {
            // Return first validation error message
            return errorResponse.error.errors[0].message;
          }
          return errorResponse.error?.message || 'Invalid request. Please check your input.';

        case 401:
          return 'Invalid email or password.';

        case 409:
          return 'An account with this email already exists.';

        case 500:
          return 'Something went wrong. Please try again later.';

        default:
          return errorResponse.error?.message || 'An unexpected error occurred.';
      }
    }

    // Generic error fallback
    return 'An unexpected error occurred. Please try again.';
  };

  // Context value
  const value: AuthContextType = {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to access authentication context
 * @throws Error if used outside of AuthProvider
 * @returns AuthContextType
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
