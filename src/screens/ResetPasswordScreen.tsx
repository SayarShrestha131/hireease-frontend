/**
 * Reset Password Screen
 * 
 * Allows users to set a new password after verifying their code.
 * Includes password validation, strength indicator, and error handling.
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
import { Lock, Eye, EyeOff } from 'lucide-react-native';
import { ErrorMessage } from '../components/ErrorMessage';
import { PasswordStrengthIndicator } from '../components/PasswordStrengthIndicator';
import { validatePassword } from '../utils/validation';
import apiClient from '../services/apiClient';

interface ResetPasswordScreenProps {
  email: string;
  code: string;
  onNavigateToLogin: () => void;
  onNavigateToForgotPassword: () => void;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ 
  email,
  code,
  onNavigateToLogin,
  onNavigateToForgotPassword
}) => {
  // Form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Handle password input change
   * Clears errors when user starts typing
   */
  const handlePasswordChange = (text: string) => {
    setNewPassword(text);
    if (error) setError(null);
  };

  /**
   * Handle confirm password input change
   * Clears errors when user starts typing
   */
  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (error) setError(null);
  };

  /**
   * Clear error message
   */
  const clearError = () => {
    setError(null);
  };

  /**
   * Validate reset password form
   * @returns true if form is valid, false otherwise
   */
  const validateForm = (): boolean => {
    // Check if new password is provided
    if (!newPassword.trim()) {
      setError('New password is required');
      return false;
    }
    
    // Validate password length
    if (!validatePassword(newPassword)) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    // Check if confirm password is provided
    if (!confirmPassword.trim()) {
      setError('Please confirm your password');
      return false;
    }
    
    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  /**
   * Handle reset password form submission
   * Sends request to backend API and navigates to login on success
   */
  const handleResetPassword = async () => {
    // Clear previous messages
    setError(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Call reset password API endpoint
      await apiClient.post('/auth/reset-password', { 
        email,
        code,
        newPassword 
      });

      // Show success message
      setSuccess(true);
      
      // Clear password fields
      setNewPassword('');
      setConfirmPassword('');
      
      // Auto-navigate to login screen after 2 seconds
      setTimeout(() => {
        onNavigateToLogin();
      }, 2000);
    } catch (err: any) {
      // Handle error response
      if (err.response?.data?.error) {
        const errorMessage = err.response.data.error;
        
        // Check for invalid or expired code error
        if (errorMessage.toLowerCase().includes('invalid') || 
            errorMessage.toLowerCase().includes('expired')) {
          setError('This code is invalid or has expired. Please request a new one.');
        } else {
          setError(errorMessage);
        }
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
              <Text className="text-2xl font-bold text-gray-800 mb-2">
                Reset Password
              </Text>
              <Text className="text-sm text-gray-600 text-center">
                Enter your new password below
              </Text>
            </View>

            {/* Success Message */}
            {success && (
              <View className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <Text className="text-green-600 text-sm">
                  Password has been reset successfully
                </Text>
              </View>
            )}

            {/* Error Message */}
            <ErrorMessage message={error} onDismiss={clearError} />

            {/* New Password Input */}
            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-2">New Password</Text>
              <View
                className={`flex-row items-center border rounded-lg px-4 py-3 bg-gray-50 ${
                  error ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <Lock size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-900"
                  placeholder="Enter new password"
                  placeholderTextColor="#9CA3AF"
                  value={newPassword}
                  onChangeText={handlePasswordChange}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus={true}
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={20} color="#6B7280" />
                  ) : (
                    <Eye size={20} color="#6B7280" />
                  )}
                </TouchableOpacity>
              </View>
              <Text className="text-xs text-gray-500 mt-1">
                Password must be at least 6 characters
              </Text>
            </View>

            {/* Confirm Password Input */}
            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-2">Confirm Password</Text>
              <View
                className={`flex-row items-center border rounded-lg px-4 py-3 bg-gray-50 ${
                  error ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <Lock size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-900"
                  placeholder="Confirm new password"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={handleConfirmPasswordChange}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#6B7280" />
                  ) : (
                    <Eye size={20} color="#6B7280" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Password Strength Indicator */}
            <PasswordStrengthIndicator password={newPassword} />

            {/* Submit Button */}
            <TouchableOpacity
              className={`rounded-lg py-4 items-center mt-6 ${
                loading ? 'bg-gray-400' : 'bg-[#0096c7]'
              }`}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base font-semibold">
                  Reset Password
                </Text>
              )}
            </TouchableOpacity>

            {/* Code Expired Link */}
            <TouchableOpacity 
              onPress={onNavigateToForgotPassword}
              disabled={loading}
              className="mt-6"
            >
              <Text className="text-[#0096c7] text-sm text-center">
                Code expired? Request new code
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
