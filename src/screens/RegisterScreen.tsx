/**
 * Register Screen
 * 
 * Provides user interface for new users to create accounts with email and password.
 * Includes client-side validation, error handling, and loading states.
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
} from 'react-native';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { ErrorMessage } from '../components/ErrorMessage';
import { validateEmail, validatePassword } from '../utils/validation';

interface RegisterScreenProps {
  onNavigateToLogin: () => void;
  onNavigateToEmailVerification: (email: string) => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ 
  onNavigateToLogin,
  onNavigateToEmailVerification 
}) => {
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Validation state
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  // Auth context
  const { register, loading, error, clearError } = useAuth();

  /**
   * Handle email input change
   * Clears errors when user starts typing
   */
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError(null);
    if (error) clearError();
  };

  /**
   * Handle password input change
   * Clears errors when user starts typing
   */
  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError(null);
    if (error) clearError();
  };

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  /**
   * Validate form inputs
   * @returns true if all inputs are valid, false otherwise
   */
  const validateForm = (): boolean => {
    let isValid = true;

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (!validatePassword(password)) {
      setPasswordError('Password must be at least 6 characters long');
      isValid = false;
    }

    return isValid;
  };

  /**
   * Handle register form submission
   */
  const handleRegister = async () => {
    // Clear previous errors
    setEmailError(null);
    setPasswordError(null);
    clearError();

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Call register method from auth context
    const result = await register(email, password);

    // If registration successful, navigate to email verification
    if (result) {
      onNavigateToEmailVerification(email);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        className="flex-1"
      >
        <View className="flex-1 px-6 py-8 justify-center">
          {/* Header */}
          <View className="mb-8">
            <Text className="text-2xl font-bold text-gray-900 mb-2">Create Account</Text>
            <Text className="text-base text-gray-600">Sign up to get started</Text>
          </View>

          {/* Error Message */}
          <ErrorMessage message={error} onDismiss={clearError} />

          {/* Email Input */}
          <View className="mb-4">
            <Text className="text-sm text-gray-600 mb-2">Email</Text>
            <View
              className={`flex-row items-center border rounded-lg px-4 py-3 bg-gray-50 ${
                emailError ? 'border-red-300' : 'border-gray-300'
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
                editable={!loading}
              />
            </View>
            {emailError && (
              <Text className="text-red-600 text-sm mt-1">{emailError}</Text>
            )}
          </View>

          {/* Password Input */}
          <View className="mb-6">
            <Text className="text-sm text-gray-600 mb-2">Password</Text>
            <View
              className={`flex-row items-center border rounded-lg px-4 py-3 bg-gray-50 ${
                passwordError ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <Lock size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-gray-900"
                placeholder="Enter your password (min 6 characters)"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={togglePasswordVisibility}
                disabled={loading}
                className="ml-2"
              >
                {showPassword ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>
            {passwordError && (
              <Text className="text-red-600 text-sm mt-1">{passwordError}</Text>
            )}
          </View>

          {/* Register Button */}
          <TouchableOpacity
            className={`rounded-lg py-4 items-center ${
              loading ? 'bg-gray-400' : 'bg-[#0096c7]'
            }`}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-base font-semibold">Sign Up</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-600 text-base">Already have an account? </Text>
            <TouchableOpacity onPress={onNavigateToLogin} disabled={loading}>
              <Text className="text-[#0096c7] text-base font-semibold">Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
