import { Platform } from 'react-native';
import Constants from 'expo-constants';
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
 * Get the appropriate API base URL based on the platform and environment
 */
const getBaseURL = (): string => {
  if (!__DEV__) {
    // Production URL
    return 'https://api.production.com/api';
  }

  // RECOMMENDED: Use ngrok for reliable connection on any network
  // 1. Install ngrok: https://ngrok.com/download
  // 2. Run: ngrok http 5000
  // 3. Copy the https URL and paste it below
  // Example: 'https://1a2b-3c4d-5e6f.ngrok-free.app/api'
  const NGROK_URL = "https://nonmental-nonprepositionally-dani.ngrok-free.dev/api"
  
  if (NGROK_URL) {
    console.log('[API Config] 🌍 Using ngrok URL (works on any network)');
    console.log('[API Config] 🔗 URL:', NGROK_URL);
    return NGROK_URL;
  }

  // Fallback: Use local network IP (only works on same WiFi)
  const NETWORK_IP = '10.218.131.72';
  console.log('[API Config] 🌐 Using network IP:', NETWORK_IP);
  console.log('[API Config] ⚠️  Both devices must be on same WiFi');
  console.log('[API Config] 💡 For mobile data/hotspot, use ngrok instead');
  
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

/**
 * Export API_BASE_URL for direct access
 */
export const API_BASE_URL = config.baseURL;

/**
 * Auto-detect and set the best API URL
 */
export const autoDetectApiUrl = async (): Promise<string> => {
  console.log('[API Config] 🔍 Auto-detecting best API URL...');
  
  // Try custom URL first
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
  
  // Try last working URL
  const lastWorkingUrl = await getLastWorkingUrl();
  if (lastWorkingUrl && lastWorkingUrl !== customUrl) {
    console.log('[API Config] Testing last working URL:', lastWorkingUrl);
    if (await testConnection(lastWorkingUrl)) {
      updateApiBaseUrl(lastWorkingUrl);
      console.log('[API Config] ✅ Using last working URL');
      return lastWorkingUrl;
    }
  }
  
  // Try current configured URL
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
