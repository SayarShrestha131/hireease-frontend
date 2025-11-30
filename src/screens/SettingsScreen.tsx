/**
 * Settings Screen
 * 
 * User settings and account management screen
 */

import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { User as UserIcon, Lock, LogOut, ChevronRight } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';

interface SettingsScreenProps {
  onNavigateToChangePassword: () => void;
  onNavigateBack: () => void;
}

/**
 * SettingsScreen Component
 * Displays user information and account settings
 */
export const SettingsScreen: React.FC<SettingsScreenProps> = ({ 
  onNavigateToChangePassword,
  onNavigateBack 
}) => {
  const { user, logout, loading } = useAuth();

  /**
   * Handle logout button press
   */
  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-white px-6 pt-6 pb-4 border-b border-gray-200">
          <TouchableOpacity onPress={onNavigateBack} className="mb-3 mt-4">
            <Text className="text-[#0096c7] text-base">← Back</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-800">Settings</Text>
        </View>

        <View className="px-6 py-6">
          {/* User Profile Card */}
          <View className="bg-white rounded-lg p-6 mb-6 shadow-sm">
            <View className="flex-row items-center mb-4">
              <View className="bg-[#0096c7] rounded-full p-4 mr-4">
                <UserIcon size={32} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-sm text-gray-600 mb-1">
                  Logged in as
                </Text>
                <Text className="text-lg font-semibold text-gray-800">
                  {user?.email}
                </Text>
              </View>
            </View>

            {/* Account Details */}
            <View className="border-t border-gray-200 pt-4">
              <View className="mb-3">
                <Text className="text-xs text-gray-500 mb-1">User ID</Text>
                <Text className="text-sm text-gray-700 font-mono">
                  {user?._id}
                </Text>
              </View>
              <View>
                <Text className="text-xs text-gray-500 mb-1">Member Since</Text>
                <Text className="text-sm text-gray-700">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          {/* Account Settings Section */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-600 mb-3 px-2">
              ACCOUNT SETTINGS
            </Text>
            
            {/* Change Password */}
            <TouchableOpacity
              onPress={onNavigateToChangePassword}
              disabled={loading}
              className="bg-white rounded-lg p-4 flex-row items-center justify-between mb-2 shadow-sm"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center flex-1">
                <View className="bg-gray-100 rounded-full p-2 mr-3">
                  <Lock size={20} color="#0096c7" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-800">
                    Change Password
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    Update your account password
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            disabled={loading}
            className={`bg-red-500 rounded-lg py-4 flex-row items-center justify-center shadow-sm ${
              loading ? 'opacity-50' : ''
            }`}
            activeOpacity={0.8}
          >
            <LogOut size={20} color="#FFFFFF" />
            <Text className="text-white text-base font-semibold ml-2">
              {loading ? 'Logging out...' : 'Logout'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
