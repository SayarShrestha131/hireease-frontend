import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';

interface ErrorMessageProps {
  message: string | null;
  onDismiss?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onDismiss }) => {
  if (!message) {
    return null;
  }

  return (
    <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex-row items-start">
      <Text className="text-red-600 text-sm flex-1">{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} className="ml-2">
          <X size={16} color="#DC2626" />
        </TouchableOpacity>
      )}
    </View>
  );
};
