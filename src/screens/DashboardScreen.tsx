/**
 * Dashboard Screen
 * 
 * Main dashboard showing overview and quick stats
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Car,
  Calendar,
  TrendingUp,
  Clock,
  MapPin,
  Star,
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';

/**
 * DashboardScreen Component
 */
const DashboardScreen: React.FC = () => {
  const { user } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-[#0096c7] px-6 py-6 pb-8">
          <View className="mb-4">
            <Text className="text-white text-sm opacity-90">Welcome back,</Text>
            <Text className="text-white text-2xl font-bold mt-1">
              {user?.username || user?.email?.split('@')[0] || 'User'}
            </Text>
          </View>
        </View>

        <View className="px-6 -mt-4">
          {/* Stats Cards */}
          <View className="flex-row mb-6">
            <View className="flex-1 bg-white rounded-lg p-4 mr-2 shadow-sm">
              <View className="bg-blue-100 rounded-full p-2 w-10 h-10 items-center justify-center mb-2">
                <Car size={20} color="#0096c7" />
              </View>
              <Text className="text-2xl font-bold text-gray-800">24</Text>
              <Text className="text-xs text-gray-600 mt-1">Available Cars</Text>
            </View>

            <View className="flex-1 bg-white rounded-lg p-4 ml-2 shadow-sm">
              <View className="bg-green-100 rounded-full p-2 w-10 h-10 items-center justify-center mb-2">
                <Calendar size={20} color="#10B981" />
              </View>
              <Text className="text-2xl font-bold text-gray-800">0</Text>
              <Text className="text-xs text-gray-600 mt-1">My Bookings</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-800 mb-3">Quick Actions</Text>

            <TouchableOpacity className="bg-white rounded-lg p-4 flex-row items-center mb-3 shadow-sm">
              <View className="bg-[#0096c7] rounded-full p-3 mr-4">
                <Car size={24} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-800">Browse Vehicles</Text>
                <Text className="text-xs text-gray-500 mt-1">Find your perfect ride</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity className="bg-white rounded-lg p-4 flex-row items-center mb-3 shadow-sm">
              <View className="bg-green-500 rounded-full p-3 mr-4">
                <Calendar size={24} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-800">My Bookings</Text>
                <Text className="text-xs text-gray-500 mt-1">View reservations</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity className="bg-white rounded-lg p-4 flex-row items-center shadow-sm">
              <View className="bg-purple-500 rounded-full p-3 mr-4">
                <Clock size={24} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-800">Rental History</Text>
                <Text className="text-xs text-gray-500 mt-1">View past rentals</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Recent Activity */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-800 mb-3">Recent Activity</Text>
            <View className="bg-white rounded-lg p-6 shadow-sm">
              <View className="items-center py-4">
                <Clock size={48} color="#9CA3AF" />
                <Text className="text-gray-500 mt-4 text-center">No recent activity</Text>
                <Text className="text-gray-400 text-sm mt-2 text-center">
                  Your bookings and activities will appear here
                </Text>
              </View>
            </View>
          </View>

          {/* Promotional Banner */}
          <View className="bg-[#0096c7] rounded-lg p-6 mb-6">
            <View className="flex-row items-center mb-2">
              <TrendingUp size={24} color="#FFFFFF" />
              <Text className="text-white text-lg font-bold ml-2">Special Offer!</Text>
            </View>
            <Text className="text-white text-sm mb-3">
              Get 20% off on your first rental. Use code: FIRST20
            </Text>
            <TouchableOpacity className="bg-white px-4 py-2 rounded-lg self-start">
              <Text className="text-[#0096c7] font-semibold">Learn More</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DashboardScreen;
