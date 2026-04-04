/**
 * Dashboard Screen
 * 
 * Main dashboard showing overview and quick stats
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Car,
  Calendar,
  TrendingUp,
  Clock,
  Shield,
  Bell,
  X,
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

interface DashboardScreenProps {
  onNavigateToKYCReview?: () => void;
  onNavigateToAdminRegisterPerson?: () => void;
  onNavigateToVehicles?: () => void;
  onNavigateToBookings?: () => void;
}

/**
 * DashboardScreen Component
 */
const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateToKYCReview,
  onNavigateToAdminRegisterPerson,
  onNavigateToVehicles,
  onNavigateToBookings,
}) => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  const formatNotificationTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="bg-[#0096c7] px-6 py-6 pb-8">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-1">
              <Text className="text-white text-sm opacity-90">Welcome back,</Text>
              <Text className="text-white text-2xl font-bold mt-1">
                {user?.username || user?.email?.split('@')[0] || 'User'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowNotifications(true)}
              className="bg-white/20 rounded-full p-3 relative"
              activeOpacity={0.7}
            >
              <Bell size={24} color="#FFFFFF" />
              {unreadCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[20px] h-5 items-center justify-center">
                  <Text className="text-white text-xs font-bold">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
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
              <Text className="text-2xl font-bold text-gray-800">0</Text>
              <Text className="text-xs text-gray-600 mt-1">My Bookings</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-800 mb-3">Quick Actions</Text>

            <TouchableOpacity 
              onPress={onNavigateToVehicles}
              className="bg-white rounded-lg p-4 flex-row items-center mb-3 shadow-sm"
              activeOpacity={0.7}
            >
              <View className="bg-[#0096c7] rounded-full p-3 mr-4">
                <Car size={24} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-800">Browse Vehicles</Text>
                <Text className="text-xs text-gray-500 mt-1">Find your perfect ride</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={onNavigateToBookings}
              className="bg-white rounded-lg p-4 flex-row items-center mb-3 shadow-sm"
              activeOpacity={0.7}
            >
              <View className="bg-green-500 rounded-full p-3 mr-4">
                <Calendar size={24} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-800">My Bookings</Text>
                <Text className="text-xs text-gray-500 mt-1">View reservations</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity className="bg-white rounded-lg p-4 flex-row items-center mb-3 shadow-sm">
              <View className="bg-purple-500 rounded-full p-3 mr-4">
                <Clock size={24} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-800">Rental History</Text>
                <Text className="text-xs text-gray-500 mt-1">View past rentals</Text>
              </View>
            </TouchableOpacity>

            {/* Admin KYC Review Link */}
            {user?.role === 'admin' && onNavigateToKYCReview && (
              <TouchableOpacity 
                onPress={onNavigateToKYCReview}
                className="bg-white rounded-lg p-4 flex-row items-center shadow-sm border-2 border-[#0096c7]"
              >
                <View className="bg-[#0096c7] rounded-full p-3 mr-4">
                  <Shield size={24} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-800">KYC Review Panel</Text>
                  <Text className="text-xs text-gray-500 mt-1">Review user verifications</Text>
                </View>
              </TouchableOpacity>
            )}

            {user?.role === 'admin' && onNavigateToAdminRegisterPerson && (
              <TouchableOpacity
                onPress={onNavigateToAdminRegisterPerson}
                className="bg-white rounded-lg p-4 flex-row items-center mt-3 shadow-sm border-2 border-green-500"
              >
                <View className="bg-green-500 rounded-full p-3 mr-4">
                  <Shield size={24} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-800">Register Face Profile</Text>
                  <Text className="text-xs text-gray-500 mt-1">Add user image for face database</Text>
                </View>
              </TouchableOpacity>
            )}
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

      {/* Notifications Modal */}
      <Modal visible={showNotifications} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl max-h-[80%] flex-1">
            {/* Modal Header */}
            <View className="flex-row justify-between items-center p-6 border-b border-gray-200">
              <Text className="text-xl font-bold text-gray-800">Notifications</Text>
              <View className="flex-row items-center">
                {unreadCount > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      markAllAsRead();
                    }}
                    className="mr-4"
                  >
                    <Text className="text-[#0096c7] font-semibold">Mark All Read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowNotifications(false)}>
                  <X size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Notifications List */}
            <ScrollView className="flex-1 px-6">
              {notifications.length === 0 ? (
                <View className="flex-1 items-center justify-center py-12">
                  <Bell size={64} color="#D1D5DB" />
                  <Text className="text-xl font-bold text-gray-800 mt-6 text-center">
                    No Notifications
                  </Text>
                  <Text className="text-base text-gray-600 mt-2 text-center">
                    You're all caught up! New notifications will appear here.
                  </Text>
                </View>
              ) : (
                <View className="py-4">
                  {notifications.map((notification) => (
                    <TouchableOpacity
                      key={notification.id}
                      onPress={() => {
                        if (!notification.read) {
                          markAsRead(notification.id);
                        }
                        if (notification.type === 'vehicle_added') {
                          setShowNotifications(false);
                          // Navigate to vehicles tab
                          if (onNavigateToVehicles) {
                            onNavigateToVehicles();
                          }
                        }
                      }}
                      className={`p-4 rounded-lg mb-3 border ${
                        notification.read 
                          ? 'bg-gray-50 border-gray-200' 
                          : 'bg-blue-50 border-blue-200'
                      }`}
                      activeOpacity={0.7}
                    >
                      <View className="flex-row items-start">
                        <View className="flex-1">
                          <View className="flex-row items-center mb-2">
                            <Text className={`text-base font-bold ${
                              notification.read ? 'text-gray-800' : 'text-gray-900'
                            }`}>
                              {notification.title}
                            </Text>
                            {!notification.read && (
                              <View className="w-2 h-2 bg-blue-500 rounded-full ml-2" />
                            )}
                          </View>
                          <Text className={`text-sm mb-2 ${
                            notification.read ? 'text-gray-600' : 'text-gray-700'
                          }`}>
                            {notification.message}
                          </Text>
                          <Text className="text-xs text-gray-500">
                            {formatNotificationTime(notification.timestamp)}
                          </Text>
                        </View>
                        {notification.type === 'vehicle_added' && (
                          <View className="ml-3">
                            <View className="bg-green-100 rounded-full p-2">
                              <Car size={20} color="#059669" />
                            </View>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default DashboardScreen;
