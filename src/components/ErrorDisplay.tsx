/**
 * ErrorDisplay Component
 * 
 * Reusable error display component with retry functionality
 * Provides consistent error UI across the booking system
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AlertCircle, RefreshCw } from 'lucide-react-native';

interface ErrorDisplayProps {
  error: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  showRetry?: boolean;
  retryText?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  showRetry = true,
  retryText = 'Try Again',
}) => {
  if (!error) {
    return null;
  }

  return (
    <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <View className="flex-row items-start">
        <AlertCircle size={20} color="#DC2626" className="mr-2 mt-0.5" />
        <View className="flex-1">
          <Text className="text-red-800 font-semibold mb-1">Error</Text>
          <Text className="text-red-600 text-sm">{error}</Text>
        </View>
      </View>

      {(showRetry && onRetry) || onDismiss ? (
        <View className="flex-row mt-3 space-x-2">
          {showRetry && onRetry && (
            <TouchableOpacity
              onPress={onRetry}
              className="flex-row items-center bg-red-600 px-4 py-2 rounded-lg mr-2"
              activeOpacity={0.7}
            >
              <RefreshCw size={16} color="#FFFFFF" />
              <Text className="text-white font-semibold ml-2">{retryText}</Text>
            </TouchableOpacity>
          )}
          
          {onDismiss && (
            <TouchableOpacity
              onPress={onDismiss}
              className="px-4 py-2 rounded-lg border border-red-300"
              activeOpacity={0.7}
            >
              <Text className="text-red-600 font-semibold">Dismiss</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}
    </View>
  );
};
