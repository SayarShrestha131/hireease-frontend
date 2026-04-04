import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';

interface ApiConfig {
  baseURL: string;
  timeout: number;
}

const API_URL_KEY = 'custom_api_url';
const LAST_WORKING_URL_KEY = 'last_working_api_url';

/**
 * Get custom API URL from storage
 */
export const getCustomApiUrl = async (): Promise<string | null> => {
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
 * Save last working URL
 */
export const saveLastWorkingUrl = async (url: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LAST_WORKING_URL_KEY, url);
  } catch (error) {
    console.error('Error saving last working URL:', error);
  }
};

/**
 * Get last working URL
 */
export const getLastWorkingUrl = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(LAST_WORKING_URL_KEY);
  } catch (error) {
    console.error('Error reading last working URL:', error);
    return null;
  }
};

/**
 * Test if a URL is reachable
 */
export const testConnection = async (url: string): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log(`[API Config] Connection test failed for ${url}:`, error);
    return false;
  }
};

/**
 * Get the appropriate API base URL
 */
const getBaseURL = (): string => {
  try {
    const configuredBaseUrl =
      typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_BASE_URL
        ? process.env.EXPO_PUBLIC_API_BASE_URL
        : null;
    if (configuredBaseUrl) return configuredBaseUrl;

    const NGROK_URL = typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_NGROK_URL 
      ? `${process.env.EXPO_PUBLIC_NGROK_URL}/api`
      : null;

    if (NGROK_URL) {
      return NGROK_URL;
    }

    const NETWORK_IP = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_NETWORK_IP) || '127.0.0.1';
    const fallbackURL = `http://${NETWORK_IP}:5000/api`;
    return fallbackURL;
  } catch (error) {
    console.error('[API Config] Error getting base URL:', error);
    return 'http://127.0.0.1:5000/api';
  }
};

// Don't call getBaseURL() at module load - use a default value
let baseURL = 'http://127.0.0.1:5000/api';
let isInitialized = false;

// Initialize on first access
const initializeConfig = () => {
  if (!isInitialized) {
    baseURL = getBaseURL();
    isInitialized = true;
  }
};

// Create simple config object with getter
const config: ApiConfig = {
  get baseURL() {
    initializeConfig();
    return baseURL;
  },
  set baseURL(value: string) {
    baseURL = value;
  },
  timeout: 15000,
};

/**
 * Update the API base URL dynamically
 */
export const updateApiBaseUrl = (newUrl: string): void => {
  baseURL = newUrl;
  isInitialized = true;
  console.log('[API Config] ✅ API URL updated to:', newUrl);
};

/**
 * Get current API base URL
 */
export const getCurrentApiUrl = (): string => {
  initializeConfig();
  return baseURL;
};

/**
 * Export API_BASE_URL getter for direct access
 */
export const getApiBaseUrl = (): string => {
  initializeConfig();
  return baseURL;
};

/**
 * Auto-detect and set the best API URL
 */
export const autoDetectApiUrl = async (): Promise<string> => {
  console.log('[API Config] 🔍 Auto-detecting best API URL...');
  
  const customUrl = await getCustomApiUrl();
  if (customUrl) {
    console.log('[API Config] Testing custom URL:', customUrl);
    if (await testConnection(customUrl)) {
      updateApiBaseUrl(customUrl);
      await saveLastWorkingUrl(customUrl);
      console.log('[API Config] ✅ Using custom URL');
      return customUrl;
    }
  }
  
  const lastWorkingUrl = await getLastWorkingUrl();
  if (lastWorkingUrl && lastWorkingUrl !== customUrl) {
    console.log('[API Config] Testing last working URL:', lastWorkingUrl);
    if (await testConnection(lastWorkingUrl)) {
      updateApiBaseUrl(lastWorkingUrl);
      console.log('[API Config] ✅ Using last working URL');
      return lastWorkingUrl;
    }
  }
  
  const currentUrl = getCurrentApiUrl();
  console.log('[API Config] Testing current URL:', currentUrl);
  if (await testConnection(currentUrl)) {
    await saveLastWorkingUrl(currentUrl);
    console.log('[API Config] ✅ Current URL is working');
    return currentUrl;
  }
  
  console.log('[API Config] ⚠️ No working URL found, using default');
  return currentUrl;
};

/**
 * Get network information
 */
export const getNetworkInfo = async () => {
  try {
    const networkState = await Network.getNetworkStateAsync();
    const ipAddress = await Network.getIpAddressAsync();
    
    console.log('[API Config] 📱 Network Info:');
    console.log('  - Type:', networkState.type);
    console.log('  - Connected:', networkState.isConnected);
    console.log('  - Internet:', networkState.isInternetReachable);
    console.log('  - IP Address:', ipAddress);
    
    return { networkState, ipAddress };
  } catch (error) {
    console.error('[API Config] Error getting network info:', error);
    return null;
  }
};

export default config;
