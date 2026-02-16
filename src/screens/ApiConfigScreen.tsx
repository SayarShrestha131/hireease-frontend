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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Server, Check, X, RefreshCw, Wifi, AlertCircle, CheckCircle } from 'lucide-react-native';
import { 
  getCurrentApiUrl, 
  updateApiBaseUrl, 
  setCustomApiUrl, 
  clearCustomApiUrl,
  autoDetectApiUrl,
  getNetworkInfo,
  testConnection as testApiConnection
} from '../config/api';
import apiClient from '../services/apiClient';

interface ApiConfigScreenProps {
  onNavigateBack: () => void;
}

export const ApiConfigScreen: React.FC<ApiConfigScreenProps> = ({ onNavigateBack }) => {
  const [customUrl, setCustomUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState(getCurrentApiUrl());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [autoDetecting, setAutoDetecting] = useState(false);

  useEffect(() => {
    setCurrentUrl(getCurrentApiUrl());
    loadNetworkInfo();
  }, []);

  const loadNetworkInfo = async () => {
    const info = await getNetworkInfo();
    setNetworkInfo(info);
  };

  const testConnection = async (url: string) => {
    setTesting(true);
    setTestResult(null);

    try {
      const isReachable = await testApiConnection(url);
      
      if (isReachable) {
        setTestResult('success');
        Alert.alert(
          '✅ Connection Successful',
          'Backend is accessible and responding correctly!'
        );
      } else {
        setTestResult('error');
        Alert.alert(
          '❌ Connection Failed',
          'Could not connect to backend. Please check:\n\n' +
          '1. Backend server is running\n' +
          '2. URL is correct\n' +
          '3. Both devices on same network (for local IP)\n' +
          '4. Firewall allows connections\n\n' +
          '💡 Tip: Use ngrok for reliable connection on any network'
        );
      }
    } catch (error) {
      setTestResult('error');
      Alert.alert(
        '❌ Connection Error',
        'Network error occurred. Check your internet connection.'
      );
    } finally {
      setTesting(false);
    }
  };

  const handleAutoDetect = async () => {
    setAutoDetecting(true);
    try {
      const detectedUrl = await autoDetectApiUrl();
      setCurrentUrl(detectedUrl);
      Alert.alert(
        '🔍 Auto-Detection Complete',
        `Using: ${detectedUrl}\n\nConnection test ${testResult === 'success' ? 'passed' : 'may have issues'}.`
      );
    } catch (error) {
      Alert.alert('Error', 'Auto-detection failed. Please set URL manually.');
    } finally {
      setAutoDetecting(false);
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
    { label: 'ngrok (Recommended)', url: 'https://xxxx-xxxx.ngrok-free.app/api', description: 'Works on any network' },
    { label: 'Localhost (Emulator)', url: 'http://10.0.2.2:5000/api', description: 'Android emulator only' },
    { label: 'Localhost (iOS)', url: 'http://localhost:5000/api', description: 'iOS simulator only' },
    { label: 'Local Network', url: 'http://192.168.1.X:5000/api', description: 'Same WiFi only' },
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
          {/* Network Status */}
          {networkInfo && (
            <View className="bg-white rounded-lg p-6 mb-6 shadow-sm">
              <View className="flex-row items-center mb-3">
                <Wifi size={20} color="#10B981" />
                <Text className="text-lg font-bold text-gray-800 ml-2">Network Status</Text>
              </View>
              <View className="space-y-2">
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text className="text-sm text-gray-600">Connection:</Text>
                  <View className="flex-row items-center">
                    {networkInfo.networkState.isConnected ? (
                      <CheckCircle size={16} color="#10B981" />
                    ) : (
                      <AlertCircle size={16} color="#EF4444" />
                    )}
                    <Text className={`text-sm ml-1 ${networkInfo.networkState.isConnected ? 'text-green-600' : 'text-red-600'}`}>
                      {networkInfo.networkState.isConnected ? 'Connected' : 'Disconnected'}
                    </Text>
                  </View>
                </View>
                <View className="flex-row justify-between py-2 border-b border-gray-100">
                  <Text className="text-sm text-gray-600">Network Type:</Text>
                  <Text className="text-sm text-gray-800 font-medium">{networkInfo.networkState.type}</Text>
                </View>
                <View className="flex-row justify-between py-2">
                  <Text className="text-sm text-gray-600">Your IP:</Text>
                  <Text className="text-sm text-gray-800 font-mono">{networkInfo.ipAddress}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={loadNetworkInfo}
                className="bg-gray-100 rounded-lg py-2 mt-3 flex-row items-center justify-center"
              >
                <RefreshCw size={16} color="#6B7280" />
                <Text className="text-gray-700 text-sm ml-2">Refresh</Text>
              </TouchableOpacity>
            </View>
          )}

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
              className="bg-[#0096c7] rounded-lg py-3 mt-4 mb-2 flex-row items-center justify-center"
            >
              {testing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <RefreshCw size={20} color="#FFFFFF" />
              )}
              <Text className="text-white font-semibold ml-2">
                {testing ? 'Testing...' : 'Test Connection'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleAutoDetect}
              disabled={autoDetecting}
              className="bg-purple-600 rounded-lg py-3 flex-row items-center justify-center"
            >
              {autoDetecting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Server size={20} color="#FFFFFF" />
              )}
              <Text className="text-white font-semibold ml-2">
                {autoDetecting ? 'Detecting...' : 'Auto-Detect Best URL'}
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
                <Text className="text-xs text-gray-500 mt-1">{item.description}</Text>
                <Text className="text-sm text-gray-600 mt-1 font-mono">{item.url}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Help Text */}
          <View className="bg-blue-50 rounded-lg p-4 mt-6 mb-4">
            <Text className="text-sm font-semibold text-blue-900 mb-2">💡 Connection Tips:</Text>
            <Text className="text-sm text-blue-800 mb-1">
              • <Text className="font-semibold">ngrok (Best):</Text> Works on any network (WiFi, mobile data, hotspot)
            </Text>
            <Text className="text-sm text-blue-800 mb-1">
              • <Text className="font-semibold">Local IP:</Text> Only works on same WiFi network
            </Text>
            <Text className="text-sm text-blue-800 mb-1">
              • <Text className="font-semibold">Find IP:</Text> Run 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux)
            </Text>
            <Text className="text-sm text-blue-800">
              • <Text className="font-semibold">Format:</Text> http://YOUR_IP:5000/api
            </Text>
          </View>

          <View className="bg-yellow-50 rounded-lg p-4 mb-6">
            <Text className="text-sm font-semibold text-yellow-900 mb-2">⚠️ Troubleshooting:</Text>
            <Text className="text-sm text-yellow-800 mb-1">
              1. Ensure backend is running (npm start in backend folder)
            </Text>
            <Text className="text-sm text-yellow-800 mb-1">
              2. Check firewall allows Node.js connections
            </Text>
            <Text className="text-sm text-yellow-800 mb-1">
              3. For mobile data/hotspot, use ngrok
            </Text>
            <Text className="text-sm text-yellow-800">
              4. See NETWORK_CONNECTION_GUIDE.md for detailed help
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
