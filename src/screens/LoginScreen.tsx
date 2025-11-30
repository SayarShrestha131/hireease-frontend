/**
 * Login Screen
 * 
 * Provides user interface for existing users to authenticate with email and password.
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
import { validateEmail } from '../utils/validation';

interface LoginScreenProps {
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onNavigateToRegister,
  onNavigateToForgotPassword 
}) => {
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Validation state
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  // Auth context
  const { login, loading, error, clearError } = useAuth();

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
    }

    return isValid;
  };

  /**
   * Handle login form submission
   */
  const handleLogin = async () => {
    // Clear previous errors
    setEmailError(null);
    setPasswordError(null);
    clearError();

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Call login method from auth context
    const result = await login(email, password);

    // Login method handles navigation through context state change
    // No need to manually navigate here
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
            <Text className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</Text>
            <Text className="text-base text-gray-600">Sign in to continue</Text>
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
                placeholder="Enter your password"
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

          {/* Login Button */}
          <TouchableOpacity
            className={`rounded-lg py-4 items-center ${
              loading ? 'bg-gray-400' : 'bg-[#0096c7]'
            }`}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-base font-semibold">Login</Text>
            )}
          </TouchableOpacity>

          {/* Forgot Password Link */}
          <TouchableOpacity 
            onPress={onNavigateToForgotPassword}
            disabled={loading}
            className="mt-4"
          >
            <Text className="text-[#0096c7] text-sm text-center">
              Forgot Password?
            </Text>
          </TouchableOpacity>

          {/* Register Link */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-600 text-base">Don't have an account? </Text>
            <TouchableOpacity onPress={onNavigateToRegister} disabled={loading}>
              <Text className="text-[#0096c7] text-base font-semibold">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
