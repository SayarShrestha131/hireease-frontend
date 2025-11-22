/**
 * API Client with Axios Interceptors
 * 
 * This module provides a configured Axios instance with request and response interceptors
 * for handling JWT token authentication and automatic logout on 401 errors.
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config/api';

/**
 * Storage key for JWT token in AsyncStorage
 */
const TOKEN_KEY = 'auth_token';

/**
 * Configured Axios instance with interceptors
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: config.baseURL,
  timeout: config.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * Automatically attaches JWT token from AsyncStorage to Authorization header
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Retrieve token from AsyncStorage
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      
      // If token exists, attach it to the Authorization header
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error retrieving token from AsyncStorage:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles 401 errors by triggering logout and clearing stored credentials
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Pass through successful responses
    return response;
  },
  async (error: AxiosError) => {
    // Check if error is a 401 Unauthorized response
    if (error.response && error.response.status === 401) {
      try {
        // Clear stored token from AsyncStorage
        await AsyncStorage.removeItem(TOKEN_KEY);
        
        // Note: The actual logout logic (clearing user state, navigation) 
        // will be handled by the AuthContext when it detects the 401 error
        console.log('401 Unauthorized - Token cleared from storage');
      } catch (storageError) {
        console.error('Error clearing token from AsyncStorage:', storageError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
export { TOKEN_KEY };
