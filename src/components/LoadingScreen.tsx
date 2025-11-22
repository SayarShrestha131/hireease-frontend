import React from 'react';
import { View, ActivityIndicator } from 'react-native';

export const LoadingScreen: React.FC = () => {
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#0096c7" />
    </View>
  );
};
