import { Platform } from 'react-native';
import Constants from 'expo-constants';

interface ApiConfig {
  baseURL: string;
  timeout: number;
}

/**
 * Get the appropriate API base URL based on the platform and environment
 */
const getBaseURL = (): string => {
  if (!__DEV__) {
    // Production URL
    return 'https://api.production.com/api';
  }

  // For Expo Go or physical devices, use the local network IP
  // This gets the IP address from Expo's manifest
  const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
  
  if (debuggerHost) {
    console.log('[API Config] Detected network IP:', debuggerHost);
    return `http://${debuggerHost}:5000/api`;
  }

  // Development URLs for simulators/emulators
  if (Platform.OS === 'android') {
    // Android emulator uses 10.0.2.2 to access host machine's localhost
    return 'http://10.0.2.2:5000/api';
  }

  if (Platform.OS === 'ios') {
    // iOS simulator can use localhost
    return 'http://localhost:5000/api';
  }

  // Fallback to localhost
  console.warn('[API Config] Could not detect network IP, falling back to localhost');
  return 'http://localhost:5000/api';
};

const baseURL = getBaseURL();

// Log the API base URL for debugging
console.log('[API Config] Base URL:', baseURL);

const config: ApiConfig = {
  baseURL,
  timeout: 10000, // 10 seconds
};

export default config;
