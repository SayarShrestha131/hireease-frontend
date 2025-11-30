/**
 * Home Screen - Vehicle Rental Dashboard
 * 
 * Main dashboard for vehicle rental app showing available vehicles and rental stats
 */

import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { Car, Calendar, DollarSign, Settings, TrendingUp, Clock } from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';

interface HomeScreenProps {
  onNavigateToSettings: () => void;
}

/**
 * HomeScreen Component
 * Vehicle rental dashboard with stats and quick actions
 */
const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToSettings }) => {
  const { user } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-[#0096c7] px-6 py-6 pb-8">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-1">
              <Text className="text-white text-sm opacity-90">Welcome back,</Text>
              <Text className="text-white text-xl font-bold mt-1">
                {user?.email?.split('@')[0] || 'User'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onNavigateToSettings}
              className="bg-white/20 rounded-full p-3"
              activeOpacity={0.7}
            >
              <Settings size={24} color="#FFFFFF" />
            </TouchableOpacity>
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
              <Text className="text-2xl font-bold text-gray-800">3</Text>
              <Text className="text-xs text-gray-600 mt-1">Active Bookings</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-800 mb-3">
              Quick Actions
            </Text>
            
            <TouchableOpacity
              className="bg-white rounded-lg p-4 flex-row items-center mb-3 shadow-sm"
              activeOpacity={0.7}
            >
              <View className="bg-[#0096c7] rounded-full p-3 mr-4">
                <Car size={24} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-800">
                  Browse Vehicles
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  Find your perfect ride
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-white rounded-lg p-4 flex-row items-center mb-3 shadow-sm"
              activeOpacity={0.7}
            >
              <View className="bg-green-500 rounded-full p-3 mr-4">
                <Calendar size={24} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-800">
                  My Bookings
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  View and manage reservations
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-white rounded-lg p-4 flex-row items-center shadow-sm"
              activeOpacity={0.7}
            >
              <View className="bg-purple-500 rounded-full p-3 mr-4">
                <Clock size={24} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-800">
                  Rental History
                </Text>
                <Text className="text-xs text-gray-500 mt-1">
                  View past rentals
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Featured Vehicles */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-bold text-gray-800">
                Featured Vehicles
              </Text>
              <TouchableOpacity>
                <Text className="text-[#0096c7] text-sm font-semibold">
                  See All
                </Text>
              </TouchableOpacity>
            </View>

            {/* Vehicle Card 1 */}
            <View className="bg-white rounded-lg p-4 mb-3 shadow-sm">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-800">
                    Tesla Model 3
                  </Text>
                  <Text className="text-sm text-gray-600 mt-1">
                    Electric • Sedan • Auto
                  </Text>
                </View>
                <View className="bg-green-100 px-3 py-1 rounded-full">
                  <Text className="text-green-700 text-xs font-semibold">
                    Available
                  </Text>
                </View>
              </View>
              
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <DollarSign size={18} color="#0096c7" />
                  <Text className="text-xl font-bold text-[#0096c7] ml-1">
                    89
                  </Text>
                  <Text className="text-sm text-gray-600 ml-1">/day</Text>
                </View>
                <TouchableOpacity className="bg-[#0096c7] px-6 py-2 rounded-lg">
                  <Text className="text-white font-semibold">Book Now</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Vehicle Card 2 */}
            <View className="bg-white rounded-lg p-4 mb-3 shadow-sm">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-800">
                    BMW X5
                  </Text>
                  <Text className="text-sm text-gray-600 mt-1">
                    Hybrid • SUV • Auto
                  </Text>
                </View>
                <View className="bg-green-100 px-3 py-1 rounded-full">
                  <Text className="text-green-700 text-xs font-semibold">
                    Available
                  </Text>
                </View>
              </View>
              
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <DollarSign size={18} color="#0096c7" />
                  <Text className="text-xl font-bold text-[#0096c7] ml-1">
                    129
                  </Text>
                  <Text className="text-sm text-gray-600 ml-1">/day</Text>
                </View>
                <TouchableOpacity className="bg-[#0096c7] px-6 py-2 rounded-lg">
                  <Text className="text-white font-semibold">Book Now</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Vehicle Card 3 */}
            <View className="bg-white rounded-lg p-4 shadow-sm">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-800">
                    Toyota Camry
                  </Text>
                  <Text className="text-sm text-gray-600 mt-1">
                    Petrol • Sedan • Auto
                  </Text>
                </View>
                <View className="bg-green-100 px-3 py-1 rounded-full">
                  <Text className="text-green-700 text-xs font-semibold">
                    Available
                  </Text>
                </View>
              </View>
              
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <DollarSign size={18} color="#0096c7" />
                  <Text className="text-xl font-bold text-[#0096c7] ml-1">
                    59
                  </Text>
                  <Text className="text-sm text-gray-600 ml-1">/day</Text>
                </View>
                <TouchableOpacity className="bg-[#0096c7] px-6 py-2 rounded-lg">
                  <Text className="text-white font-semibold">Book Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Promotional Banner */}
          <View className="bg-gradient-to-r bg-[#0096c7] rounded-lg p-6 mb-6">
            <View className="flex-row items-center mb-2">
              <TrendingUp size={24} color="#FFFFFF" />
              <Text className="text-white text-lg font-bold ml-2">
                Special Offer!
              </Text>
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

export default HomeScreen;
