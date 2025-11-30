/**
 * Email Verification Screen
 * 
 * Allows users to enter the 6-digit verification code received via email after registration
 */

import React, { useState, useRef, useEffect } from 'react';
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
import apiClient from '../services/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface EmailVerificationScreenProps {
  email: string;
  onVerificationSuccess: () => void;
  onNavigateToLogin: () => void;
}

export const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({
  email,
  onVerificationSuccess,
  onNavigateToLogin,
}) => {
  // Form state - array of 6 digits
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Refs for each input field
  const inputRefs = useRef<(TextInput | null)[]>([]);

  /**
   * Resend cooldown timer effect
   */
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  /**
   * Focus first input on mount
   */
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  /**
   * Clear error message
   */
  const clearError = () => {
    setError(null);
  };

  /**
   * Handle code input change
   */
  const handleCodeChange = (value: string, index: number) => {
    // Only allow single numeric digit
    if (value.length > 1) {
      value = value.slice(-1);
    }

    if (value && !/^\d$/.test(value)) {
      return;
    }

    // Clear error when user starts typing
    if (error) setError(null);

    // Update code array
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input if digit was entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all digits are entered
    if (value && index === 5 && newCode.every(digit => digit !== '')) {
      handleVerifyEmail(newCode.join(''));
    }
  };

  /**
   * Handle backspace key press
   */
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && code[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  /**
   * Verify email with code
   */
  const handleVerifyEmail = async (codeString: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post('/auth/verify-email', {
        email,
        code: codeString,
      });

      // Store token
      if (response.data.data?.token) {
        await AsyncStorage.setItem('token', response.data.data.token);
      }

      // Navigate to success/login
      onVerificationSuccess();
    } catch (err: any) {
      // Handle error response
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.message === 'Network Error' || !err.response) {
        setError('Unable to connect. Please check your internet connection.');
      } else {
        setError('Invalid or expired code. Please try again.');
      }

      // Clear code inputs on error
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resend verification code
   */
  const handleResendCode = async () => {
    setError(null);
    setLoading(true);

    try {
      await apiClient.post('/auth/resend-verification', { email });

      // Start 60-second cooldown
      setResendCooldown(60);

      // Clear code inputs
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.message === 'Network Error' || !err.response) {
        setError('Unable to connect. Please check your internet connection.');
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
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
              <View className="bg-[#0096c7] rounded-full p-4 mb-4">
                <Mail size={32} color="#FFFFFF" />
              </View>
              <Text className="text-2xl font-bold text-gray-800 mb-2">
                Verify Your Email
              </Text>
              <Text className="text-sm text-gray-600 text-center">
                Enter the 6-digit code sent to
              </Text>
              <Text className="text-sm text-gray-800 font-semibold text-center mt-1">
                {email}
              </Text>
            </View>

            {/* Error Message */}
            <ErrorMessage message={error} onDismiss={clearError} />

            {/* Code Input Fields */}
            <View className="flex-row justify-center mb-6">
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref)}
                  className={`w-12 h-14 mx-1 text-center text-2xl font-bold border rounded-lg ${
                    error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                  } ${digit ? 'text-gray-900' : 'text-gray-400'}`}
                  value={digit}
                  onChangeText={(value) => handleCodeChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  editable={!loading}
                  selectTextOnFocus
                />
              ))}
            </View>

            {/* Loading Indicator */}
            {loading && (
              <View className="items-center mb-6">
                <ActivityIndicator size="large" color="#0096c7" />
                <Text className="text-sm text-gray-600 mt-2">Verifying...</Text>
              </View>
            )}

            {/* Resend Code */}
            <View className="items-center mb-6">
              <Text className="text-sm text-gray-600 mb-2">
                Didn't receive the code?
              </Text>
              <TouchableOpacity
                onPress={handleResendCode}
                disabled={loading || resendCooldown > 0}
              >
                <Text
                  className={`text-sm font-semibold ${
                    loading || resendCooldown > 0 ? 'text-gray-400' : 'text-[#0096c7]'
                  }`}
                >
                  {resendCooldown > 0
                    ? `Resend Code (${resendCooldown}s)`
                    : 'Resend Code'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Back to Login */}
            <TouchableOpacity
              onPress={onNavigateToLogin}
              disabled={loading}
              className="mt-4"
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
