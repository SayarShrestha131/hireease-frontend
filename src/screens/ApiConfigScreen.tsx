/**
 * API Configuration Screen
 * 
 * Allows users to configure custom API URL for different networks
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Server, Check, X, RefreshCw } from 'lucide-react-native';
import { getCurrentApiUrl, updateApiBaseUrl, setCustomApiUrl, clearCustomApiUrl } from '../config/api';
import apiClient from '../services/apiClient';

interface ApiConfigScreenProps {
  onNavigateBack: () => void;
}

export const ApiConfigScreen: React.FC<ApiConfigScreenProps> = ({ onNavigateBack }) => {
  const [customUrl, setCustomUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState(getCurrentApiUrl());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    setCurrentUrl(getCurrentApiUrl());
  }, []);

  const testConnection = async (url: string) => {
    setTesting(true);
    setTestResult(null);

    try {
      // Temporarily update the URL for testing
      const originalUrl = apiClient.defaults.baseURL;
      apiClient.defaults.baseURL = url;

      const response = await apiClient.get('/health');
      
      if (response.data.success) {
        setTestResult('success');
        Alert.alert('Success', 'Connection successful! Backend is accessible.');
      } else {
        setTestResult('error');
        Alert.alert('Error', 'Backend responded but with an error.');
      }

      // Restore original URL
      apiClient.defaults.baseURL = originalUrl;
    } catch (error) {
      setTestResult('error');
      Alert.alert(
        'Connection Failed',
        'Could not connect to backend. Please check:\n\n' +
        '1. Backend is running\n' +
        '2. URL is correct\n' +
        '3. You are on the same network'
      );
      
      // Restore original URL
      apiClient.defaults.baseURL = getCurrentApiUrl();
    } finally {
      setTesting(false);
    }
  };

  const saveCustomUrl = async () => {
    if (!customUrl.trim()) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    // Validate URL format
    if (!customUrl.startsWith('http://') && !customUrl.startsWith('https://')) {
      Alert.alert('Error', 'URL must start with http:// or https://');
      return;
    }

    // Test connection first
    await testConnection(customUrl);

    if (testResult === 'success') {
      await setCustomApiUrl(customUrl);
      updateApiBaseUrl(customUrl);
      setCurrentUrl(customUrl);
      Alert.alert('Success', 'API URL updated successfully!');
    }
  };

  const resetToAuto = async () => {
    await clearCustomApiUrl();
    // Reload the app to re-detect
    Alert.alert(
      'Reset Complete',
      'API URL reset to auto-detect. Please restart the app for changes to take effect.',
      [{ text: 'OK', onPress: onNavigateBack }]
    );
  };

  const commonUrls = [
    { label: 'Localhost (Emulator)', url: 'http://10.0.2.2:5000/api' },
    { label: 'Localhost (iOS)', url: 'http://localhost:5000/api' },
    { label: 'Local Network', url: 'http://192.168.1.X:5000/api' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-white px-6 pt-6 pb-4 border-b border-gray-200">
          <TouchableOpacity onPress={onNavigateBack} className="mb-3">
            <Text className="text-[#0096c7] text-base">← Back</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-800">API Configuration</Text>
          <Text className="text-sm text-gray-600 mt-2">
            Configure backend server connection
          </Text>
        </View>

        <View className="px-6 py-6">
          {/* Current URL */}
          <View className="bg-white rounded-lg p-6 mb-6 shadow-sm">
            <View className="flex-row items-center mb-3">
              <Server size={20} color="#0096c7" />
              <Text className="text-lg font-bold text-gray-800 ml-2">Current API URL</Text>
            </View>
            <View className="bg-gray-100 rounded-lg p-4">
              <Text className="text-sm text-gray-800 font-mono">{currentUrl}</Text>
            </View>
            <TouchableOpacity
              onPress={() => testConnection(currentUrl)}
              disabled={testing}
              className="bg-[#0096c7] rounded-lg py-3 mt-4 flex-row items-center justify-center"
            >
              <RefreshCw size={20} color="#FFFFFF" />
              <Text className="text-white font-semibold ml-2">
                {testing ? 'Testing...' : 'Test Connection'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Custom URL Input */}
          <View className="bg-white rounded-lg p-6 mb-6 shadow-sm">
            <Text className="text-lg font-bold text-gray-800 mb-4">Set Custom URL</Text>
            
            <Text className="text-sm text-gray-600 mb-2">Backend API URL</Text>
            <TextInput
              value={customUrl}
              onChangeText={setCustomUrl}
              placeholder="http://192.168.1.100:5000/api"
              className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-800 mb-4"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              onPress={saveCustomUrl}
              disabled={testing}
              className="bg-green-600 rounded-lg py-3 mb-3 flex-row items-center justify-center"
            >
              <Check size={20} color="#FFFFFF" />
              <Text className="text-white font-semibold ml-2">Save & Test</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={resetToAuto}
              className="bg-gray-200 rounded-lg py-3 flex-row items-center justify-center"
            >
              <X size={20} color="#374151" />
              <Text className="text-gray-800 font-semibold ml-2">Reset to Auto-Detect</Text>
            </TouchableOpacity>
          </View>

          {/* Common URLs */}
          <View className="bg-white rounded-lg p-6 shadow-sm">
            <Text className="text-lg font-bold text-gray-800 mb-4">Quick Select</Text>
            {commonUrls.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => setCustomUrl(item.url)}
                className="border border-gray-200 rounded-lg p-4 mb-3"
              >
                <Text className="text-base font-semibold text-gray-800">{item.label}</Text>
                <Text className="text-sm text-gray-600 mt-1 font-mono">{item.url}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Help Text */}
          <View className="bg-blue-50 rounded-lg p-4 mt-6">
            <Text className="text-sm font-semibold text-blue-900 mb-2">💡 Tips:</Text>
            <Text className="text-sm text-blue-800 mb-1">
              • Find your IP: Run 'ipconfig' on Windows
            </Text>
            <Text className="text-sm text-blue-800 mb-1">
              • Format: http://YOUR_IP:5000/api
            </Text>
            <Text className="text-sm text-blue-800">
              • Both devices must be on same WiFi
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
