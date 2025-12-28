/**
 * Network Error Banner
 * 
 * Shows a helpful banner when network errors occur
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AlertCircle, Settings } from 'lucide-react-native';

interface NetworkErrorBannerProps {
  onConfigureApi?: () => void;
}

export const NetworkErrorBanner: React.FC<NetworkErrorBannerProps> = ({ onConfigureApi }) => {
  return (
    <View className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
      <View className="flex-row items-start">
        <AlertCircle size={20} color="#DC2626" />
        <View className="flex-1 ml-3">
          <Text className="text-red-800 font-semibold mb-1">Cannot Connect to Backend</Text>
          <Text className="text-red-700 text-sm mb-3">
            Make sure your backend server is running and accessible.
          </Text>
          {onConfigureApi && (
            <TouchableOpacity
              onPress={onConfigureApi}
              className="bg-red-600 rounded-lg py-2 px-4 flex-row items-center self-start"
            >
              <Settings size={16} color="#FFFFFF" />
              <Text className="text-white text-sm font-semibold ml-2">
                Configure API
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};
