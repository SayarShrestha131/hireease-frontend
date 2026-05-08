/**
 * Dashboard Screen
 * 
 * Main dashboard showing overview and quick stats
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
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
  CheckCircle,
  Star,
  BellRing,
  Trash2,
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import bookingService from '../services/bookingService';
import vehicleService from '../services/vehicleService';
import { Booking } from '../types/booking';
import { getCurrentApiUrl } from '../config/api';

interface DashboardScreenProps {
  onNavigateToKYCReview?: () => void;
  onNavigateToAdminRegisterPerson?: () => void;
  onNavigateToVehicles?: () => void;
  onNavigateToBookings?: () => void;
  onNavigateToRentalHistory?: () => void;
}

/**
 * DashboardScreen Component
 */
const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateToKYCReview,
  onNavigateToAdminRegisterPerson,
  onNavigateToVehicles,
  onNavigateToBookings,
  onNavigateToRentalHistory,
}) => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  
  // State for dashboard stats
  const [totalBookings, setTotalBookings] = useState(0);
  const [availableVehicles, setAvailableVehicles] = useState(0);
  const [recentRentals, setRecentRentals] = useState<Booking[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation values for notification modal
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const overlayOpacity = React.useRef(new Animated.Value(0)).current;
  const bellShake = React.useRef(new Animated.Value(0)).current;
  const { height: screenHeight } = Dimensions.get('window');

  // Animate bell icon when there are unread notifications
  React.useEffect(() => {
    if (unreadCount > 0) {
      const shakeAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(bellShake, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(bellShake, {
            toValue: -1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(bellShake, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.delay(3000), // Wait 3 seconds before next shake
        ])
      );
      shakeAnimation.start();
      
      return () => shakeAnimation.stop();
    }
  }, [unreadCount]);

  /**
   * Fetch dashboard statistics on mount
   */
  useEffect(() => {
    fetchDashboardStats();
  }, []);

  /**
   * Fetch dashboard statistics including bookings count and recent rentals
   */
  const fetchDashboardStats = async () => {
    try {
      setIsLoadingStats(true);
      setStatsError(null);
      
      // Fetch data in parallel for better performance
      const [allBookingsResponse, completedRentalsResponse, availableVehiclesCount] = await Promise.all([
        // Fetch all user bookings to get total count
        bookingService.getUserBookings({ limit: 100 }),
        // Fetch recent completed rentals (last 3)
        bookingService.getUserBookings({ 
          status: 'completed',
          limit: 3 
        }),
        // Fetch available vehicles count
        vehicleService.getAvailableVehiclesCount()
      ]);
      
      setTotalBookings(allBookingsResponse.bookings.length);
      setRecentRentals(completedRentalsResponse.bookings);
      setAvailableVehicles(availableVehiclesCount);
      
      console.log('[DashboardScreen] ✅ Dashboard stats loaded successfully:', {
        totalBookings: allBookingsResponse.bookings.length,
        recentRentals: completedRentalsResponse.bookings.length,
        availableVehicles: availableVehiclesCount
      });
      
    } catch (error) {
      console.error('[DashboardScreen] ❌ Error fetching stats:', error);
      setStatsError('Failed to load dashboard data');
      
      // Set some fallback values to indicate there was an issue
      setTotalBookings(0);
      setRecentRentals([]);
      setAvailableVehicles(0);
    } finally {
      setIsLoadingStats(false);
    }
  };

  /**
   * Refresh dashboard data
   */
  const refreshDashboard = () => {
    console.log('[DashboardScreen] Refreshing dashboard data...');
    fetchDashboardStats();
  };

  /**
   * Handle pull-to-refresh
   */
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchDashboardStats().finally(() => {
      setRefreshing(false);
    });
  }, []);

  /**
   * Open notifications modal with animation
   */
  const openNotifications = () => {
    setShowNotifications(true);
    
    // Animate overlay and modal
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 1,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * Close notifications modal with animation
   */
  const closeNotifications = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowNotifications(false);
    });
  };

  /**
   * Handle notification press with haptic feedback
   */
  const handleNotificationPress = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (notification.type === 'vehicle_added') {
      closeNotifications();
      setTimeout(() => {
        if (onNavigateToVehicles) {
          onNavigateToVehicles();
        }
      }, 300);
    }
  };

  /**
   * Mark all notifications as read with animation
   */
  const handleMarkAllAsRead = () => {
    markAllAsRead();
    // Add a subtle animation feedback
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * Get vehicle image URL
   */
  const getVehicleImageUrl = (booking: Booking) => {
    if (booking.vehicle?.images && booking.vehicle.images.length > 0) {
      const imageValue = booking.vehicle.images[0];
      
      if (imageValue.startsWith('http://') || imageValue.startsWith('https://')) {
        return imageValue;
      }
      
      const baseUrl = getCurrentApiUrl();
      const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
      return `${cleanBaseUrl}/vehicles/image/${imageValue}?t=${Date.now()}`;
    }
    return null;
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

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
      <ScrollView 
      className="flex-1"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#0096c7']}
          tintColor="#0096c7"
        />
      }
      contentContainerStyle={{ paddingBottom: 20 }}
      showsVerticalScrollIndicator={false}
    >
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
              onPress={openNotifications}
              className="bg-white/20 rounded-full p-3 relative"
              activeOpacity={0.7}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }}
            >
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: bellShake.interpolate({
                        inputRange: [-1, 1],
                        outputRange: ['-10deg', '10deg'],
                      }),
                    },
                  ],
                }}
              >
                <Bell size={24} color="#FFFFFF" />
              </Animated.View>
              {unreadCount > 0 && (
                <Animated.View 
                  className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[20px] h-5 items-center justify-center"
                  style={{
                    shadowColor: '#EF4444',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.4,
                    shadowRadius: 4,
                    elevation: 6,
                  }}
                >
                  <Text className="text-white text-xs font-bold">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </Animated.View>
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
              <Text className="text-2xl font-bold text-gray-800">
                {isLoadingStats ? '...' : availableVehicles}
              </Text>
              <Text className="text-xs text-gray-600 mt-1">Available Cars</Text>
              {statsError && (
                <TouchableOpacity onPress={refreshDashboard} className="mt-1">
                  <Text className="text-xs text-red-500">Tap to retry</Text>
                </TouchableOpacity>
              )}
            </View>

            <View className="flex-1 bg-white rounded-lg p-4 ml-2 shadow-sm">
              <View className="bg-green-100 rounded-full p-2 w-10 h-10 items-center justify-center mb-2">
                <Calendar size={20} color="#10B981" />
              </View>
              <Text className="text-2xl font-bold text-gray-800">
                {isLoadingStats ? '...' : totalBookings}
              </Text>
              <Text className="text-xs text-gray-600 mt-1">My Bookings</Text>
              {statsError && (
                <TouchableOpacity onPress={refreshDashboard} className="mt-1">
                  <Text className="text-xs text-red-500">Tap to retry</Text>
                </TouchableOpacity>
              )}
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

            <TouchableOpacity 
              onPress={onNavigateToRentalHistory}
              className="bg-white rounded-lg p-4 flex-row items-center mb-3 shadow-sm"
              activeOpacity={0.7}
            >
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

          {/* Recent Rental History */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-bold text-gray-800">Recent Rentals</Text>
              {recentRentals.length > 0 && onNavigateToRentalHistory && (
                <TouchableOpacity onPress={onNavigateToRentalHistory}>
                  <Text className="text-[#0096c7] font-semibold">View All</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {isLoadingStats ? (
              <View className="bg-white rounded-lg p-6 shadow-sm">
                <View className="items-center py-4">
                  <ActivityIndicator size="large" color="#0096c7" />
                  <Text className="text-gray-500 mt-4 text-center">Loading recent rentals...</Text>
                </View>
              </View>
            ) : recentRentals.length > 0 ? (
              <View>
                {recentRentals.map((rental) => {
                  const vehicleImage = getVehicleImageUrl(rental);
                  return (
                    <View key={rental._id} className="bg-white rounded-lg p-4 shadow-sm mb-3">
                      <View className="flex-row items-center">
                        {/* Vehicle Image */}
                        <View className="w-16 h-16 rounded-lg overflow-hidden mr-4">
                          {vehicleImage ? (
                            <Image
                              source={{ 
                                uri: vehicleImage,
                                headers: { 'Accept': 'image/*' }
                              }}
                              className="w-full h-full"
                              resizeMode="cover"
                            />
                          ) : (
                            <View className="w-full h-full bg-gray-100 items-center justify-center">
                              <Car size={24} color="#9CA3AF" />
                            </View>
                          )}
                        </View>
                        
                        {/* Rental Info */}
                        <View className="flex-1">
                          <Text className="text-base font-semibold text-gray-800">
                            {rental.vehicle?.name || 'Vehicle'}
                          </Text>
                          <Text className="text-sm text-gray-500 mt-1">
                            {formatDate(rental.pickupDate)} - {formatDate(rental.dropoffDate)}
                          </Text>
                          <View className="flex-row items-center mt-2">
                            <CheckCircle size={16} color="#059669" />
                            <Text className="text-sm text-green-600 ml-1 font-medium">Completed</Text>
                          </View>
                        </View>
                        
                        {/* Price and Rating */}
                        <View className="items-end">
                          <Text className="text-lg font-bold text-gray-800">
                            ₹{rental.priceBreakdown.totalPrice.toLocaleString()}
                          </Text>
                          {rental.rating && (
                            <View className="flex-row items-center mt-1">
                              <Star size={14} color="#F59E0B" fill="#F59E0B" />
                              <Text className="text-sm text-gray-600 ml-1">{rental.rating}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            ) : (
              <View className="bg-white rounded-lg p-6 shadow-sm">
                <View className="items-center py-4">
                  <CheckCircle size={48} color="#9CA3AF" />
                  <Text className="text-gray-500 mt-4 text-center">No completed rentals yet</Text>
                  <Text className="text-gray-400 text-sm mt-2 text-center">
                    Your completed rentals will appear here
                  </Text>
                </View>
              </View>
            )}
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

      {/* Enhanced Notifications Modal */}
      <Modal 
        visible={showNotifications} 
        animationType="none" 
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={closeNotifications}
      >
        <StatusBar backgroundColor="rgba(0,0,0,0.5)" barStyle="light-content" />
        
        {/* Animated Overlay */}
        <Animated.View 
          className="flex-1"
          style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            opacity: overlayOpacity,
          }}
        >
          <TouchableOpacity 
            className="flex-1" 
            activeOpacity={1} 
            onPress={closeNotifications}
          />
          
          {/* Animated Modal Container */}
          <Animated.View
            className="bg-white rounded-t-3xl"
            style={{
              maxHeight: screenHeight * 0.85,
              minHeight: screenHeight * 0.5,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [screenHeight, 0],
                  }),
                },
              ],
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 20,
            }}
          >
            {/* Modal Handle */}
            <View className="items-center pt-4 pb-3">
              <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </View>

            {/* Enhanced Modal Header */}
            <View className="px-6 py-5 border-b border-gray-100">
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center flex-1">
                  <View className="bg-blue-100 rounded-full p-2.5 mr-3">
                    <BellRing size={18} color="#0096c7" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-xl font-bold text-gray-900">Notifications</Text>
                    <Text className="text-sm text-gray-500 mt-0.5">
                      {notifications.length === 0 
                        ? 'No notifications' 
                        : `${unreadCount} unread of ${notifications.length}`
                      }
                    </Text>
                  </View>
                </View>
                
                <View className="flex-row items-center ml-4">
                  {unreadCount > 0 && (
                    <TouchableOpacity
                      onPress={handleMarkAllAsRead}
                      className="bg-blue-50 px-3 py-2 rounded-full mr-2"
                      activeOpacity={0.7}
                    >
                      <Text className="text-[#0096c7] font-semibold text-sm">Mark All Read</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity 
                    onPress={closeNotifications}
                    className="bg-gray-100 rounded-full p-2.5"
                    activeOpacity={0.7}
                  >
                    <X size={18} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Enhanced Notifications List */}
            <ScrollView 
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ 
                paddingHorizontal: 20, 
                paddingTop: 16,
                paddingBottom: 24 
              }}
            >
              {notifications.length === 0 ? (
                <View className="flex-1 items-center justify-center" style={{ minHeight: 300 }}>
                  <View className="bg-gray-50 rounded-full p-8 mb-6">
                    <Bell size={48} color="#D1D5DB" />
                  </View>
                  <Text className="text-xl font-bold text-gray-800 mb-3 text-center">
                    All Caught Up!
                  </Text>
                  <Text className="text-base text-gray-600 text-center leading-6 px-4">
                    You're all set. New notifications will appear here when they arrive.
                  </Text>
                </View>
              ) : (
                <View>
                  {notifications.map((notification, index) => (
                    <TouchableOpacity
                      key={notification.id}
                      onPress={() => handleNotificationPress(notification)}
                      activeOpacity={0.7}
                      className={`rounded-2xl border-2 mb-4 ${
                        notification.read 
                          ? 'bg-gray-50 border-gray-100' 
                          : 'bg-blue-50 border-blue-200'
                      }`}
                      style={{
                        shadowColor: notification.read ? '#000' : '#0096c7',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: notification.read ? 0.05 : 0.1,
                        shadowRadius: 4,
                        elevation: notification.read ? 2 : 4,
                      }}
                    >
                      <View className="p-5">
                        <View className="flex-row items-start">
                          {/* Notification Icon */}
                          <View className={`rounded-full p-3 mr-4 ${
                            notification.type === 'vehicle_added' 
                              ? 'bg-green-100' 
                              : notification.read 
                                ? 'bg-gray-100' 
                                : 'bg-blue-100'
                          }`}>
                            {notification.type === 'vehicle_added' ? (
                              <Car size={20} color="#059669" />
                            ) : (
                              <Bell size={20} color={notification.read ? "#9CA3AF" : "#0096c7"} />
                            )}
                          </View>
                          
                          {/* Notification Content */}
                          <View className="flex-1 pr-2">
                            <View className="flex-row items-start justify-between mb-2">
                              <Text className={`text-base font-bold flex-1 pr-2 ${
                                notification.read ? 'text-gray-700' : 'text-gray-900'
                              }`}>
                                {notification.title}
                              </Text>
                              {!notification.read && (
                                <View className="w-3 h-3 bg-blue-500 rounded-full mt-1" />
                              )}
                            </View>
                            
                            <Text className={`text-sm mb-4 leading-5 ${
                              notification.read ? 'text-gray-600' : 'text-gray-700'
                            }`}>
                              {notification.message}
                            </Text>
                            
                            <View className="flex-row items-center justify-between">
                              <Text className="text-xs text-gray-500 font-medium">
                                {formatNotificationTime(notification.timestamp)}
                              </Text>
                              
                              {notification.type === 'vehicle_added' && (
                                <View className="bg-green-100 px-3 py-1 rounded-full">
                                  <Text className="text-green-700 text-xs font-semibold">
                                    New Vehicle
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>
                      </View>
                      
                      {/* Hover Effect Indicator */}
                      <View className={`absolute right-3 top-1/2 ${
                        notification.read ? 'opacity-20' : 'opacity-40'
                      }`} style={{ transform: [{ translateY: -16 }] }}>
                        <View className="w-1 h-8 bg-blue-400 rounded-full" />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
            
            {/* Modal Footer */}
            {notifications.length > 0 && (
              <View className="px-6 py-5 border-t border-gray-100 bg-gray-50">
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm text-gray-600 flex-1">
                    Swipe down to close
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      // Future: Clear all notifications functionality
                      console.log('Clear all notifications');
                    }}
                    className="flex-row items-center bg-red-50 px-4 py-2.5 rounded-full ml-4"
                    activeOpacity={0.7}
                  >
                    <Trash2 size={14} color="#DC2626" />
                    <Text className="text-red-600 font-semibold text-sm ml-2">Clear All</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
};

export default DashboardScreen;
