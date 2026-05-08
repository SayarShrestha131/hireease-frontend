/**
 * Rental History Screen
 * 
 * Displays user's completed rental history with detailed information
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import {
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  Car,
  Star,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import bookingService from '../services/bookingService';
import { Booking } from '../types/booking';
import { getCurrentApiUrl } from '../config/api';

const { width } = Dimensions.get('window');

interface RentalHistoryScreenProps {
  onNavigateBack: () => void;
  onNavigateToDetail?: (bookingId: string) => void;
}

/**
 * RentalHistoryScreen Component
 */
export const RentalHistoryScreen: React.FC<RentalHistoryScreenProps> = ({ 
  onNavigateBack,
  onNavigateToDetail,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [completedBookings, setCompletedBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch completed bookings on mount
   */
  useEffect(() => {
    if (isAuthenticated) {
      fetchCompletedBookings();
    } else {
      setIsLoading(false);
      setError('Please log in to view your rental history');
    }
  }, [isAuthenticated]);

  /**
   * Fetch user's completed bookings from API
   */
  const fetchCompletedBookings = async () => {
    if (!isAuthenticated || !user) {
      console.log('[RentalHistoryScreen] User not authenticated, skipping fetch');
      setIsLoading(false);
      setRefreshing(false);
      setError('Please log in to view your rental history');
      return;
    }

    try {
      setError(null);
      console.log('[RentalHistoryScreen] Fetching completed bookings for user:', user?._id);
      
      // Fetch only completed bookings
      const response = await bookingService.getUserBookings({ 
        status: 'completed',
        limit: 50 // Get more records for history
      });
      
      console.log('[RentalHistoryScreen] ✅ Completed bookings fetched:', response.bookings.length);
      setCompletedBookings(response.bookings);
    } catch (err: any) {
      console.error('[RentalHistoryScreen] ❌ Error fetching completed bookings:', err);
      
      if (err.message?.includes('session has expired') || err.message?.includes('401')) {
        setError('Your session has expired. Please log in again.');
      } else if (err.message?.includes('Network') || err.message?.includes('network')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(err.message || 'Failed to load rental history. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Handle pull-to-refresh
   */
  const onRefresh = useCallback(() => {
    if (!isAuthenticated) {
      console.log('[RentalHistoryScreen] Cannot refresh - user not authenticated');
      setRefreshing(false);
      return;
    }
    
    console.log('[RentalHistoryScreen] Refreshing rental history...');
    setRefreshing(true);
    fetchCompletedBookings();
  }, [isAuthenticated]);

  /**
   * Navigate to booking detail screen
   */
  const handleBookingPress = (bookingId: string) => {
    if (onNavigateToDetail) {
      onNavigateToDetail(bookingId);
    }
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
      year: 'numeric',
    });
  };

  /**
   * Format time for display
   */
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  /**
   * Calculate rental duration
   */
  const calculateDuration = (pickupDate: string, dropoffDate: string): string => {
    const pickup = new Date(pickupDate);
    const dropoff = new Date(dropoffDate);
    const diffTime = Math.abs(dropoff.getTime() - pickup.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day';
    return `${diffDays} days`;
  };

  /**
   * Render header with back button
   */
  const renderHeader = () => (
    <View style={{ backgroundColor: '#0096c7', paddingTop: 50 }}>
      <View className="px-6 pb-6">
        <View className="flex-row items-center mb-6">
          <TouchableOpacity 
            onPress={onNavigateBack}
            className="bg-white/20 rounded-full p-2 mr-4"
          >
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">Rental History</Text>
            <Text className="text-blue-100 text-sm mt-1">
              {completedBookings.length} completed rental{completedBookings.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  /**
   * Render rental history card
   */
  const renderRentalCard = (booking: Booking) => {
    const vehicleImage = getVehicleImageUrl(booking);
    const vehicleName = booking.vehicle?.name || 'Vehicle';
    const vehicleModel = booking.vehicle?.vehicleModel || '';
    const duration = calculateDuration(booking.pickupDate, booking.dropoffDate);

    return (
      <TouchableOpacity
        key={booking._id}
        onPress={() => handleBookingPress(booking._id)}
        className="bg-white rounded-3xl mx-6 mb-4 overflow-hidden"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 5,
        }}
        activeOpacity={0.95}
      >
        {/* Vehicle Image Header */}
        <View className="relative">
          {vehicleImage ? (
            <Image
              source={{ 
                uri: vehicleImage,
                headers: { 'Accept': 'image/*' }
              }}
              className="w-full h-48"
              style={{ height: 192 }}
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 items-center justify-center">
              <Car size={48} color="#9CA3AF" />
            </View>
          )}
          
          {/* Completed Badge */}
          <View className="absolute top-4 right-4 px-3 py-1.5 rounded-full flex-row items-center bg-green-100">
            <CheckCircle size={16} color="#059669" />
            <Text className="text-green-700 text-xs font-semibold ml-1">Completed</Text>
          </View>
        </View>

        {/* Card Content */}
        <View className="p-6">
          {/* Vehicle Info */}
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1">
              <Text className="text-xl font-bold text-gray-900 mb-1">
                {vehicleName}
              </Text>
              {vehicleModel && (
                <Text className="text-sm text-gray-500">
                  {vehicleModel}
                </Text>
              )}
            </View>
            <Text className="text-2xl font-bold text-green-600">
              ₹{booking.priceBreakdown.totalPrice.toLocaleString()}
            </Text>
          </View>

          {/* Rental Details */}
          <View className="space-y-3">
            {/* Booking ID */}
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center mr-3">
                <Text className="text-xs font-bold text-gray-600">#</Text>
              </View>
              <Text className="text-sm text-gray-600 flex-1">
                {booking.bookingId}
              </Text>
            </View>

            {/* Rental Period */}
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-blue-50 rounded-full items-center justify-center mr-3">
                <Calendar size={16} color="#0096c7" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-900">
                  {formatDate(booking.pickupDate)} - {formatDate(booking.dropoffDate)}
                </Text>
                <Text className="text-xs text-gray-500">
                  {duration} rental
                </Text>
              </View>
            </View>

            {/* Completion Date */}
            {booking.returnedAt && (
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-green-50 rounded-full items-center justify-center mr-3">
                  <CheckCircle size={16} color="#059669" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-900">
                    Returned on {formatDate(booking.returnedAt)}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    at {formatTime(booking.returnedAt)}
                  </Text>
                </View>
              </View>
            )}

            {/* Rating (if available) */}
            {booking.rating && (
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-yellow-50 rounded-full items-center justify-center mr-3">
                  <Star size={16} color="#F59E0B" />
                </View>
                <View className="flex-1 flex-row items-center">
                  <Text className="text-sm font-medium text-gray-900 mr-2">
                    Your Rating:
                  </Text>
                  <View className="flex-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        color={star <= booking.rating! ? "#F59E0B" : "#E5E7EB"}
                        fill={star <= booking.rating! ? "#F59E0B" : "transparent"}
                      />
                    ))}
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Action Arrow */}
          <View className="flex-row justify-end mt-4">
            <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
              <ChevronRight size={20} color="#6B7280" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="w-32 h-32 bg-gradient-to-br from-green-50 to-green-100 rounded-full items-center justify-center mb-8">
        <CheckCircle size={64} color="#059669" />
      </View>
      
      <Text className="text-2xl font-bold text-gray-900 mb-3 text-center">
        No Rental History
      </Text>
      
      <Text className="text-base text-gray-500 mb-8 text-center leading-6">
        You haven't completed any rentals yet. Your completed rentals will appear here.
      </Text>
    </View>
  );

  /**
   * Render error state
   */
  const renderErrorState = () => (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="w-24 h-24 bg-red-50 rounded-full items-center justify-center mb-6">
        <Text className="text-3xl">😕</Text>
      </View>
      <Text className="text-xl font-bold text-gray-900 mb-3 text-center">
        Something went wrong
      </Text>
      <Text className="text-base text-gray-500 mb-8 text-center leading-6">
        {error}
      </Text>
      <TouchableOpacity
        onPress={fetchCompletedBookings}
        className="bg-[#0096c7] rounded-2xl px-8 py-4"
        style={{
          shadowColor: '#0096c7',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <Text className="text-white font-bold text-base">
          Try Again
        </Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * Render loading state
   */
  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        {renderHeader()}
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0096c7" />
          <Text className="text-gray-500 mt-4 text-base">Loading rental history...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      {renderHeader()}

      {/* Content */}
      {error ? (
        renderErrorState()
      ) : (
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
          showsVerticalScrollIndicator={false}
        >
          {completedBookings.length > 0 ? (
            <View className="py-6">
              {completedBookings.map(renderRentalCard)}
            </View>
          ) : (
            renderEmptyState()
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default RentalHistoryScreen;