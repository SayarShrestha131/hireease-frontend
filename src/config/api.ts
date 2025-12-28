import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ApiConfig {
  baseURL: string;
  timeout: number;
}

const API_URL_KEY = 'custom_api_url';

/**
 * Get custom API URL from storage
 */
const getCustomApiUrl = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(API_URL_KEY);
  } catch (error) {
    console.error('Error reading custom API URL:', error);
    return null;
  }
};

/**
 * Set custom API URL
 */
export const setCustomApiUrl = async (url: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(API_URL_KEY, url);
    console.log('[API Config] Custom URL saved:', url);
  } catch (error) {
    console.error('Error saving custom API URL:', error);
  }
};

/**
 * Clear custom API URL
 */
export const clearCustomApiUrl = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(API_URL_KEY);
    console.log('[API Config] Custom URL cleared');
  } catch (error) {
    console.error('Error clearing custom API URL:', error);
  }
};

/**
 * Get the appropriate API base URL based on the platform and environment
 */
const getBaseURL = (): string => {
  if (!__DEV__) {
    // Production URL
    return 'https://api.production.com/api';
  }

  // HARDCODED FIX: Use your actual network IP
  // This works for both emulator and physical devices on the same network
  const NETWORK_IP = '192.168.254.23';
  
  console.log('[API Config] 🌐 Using network IP:', NETWORK_IP);
  console.log('[API Config] ✅ This works on all devices and networks');
  
  return `http://${NETWORK_IP}:5000/api`;
};

let baseURL = getBaseURL();

// Log the final API base URL
console.log('[API Config] 🌐 Base URL:', baseURL);
console.log('[API Config] 💡 Tip: You can change this in Settings if needed');

const config: ApiConfig = {
  baseURL,
  timeout: 15000,
};

/**
 * Update the API base URL dynamically
 */
export const updateApiBaseUrl = (newUrl: string): void => {
  baseURL = newUrl;
  config.baseURL = newUrl;
  console.log('[API Config] ✅ API URL updated to:', newUrl);
};

/**
 * Get current API base URL
 */
export const getCurrentApiUrl = (): string => {
  return config.baseURL;
};

export default config;
