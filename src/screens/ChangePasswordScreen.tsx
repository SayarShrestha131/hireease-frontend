/**
 * Change Password Screen
 * 
 * Allows authenticated users to update their password by providing current password
 * and new password. Includes password validation, strength indicator, and error handling.
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
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { ErrorMessage } from '../components/ErrorMessage';
import { PasswordStrengthIndicator } from '../components/PasswordStrengthIndicator';
import { validatePassword } from '../utils/validation';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';

interface ChangePasswordScreenProps {
  onNavigateBack: () => void;
}

export const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({ 
  onNavigateBack
}) => {
  // Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI state
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Auth context
  const { logout } = useAuth();

  /**
   * Handle current password input change
   * Clears errors when user starts typing
   */
  const handleCurrentPasswordChange = (text: string) => {
    setCurrentPassword(text);
    if (error) setError(null);
    if (success) setSuccess(false);
  };

  /**
   * Handle new password input change
   * Clears errors when user starts typing
   */
  const handleNewPasswordChange = (text: string) => {
    setNewPassword(text);
    if (error) setError(null);
    if (success) setSuccess(false);
  };

  /**
   * Handle confirm password input change
   * Clears errors when user starts typing
   */
  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (error) setError(null);
    if (success) setSuccess(false);
  };

  /**
   * Clear error message
   */
  const clearError = () => {
    setError(null);
  };

  /**
   * Validate change password form
   * @returns true if form is valid, false otherwise
   */
  const validateForm = (): boolean => {
    // Check if current password is provided
    if (!currentPassword.trim()) {
      setError('Current password is required');
      return false;
    }

    // Check if new password is provided
    if (!newPassword.trim()) {
      setError('New password is required');
      return false;
    }
    
    // Validate new password length
    if (!validatePassword(newPassword)) {
      setError('New password must be at least 6 characters long');
      return false;
    }

    // Check if confirm password is provided
    if (!confirmPassword.trim()) {
      setError('Please confirm your new password');
      return false;
    }
    
    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return false;
    }
    
    return true;
  };

  /**
   * Handle change password form submission
   * Sends request to backend API and clears form on success
   */
  const handleChangePassword = async () => {
    // Clear previous messages
    setError(null);
    setSuccess(false);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Call change password API endpoint
      await apiClient.post('/auth/change-password', { 
        currentPassword,
        newPassword
      });

      // Show success message
      setSuccess(true);
      
      // Clear all input fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      // Handle error response
      if (err.response?.status === 401) {
        const errorMessage = err.response?.data?.error;
        
        // Check if it's incorrect current password vs invalid token
        if (errorMessage && errorMessage.toLowerCase().includes('current password')) {
          setError('Current password is incorrect');
        } else {
          // Invalid token - trigger logout
          await logout();
        }
      } else if (err.response?.data?.error) {
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
          <View className="flex-1 px-6 py-8">
            {/* Header with Back Button */}
            <View className="mb-8">
              <TouchableOpacity 
                onPress={onNavigateBack}
                disabled={loading}
                className="mb-4"
              >
                <View className="flex-row items-center">
                  <ArrowLeft size={24} color="#0096c7" />
                  <Text className="text-[#0096c7] text-base ml-2">Back</Text>
                </View>
              </TouchableOpacity>
              
              <Text className="text-2xl font-bold text-gray-800 mb-2">
                Change Password
              </Text>
              <Text className="text-sm text-gray-600">
                Update your account password
              </Text>
            </View>

            {/* Success Message */}
            {success && (
              <View className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <Text className="text-green-600 text-sm">
                  Password changed successfully
                </Text>
              </View>
            )}

            {/* Error Message */}
            <ErrorMessage message={error} onDismiss={clearError} />

            {/* Current Password Input */}
            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-2">Current Password</Text>
              <View
                className={`flex-row items-center border rounded-lg px-4 py-3 bg-gray-50 ${
                  error ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <Lock size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-900"
                  placeholder="Enter current password"
                  placeholderTextColor="#9CA3AF"
                  value={currentPassword}
                  onChangeText={handleCurrentPasswordChange}
                  secureTextEntry={!showCurrentPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus={true}
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                  {showCurrentPassword ? (
                    <EyeOff size={20} color="#6B7280" />
                  ) : (
                    <Eye size={20} color="#6B7280" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

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
                  onChangeText={handleNewPasswordChange}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                  {showNewPassword ? (
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

            {/* Confirm New Password Input */}
            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-2">Confirm New Password</Text>
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
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white text-base font-semibold">
                  Update Password
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
