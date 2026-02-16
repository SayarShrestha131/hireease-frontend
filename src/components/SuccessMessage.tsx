import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { X, CheckCircle } from 'lucide-react-native';

interface SuccessMessageProps {
  message: string | null;
  onDismiss?: () => void;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({ message, onDismiss }) => {
  if (!message) {
    return null;
  }

  return (
    <View className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex-row items-start">
      <CheckCircle size={20} color="#10B981" className="mr-2 mt-0.5" />
      <Text className="text-green-700 text-sm flex-1">{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} className="ml-2">
          <X size={16} color="#10B981" />
        </TouchableOpacity>
      )}
    </View>
  );
};
