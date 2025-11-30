/**
 * Forgot Password Screen
 * 
 * Allows users to request a password reset code by entering their email address.
 * Includes client-side validation and error handling.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Mail } from 'lucide-react-native';
import { ErrorMessage } from '../components/ErrorMessage';
import { validateEmail } from '../utils/validation';
import apiClient from '../services/apiClient';

interface ForgotPasswordScreenProps {
  onNavigateToLogin: () => void;
  onNavigateToVerifyCode: (email: string) => void;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ 
  onNavigateToLogin,
  onNavigateToVerifyCode
}) => {
  // Form state
  const [email, setEmail] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle email input change
   * Clears errors when user starts typing
   */
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (error) setError(null);
  };

  /**
   * Clear error message
   */
  const clearError = () => {
    setError(null);
  };

  /**
   * Validate email input
   * @returns true if email is valid, false otherwise
   */
  const validateForm = (): boolean => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  /**
   * Handle forgot password form submission
   * Sends request to backend API and navigates to verify code screen
   */
  const handleForgotPassword = async () => {
    // Clear previous messages
    setError(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Call forgot password API endpoint
      await apiClient.post('/auth/forgot-password', { email: email.trim() });

      // Navigate to verify code screen with email
      onNavigateToVerifyCode(email.trim());
    } catch (err: any) {
      // Handle error response
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.message === 'Network Error' || !err.response) {
        setError('Unable to connect. Please check your internet connection.');
      } else {
        setError('An error occurred. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          className="flex-1"
        >
          <View className="flex-1 px-6 py-8 justify-center">
            {/* Header */}
            <View className="items-center mb-8">
              <Text className="text-2xl font-bold text-gray-800 mb-2">
                Forgot Password
              </Text>
              <Text className="text-sm text-gray-600 text-center">
                Enter your email address and we'll send you a 6-digit verification code
              </Text>
            </View>

            {/* Error Message */}
            <ErrorMessage message={error} onDismiss={clearError} />

            {/* Email Input */}
            <View className="mb-6">
              <Text className="text-sm text-gray-600 mb-2">Email</Text>
              <View
                className={`flex-row items-center border rounded-lg px-4 py-3 bg-gray-50 ${
                  error ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <Mail size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-900"
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={handleEmailChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus={true}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              className={`rounded-lg py-4 items-center ${
                loading ? 'bg-gray-400' : 'bg-[#0096c7]'
              }`}
              onPress={handleForgotPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base font-semibold">
                  Send Verification Code
                </Text>
              )}
            </TouchableOpacity>

            {/* Back to Login Link */}
            <TouchableOpacity 
              onPress={onNavigateToLogin}
              disabled={loading}
              className="mt-6"
            >
              <Text className="text-[#0096c7] text-sm text-center">
                ← Back to Login
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
