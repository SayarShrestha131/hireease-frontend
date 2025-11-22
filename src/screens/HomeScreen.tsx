/**
 * Home Screen
 * 
 * Landing screen for authenticated users displaying welcome message and logout functionality
 */

import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { LogOut, User as UserIcon } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';

/**
 * HomeScreen Component
 * Displays user information and provides logout functionality
 */
const HomeScreen: React.FC = () => {
  const { user, logout, loading } = useAuth();

  /**
   * Handle logout button press
   */
  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        <View className="px-6 py-8">
          {/* Header Section */}
          <View className="mb-8">
            <Text className="text-3xl font-bold text-gray-800 mb-2">
              Welcome Back!
            </Text>
            <Text className="text-base text-gray-600">
              You're successfully logged in
            </Text>
          </View>

          {/* User Information Card */}
          <View className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
            <View className="flex-row items-center mb-4">
              <View className="bg-[#0096c7] rounded-full p-3 mr-4">
                <UserIcon size={24} color="#FFFFFF" />
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

            {/* Additional User Details */}
            <View className="border-t border-gray-200 pt-4">
              <View className="mb-2">
                <Text className="text-xs text-gray-500 mb-1">User ID</Text>
                <Text className="text-sm text-gray-700 font-mono">
                  {user?._id}
                </Text>
              </View>
              <View className="mb-2">
                <Text className="text-xs text-gray-500 mb-1">Account Created</Text>
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

          {/* Placeholder Content Section */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              Quick Actions
            </Text>
            <View className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <Text className="text-sm text-gray-600 text-center">
                More features coming soon...
              </Text>
              <Text className="text-xs text-gray-500 text-center mt-2">
                This is a placeholder for future authenticated features
              </Text>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            disabled={loading}
            className={`bg-[#0096c7] rounded-lg py-4 flex-row items-center justify-center ${
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

export default HomeScreen;
