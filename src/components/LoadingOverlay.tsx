import React from 'react';
import { View, Text, ActivityIndicator, Modal } from 'react-native';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  visible, 
  message = 'Loading...' 
}) => {
  if (!visible) {
    return null;
  }

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={() => {}}
    >
      <View className="flex-1 bg-black/50 items-center justify-center">
        <View className="bg-white rounded-lg p-6 items-center min-w-[200px]">
          <ActivityIndicator size="large" color="#0096c7" />
          <Text className="text-gray-800 text-base mt-4 text-center">{message}</Text>
        </View>
      </View>
    </Modal>
  );
};
