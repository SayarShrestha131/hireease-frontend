/**
 * Settings Screen
 * 
 * User settings and account management screen with enhanced options
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView,
  Switch,
  Alert,
  Image
} from 'react-native';
import { 
  User as UserIcon, 
  Lock, 
  LogOut, 
  ChevronRight,
  Bell,
  Shield,
  HelpCircle,
  FileText,
  Server
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';
import { getCurrentApiUrl } from '../config/api';

interface SettingsScreenProps {
  onNavigateToChangePassword: () => void;
  onNavigateToProfile: () => void;
  onNavigateToApiConfig: () => void;
  onNavigateToKYCStatus: () => void;
  onNavigateBack: () => void;
}

/**
 * SettingsScreen Component
 * Displays user information and comprehensive account settings
 */
export const SettingsScreen: React.FC<SettingsScreenProps> = ({ 
  onNavigateToChangePassword,
  onNavigateToProfile,
  onNavigateToApiConfig,
  onNavigateToKYCStatus,
  onNavigateBack 
}) => {
  const { user, logout, loading } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  /**
   * Handle logout button press
   */
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => await logout()
        }
      ]
    );
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
          <TouchableOpacity
            onPress={onNavigateToProfile}
            className="bg-white rounded-lg p-6 mb-6 shadow-sm"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              {user?.profilePicture ? (
                <Image
                  source={{ 
                    uri: `${getCurrentApiUrl()}/profile/picture/${user.profilePicture}?t=${Date.now()}`,
                    cache: 'reload'
                  }}
                  className="w-16 h-16 rounded-full mr-4"
                  style={{ backgroundColor: '#E5E7EB' }}
                  onError={(error) => console.error('[SettingsScreen] Image load error:', error.nativeEvent.error)}
                />
              ) : (
                <View className="bg-[#0096c7] rounded-full p-4 mr-4">
                  <UserIcon size={32} color="#FFFFFF" />
                </View>
              )}
              <View className="flex-1">
                <Text className="text-sm text-gray-600 mb-1">
                  Logged in as
                </Text>
                <Text className="text-lg font-semibold text-gray-800">
                  {user?.email}
                </Text>
                <View className="flex-row items-center mt-2">
                  <Shield size={12} color={user?.isEmailVerified ? '#10B981' : '#F59E0B'} />
                  <Text className={`text-xs ml-1 ${user?.isEmailVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                    {user?.isEmailVerified ? 'Verified' : 'Unverified'}
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </View>
          </TouchableOpacity>

          {/* Account Settings Section */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-600 mb-3 px-2">
              ACCOUNT
            </Text>
            
            {/* View Profile */}
            <TouchableOpacity
              onPress={onNavigateToProfile}
              className="bg-white rounded-lg p-4 flex-row items-center justify-between mb-2 shadow-sm"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center flex-1">
                <View className="bg-blue-100 rounded-full p-2 mr-3">
                  <UserIcon size={20} color="#0096c7" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-800">
                    My Profile
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    View and edit your profile
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Change Password */}
            <TouchableOpacity
              onPress={onNavigateToChangePassword}
              disabled={loading}
              className="bg-white rounded-lg p-4 flex-row items-center justify-between mb-2 shadow-sm"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center flex-1">
                <View className="bg-purple-100 rounded-full p-2 mr-3">
                  <Lock size={20} color="#9333EA" />
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

            {/* KYC Verification */}
            <TouchableOpacity
              onPress={onNavigateToKYCStatus}
              className="bg-white rounded-lg p-4 flex-row items-center justify-between shadow-sm"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center flex-1">
                <View className="bg-green-100 rounded-full p-2 mr-3">
                  <Shield size={20} color="#10B981" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-800">
                    KYC Verification
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    Verify your identity
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Preferences Section */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-600 mb-3 px-2">
              PREFERENCES
            </Text>
            
            {/* Notifications */}
            <View className="bg-white rounded-lg p-4 flex-row items-center justify-between shadow-sm">
              <View className="flex-row items-center flex-1">
                <View className="bg-green-100 rounded-full p-2 mr-3">
                  <Bell size={20} color="#10B981" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-800">
                    Notifications
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    Receive booking updates
                  </Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#D1D5DB', true: '#0096c7' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Support Section */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-600 mb-3 px-2">
              SUPPORT
            </Text>
            
            {/* API Configuration */}
            <TouchableOpacity
              onPress={onNavigateToApiConfig}
              className="bg-white rounded-lg p-4 flex-row items-center justify-between mb-2 shadow-sm"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center flex-1">
                <View className="bg-purple-100 rounded-full p-2 mr-3">
                  <Server size={20} color="#9333EA" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-800">
                    API Configuration
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    Configure backend connection
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Help Center */}
            <TouchableOpacity
              className="bg-white rounded-lg p-4 flex-row items-center justify-between mb-2 shadow-sm"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center flex-1">
                <View className="bg-blue-100 rounded-full p-2 mr-3">
                  <HelpCircle size={20} color="#3B82F6" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-800">
                    Help Center
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    Get help and support
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Terms & Privacy */}
            <TouchableOpacity
              className="bg-white rounded-lg p-4 flex-row items-center justify-between shadow-sm"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center flex-1">
                <View className="bg-gray-100 rounded-full p-2 mr-3">
                  <FileText size={20} color="#6B7280" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-800">
                    Terms & Privacy
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    Legal information
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

          {/* App Version */}
          <Text className="text-center text-xs text-gray-400 mt-6">
            Vehicle Rental App v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
