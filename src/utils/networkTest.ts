/**
 * Network Testing Utilities
 * 
 * Provides functions to test network connectivity and API endpoints
 */

import { getCurrentApiUrl, testConnection } from '../config/api';

/**
 * Test network connectivity and API endpoints
 */
export const runNetworkDiagnostics = async (): Promise<void> => {
  console.log('🔍 [NetworkTest] Starting network diagnostics...');
  
  try {
    // Test current API URL
    const currentUrl = getCurrentApiUrl();
    console.log('🔍 [NetworkTest] Current API URL:', currentUrl);
    
    // Test connection to current URL
    const isConnected = await testConnection(currentUrl);
    console.log(`🔍 [NetworkTest] Connection test result: ${isConnected ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (!isConnected) {
      console.log('🔍 [NetworkTest] Testing fallback URLs...');
      
      // Test localhost
      const localhostUrl = 'http://localhost:5000/api';
      const localhostTest = await testConnection(localhostUrl);
      console.log(`🔍 [NetworkTest] Localhost test: ${localhostTest ? '✅ SUCCESS' : '❌ FAILED'}`);
      
      // Test network IP
      const networkUrl = 'http://192.168.254.10:5000/api';
      const networkTest = await testConnection(networkUrl);
      console.log(`🔍 [NetworkTest] Network IP test: ${networkTest ? '✅ SUCCESS' : '❌ FAILED'}`);
    }
    
  } catch (error) {
    console.error('🔍 [NetworkTest] Diagnostics failed:', error);
  }
};

/**
 * Test specific API endpoint
 */
export const testApiEndpoint = async (endpoint: string): Promise<boolean> => {
  try {
    const baseUrl = getCurrentApiUrl();
    const fullUrl = `${baseUrl}${endpoint}`;
    
    console.log(`🔍 [NetworkTest] Testing endpoint: ${fullUrl}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
    });
    
    clearTimeout(timeoutId);
    
    const success = response.ok;
    console.log(`🔍 [NetworkTest] Endpoint test result: ${success ? '✅ SUCCESS' : '❌ FAILED'} (${response.status})`);
    
    return success;
  } catch (error) {
    console.error(`🔍 [NetworkTest] Endpoint test failed:`, error);
    return false;
  }
};