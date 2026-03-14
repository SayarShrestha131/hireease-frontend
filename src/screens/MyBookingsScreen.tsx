/**
 * My Bookings Screen
 * 
 * Displays user's booking history with filtering and navigation to details
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  Filter,
  Car,
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import bookingService from '../services/bookingService';
import { Booking, BookingStatus } from '../types/booking';
import { getCurrentApiUrl } from '../config/api';

interface MyBookingsScreenProps {
  onNavigateToDetail: (bookingId: string) => void;
  onNavigateToVehicles?: () => void;
}

type FilterType = 'all' | BookingStatus;

/**
 * MyBookingsScreen Component
 */
export const MyBookingsScreen: React.FC<MyBookingsScreenProps> = ({ 
  onNavigateToDetail,
  onNavigateToVehicles,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  /**
   * Fetch bookings on mount and when authentication changes
   */
  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
    } else {
      setIsLoading(false);
      setError('Please log in to view your bookings');
    }
  }, [isAuthenticated]);

  /**
   * Apply filter when bookings or filter changes
   */
  useEffect(() => {
    applyFilter();
  }, [bookings, filter]);

  /**
   * Fetch user's bookings from API
   */
  const fetchBookings = async () => {
    // Don't fetch if user is not authenticated
    if (!isAuthenticated || !user) {
      console.log('[MyBookingsScreen] User not authenticated, skipping fetch');
      setIsLoading(false);
      setRefreshing(false);
      setError('Please log in to view your bookings');
      return;
    }

    try {
      setError(null);
      console.log('[MyBookingsScreen] Fetching bookings for user:', user?._id);
      
      const response = await bookingService.getUserBookings();
      
      console.log('[MyBookingsScreen] ✅ Bookings fetched successfully:', response.bookings.length);
      setBookings(response.bookings);
    } catch (err: any) {
      console.error('[MyBookingsScreen] ❌ Error fetching bookings:', err);
      
      // Check if it's an authentication error
      if (err.message?.includes('session has expired') || err.message?.includes('401')) {
        console.log('[MyBookingsScreen] Authentication error detected');
        setError('Your session has expired. Please log in again.');
      } else if (err.message?.includes('Network') || err.message?.includes('network')) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(err.message || 'Failed to load bookings. Please try again.');
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
      console.log('[MyBookingsScreen] Cannot refresh - user not authenticated');
      setRefreshing(false);
      return;
    }
    
    console.log('[MyBookingsScreen] Refreshing bookings...');
    setRefreshing(true);
    fetchBookings();
  }, [isAuthenticated]);

  /**
   * Apply selected filter to bookings
   */
  const applyFilter = () => {
    if (filter === 'all') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter(booking => booking.status === filter));
    }
  };

  /**
   * Navigate to booking detail screen
   */
  const handleBookingPress = (bookingId: string) => {
    onNavigateToDetail(bookingId);
  };

  /**
   * Get status badge color
   */
  const getStatusColor = (status: BookingStatus): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
   * Get filter button style
   */
  const getFilterButtonStyle = (filterValue: FilterType): string => {
    return filter === filterValue
      ? 'bg-[#0096c7] border-[#0096c7]'
      : 'bg-white border-gray-300';
  };

  /**
   * Get filter text style
   */
  const getFilterTextStyle = (filterValue: FilterType): string => {
    return filter === filterValue ? 'text-white' : 'text-gray-700';
  };

  /**
   * Render filter buttons
   */
  const renderFilterButtons = () => {
    const filters: { value: FilterType; label: string }[] = [
      { value: 'all', label: 'All' },
      { value: 'pending', label: 'Pending' },
      { value: 'confirmed', label: 'Confirmed' },
      { value: 'active', label: 'Active' },
      { value: 'completed', label: 'Completed' },
      { value: 'cancelled', label: 'Cancelled' },
    ];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-6 py-4 bg-white border-b border-gray-200"
      >
        {filters.map((filterItem) => (
          <TouchableOpacity
            key={filterItem.value}
            onPress={() => setFilter(filterItem.value)}
            className={`px-4 py-2 rounded-full border mr-2 ${getFilterButtonStyle(filterItem.value)}`}
          >
            <Text className={`text-sm font-medium ${getFilterTextStyle(filterItem.value)}`}>
              {filterItem.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  /**
   * Get vehicle image URL
   */
  const getVehicleImageUrl = (booking: Booking) => {
    if (booking.vehicle?.images && booking.vehicle.images.length > 0) {
      const imageValue = booking.vehicle.images[0];
      
      // Check if it's already a full URL (http:// or https://)
      if (imageValue.startsWith('http://') || imageValue.startsWith('https://')) {
        return imageValue;
      }
      
      // Otherwise, construct URL from API base
      const baseUrl = getCurrentApiUrl();
      const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
      return `${cleanBaseUrl}/vehicles/image/${imageValue}?t=${Date.now()}`;
    }
    return null; // Return null instead of placeholder URL
  };

  /**
   * Render booking card
   */
  const renderBookingCard = (booking: Booking) => {
    const vehicleImage = getVehicleImageUrl(booking);
    const vehicleName = booking.vehicle?.name || 'Vehicle';
    const vehicleModel = booking.vehicle?.vehicleModel || '';

    return (
      <TouchableOpacity
        key={booking._id}
        onPress={() => handleBookingPress(booking._id)}
        className="bg-white rounded-lg p-4 mb-3 mx-6 shadow-sm border border-gray-100"
        activeOpacity={0.7}
      >
        <View className="flex-row">
          {/* Vehicle Image or Placeholder */}
          {vehicleImage ? (
            <Image
              source={{ 
                uri: vehicleImage,
                headers: {
                  'Accept': 'image/*',
                }
              }}
              className="w-24 h-24 rounded-lg"
              style={{
                width: 96,
                height: 96,
                borderRadius: 8,
                backgroundColor: '#E5E7EB'
              }}
              resizeMode="cover"
              onError={(error) => {
                console.error('[MyBookingsScreen] Image load error:', error.nativeEvent.error);
              }}
            />
          ) : (
            <View className="w-24 h-24 rounded-lg bg-gray-200 items-center justify-center">
              <Car size={40} color="#9CA3AF" />
            </View>
          )}

          {/* Booking Details */}
          <View className="flex-1 ml-4">
            {/* Vehicle Name and Status */}
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-1">
                <Text className="text-base font-bold text-gray-800" numberOfLines={1}>
                  {vehicleName}
                </Text>
                {vehicleModel && (
                  <Text className="text-sm text-gray-600" numberOfLines={1}>
                    {vehicleModel}
                  </Text>
                )}
              </View>
              <View className={`px-3 py-1 rounded-full ml-2 ${getStatusColor(booking.status)}`}>
                <Text className="text-xs font-semibold capitalize">
                  {booking.status}
                </Text>
              </View>
            </View>

            {/* Booking ID */}
            <Text className="text-xs text-gray-500 mb-2">
              {booking.bookingId}
            </Text>

            {/* Dates */}
            <View className="flex-row items-center mb-1">
              <Calendar size={14} color="#6B7280" />
              <Text className="text-sm text-gray-600 ml-2">
                {formatDate(booking.pickupDate)} - {formatDate(booking.dropoffDate)}
              </Text>
            </View>

            {/* Price */}
            <Text className="text-base font-bold text-[#0096c7] mt-2">
              Rs. {booking.priceBreakdown.totalPrice.toLocaleString()}
            </Text>
          </View>

          {/* Arrow Icon */}
          <View className="justify-center ml-2">
            <ChevronRight size={20} color="#9CA3AF" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-6 py-12">
      <Calendar size={64} color="#D1D5DB" />
      <Text className="text-xl font-bold text-gray-800 mt-6 text-center">
        No Bookings Found
      </Text>
      <Text className="text-base text-gray-600 mt-2 text-center">
        {filter === 'all'
          ? "You haven't made any bookings yet. Start exploring vehicles to make your first booking!"
          : `You don't have any ${filter} bookings.`}
      </Text>
      {filter === 'all' && onNavigateToVehicles && (
        <TouchableOpacity
          onPress={onNavigateToVehicles}
          className="bg-[#0096c7] rounded-lg px-6 py-3 mt-6"
        >
          <Text className="text-white font-semibold text-base">
            Browse Vehicles
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  /**
   * Render error state
   */
  const renderErrorState = () => (
    <View className="flex-1 items-center justify-center px-6 py-12">
      <Text className="text-xl font-bold text-gray-800 mb-4 text-center">
        Oops! Something went wrong
      </Text>
      <Text className="text-base text-gray-600 mb-6 text-center">
        {error}
      </Text>
      <TouchableOpacity
        onPress={fetchBookings}
        className="bg-[#0096c7] rounded-lg px-6 py-3"
      >
        <Text className="text-white font-semibold text-base">
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
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="bg-white px-6 py-6 border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-800">My Bookings</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0096c7" />
          <Text className="text-gray-600 mt-4">Loading bookings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-6 border-b border-gray-200">
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-gray-800">My Bookings</Text>
          <View className="bg-[#0096c7] rounded-full px-3 py-1">
            <Text className="text-white font-semibold text-sm">
              {filteredBookings.length}
            </Text>
          </View>
        </View>
      </View>

      {/* Filter Buttons */}
      {renderFilterButtons()}

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
        >
          {filteredBookings.length > 0 ? (
            <View className="py-4">
              {filteredBookings.map(renderBookingCard)}
            </View>
          ) : (
            renderEmptyState()
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default MyBookingsScreen;
