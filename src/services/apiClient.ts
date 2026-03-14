/**
 * API Client with Axios Interceptors
 */

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentApiUrl } from '../config/api';

console.log('🟢 [apiClient] Module loading...');

const TOKEN_KEY = 'auth_token';

/**
 * Callback function to handle 401 errors
 */
let onUnauthorizedCallback: (() => void) | null = null;

export const setUnauthorizedCallback = (callback: () => void) => {
  onUnauthorizedCallback = callback;
};

/**
 * Deep clone function to prevent frozen object issues
 */
function deepClone(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }
  
  const clonedObj: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  
  return clonedObj;
}

// Lazy initialization
let apiClient: AxiosInstance | null = null;

const getApiClient = (): AxiosInstance => {
  if (!apiClient) {
    const baseURL = getCurrentApiUrl();
    console.log('🟢 [apiClient] Creating axios instance with baseURL:', baseURL);
    
    apiClient = axios.create({
      baseURL: baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('🟢 [apiClient] Axios instance created');
    
    // Setup request interceptor
    apiClient.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        (config as any).metadata = { startTime: Date.now() };
        
        try {
          const token = await AsyncStorage.getItem(TOKEN_KEY);
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('🔴 [apiClient] Error retrieving token:', error);
        }
        
        return config;
      },
      (error) => {
        console.error('🔴 [apiClient] Request error:', error);
        return Promise.reject(error);
      }
    );
    
    // Setup response interceptor
    apiClient.interceptors.response.use(
      (response: AxiosResponse) => {
        try {
          response.data = deepClone(response.data);
        } catch (cloneError) {
          console.warn('🔴 [apiClient] Failed to clone response data:', cloneError);
        }
        return response;
      },
      async (error: AxiosError) => {
        if (error.response && error.response.status === 401) {
          try {
            await AsyncStorage.removeItem(TOKEN_KEY);
            await AsyncStorage.removeItem('auth_user');
            console.log('🔐 [apiClient] 401 - Token cleared');
            
            if (onUnauthorizedCallback) {
              console.log('🔐 [apiClient] Triggering logout...');
              onUnauthorizedCallback();
            }
          } catch (storageError) {
            console.error('🔴 [apiClient] Error clearing token:', storageError);
          }
        }
        return Promise.reject(error);
      }
    );
    
    console.log('🟢 [apiClient] Interceptors set up');
  }
  return apiClient;
};

export default getApiClient();
export { TOKEN_KEY };
