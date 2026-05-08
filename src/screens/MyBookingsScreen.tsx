/**
 * My Bookings Screen - Modern Card Design
 * 
 * Displays user's booking history with modern card-based UI
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
  Linking,
  Alert,
} from 'react-native';
import {
  Calendar,
  Clock,
  ChevronRight,
  Car,
  Search,
  Plus,
  Download,
  RefreshCw,
  XCircle,
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import bookingService from '../services/bookingService';
import paymentService from '../services/paymentService';
import { Booking, BookingStatus } from '../types/booking';
import { getCurrentApiUrl } from '../config/api';

const { width } = Dimensions.get('window');

interface MyBookingsScreenProps {
  onNavigateToDetail: (bookingId: string) => void;
  onNavigateToVehicles?: () => void;
  onNavigateToPayment?: (booking: Booking, paymentMethod: 'khalti' | 'stripe' | 'paypal') => void;
}

type FilterType = 'all' | BookingStatus;

/**
 * MyBookingsScreen Component
 */
export const MyBookingsScreen: React.FC<MyBookingsScreenProps> = ({ 
  onNavigateToDetail,
  onNavigateToVehicles,
  onNavigateToPayment,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
   * Apply filter when bookings, filter, or search changes
   */
  useEffect(() => {
    applyFilter();
  }, [bookings, filter, searchQuery]);

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
    let filtered = bookings;
    
    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(booking => booking.status === filter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.vehicle?.name?.toLowerCase().includes(query) ||
        booking.bookingId.toLowerCase().includes(query) ||
        booking.vehicle?.vehicleModel?.toLowerCase().includes(query)
      );
    }
    
    setFilteredBookings(filtered);
  };

  /**
   * Navigate to booking detail screen
   */
  const handleBookingPress = (bookingId: string) => {
    onNavigateToDetail(bookingId);
  };

  /**
   * Handle receipt download
   */
  const handleDownloadReceipt = async (booking: Booking, event: any) => {
    event.stopPropagation();
    
    try {
      const response = await paymentService.getReceipt(booking._id);
      const receiptUrl = response.data.receiptUrl;
      
      const supported = await Linking.canOpenURL(receiptUrl);
      if (supported) {
        await Linking.openURL(receiptUrl);
      }
    } catch (error) {
      console.error('Failed to download receipt:', error);
      Alert.alert('Error', 'Failed to download receipt. Please try again.');
    }
  };

  /**
   * Handle payment retry
   */
  const handleRetryPayment = (booking: Booking, event: any) => {
    event.stopPropagation();
    
    if (!onNavigateToPayment) {
      Alert.alert('Error', 'Payment navigation not available');
      return;
    }

    Alert.alert(
      'Retry Payment',
      'Select a payment method to retry payment for this booking.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Khalti', 
          onPress: () => onNavigateToPayment(booking, 'khalti')
        },
        { 
          text: 'Stripe', 
          onPress: () => onNavigateToPayment(booking, 'stripe')
        },
        { 
          text: 'PayPal', 
          onPress: () => onNavigateToPayment(booking, 'paypal')
        },
      ]
    );
  };

  /**
   * Get status badge color and style
   */
  const getStatusStyle = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return { bg: '#FEF3C7', text: '#D97706', dot: '#F59E0B' };
      case 'confirmed':
        return { bg: '#D1FAE5', text: '#059669', dot: '#10B981' };
      case 'active':
        return { bg: '#DBEAFE', text: '#2563EB', dot: '#3B82F6' };
      case 'completed':
        return { bg: '#F3F4F6', text: '#374151', dot: '#6B7280' };
      case 'cancelled':
        return { bg: '#FEE2E2', text: '#DC2626', dot: '#EF4444' };
      default:
        return { bg: '#F3F4F6', text: '#374151', dot: '#6B7280' };
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
   * Render modern header with search
   */
  const renderHeader = () => (
    <View style={{ backgroundColor: '#0096c7', paddingTop: 50 }}>
      <View className="px-6 pb-6">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-white text-2xl font-bold">My Bookings</Text>
            <Text className="text-blue-100 text-sm mt-1">
              {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={onNavigateToVehicles}
            className="bg-white/20 rounded-full p-3"
          >
            <Plus size={24} color="white" />
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <View className="bg-white/10 rounded-2xl px-4 py-3 flex-row items-center">
          <Search size={20} color="rgba(255,255,255,0.7)" />
          <Text 
            className="flex-1 ml-3 text-white/70 text-base"
            onPress={() => {/* Add search functionality */}}
          >
            Search bookings...
          </Text>
        </View>
      </View>
    </View>
  );

  /**
   * Render modern filter chips
   */
  const renderFilterChips = () => {
    const filters: { value: FilterType; label: string; count: number }[] = [
      { value: 'all', label: 'All', count: bookings.length },
      { value: 'pending', label: 'Pending', count: bookings.filter(b => b.status === 'pending').length },
      { value: 'confirmed', label: 'Confirmed', count: bookings.filter(b => b.status === 'confirmed').length },
      { value: 'active', label: 'Active', count: bookings.filter(b => b.status === 'active').length },
      { value: 'completed', label: 'Completed', count: bookings.filter(b => b.status === 'completed').length },
    ];

    return (
      <View className="px-6 py-4 bg-gray-50">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 24 }}
        >
          {filters.map((filterItem, index) => (
            <TouchableOpacity
              key={filterItem.value}
              onPress={() => setFilter(filterItem.value)}
              className={`px-4 py-2 rounded-full mr-3 flex-row items-center ${
                filter === filterItem.value
                  ? 'bg-[#0096c7]'
                  : 'bg-white border border-gray-200'
              }`}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              }}
            >
              <Text className={`text-sm font-medium ${
                filter === filterItem.value ? 'text-white' : 'text-gray-700'
              }`}>
                {filterItem.label}
              </Text>
              {filterItem.count > 0 && (
                <View className={`ml-2 px-2 py-0.5 rounded-full ${
                  filter === filterItem.value ? 'bg-white/20' : 'bg-gray-100'
                }`}>
                  <Text className={`text-xs font-semibold ${
                    filter === filterItem.value ? 'text-white' : 'text-gray-600'
                  }`}>
                    {filterItem.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
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
   * Render modern booking card
   */
  const renderBookingCard = (booking: Booking) => {
    const vehicleImage = getVehicleImageUrl(booking);
    const vehicleName = booking.vehicle?.name || 'Vehicle';
    const vehicleModel = booking.vehicle?.vehicleModel || '';
    const statusStyle = getStatusStyle(booking.status);

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
          
          {/* Status Badge */}
          <View 
            className="absolute top-4 right-4 px-3 py-1.5 rounded-full flex-row items-center"
            style={{ backgroundColor: statusStyle.bg }}
          >
            <View 
              className="w-2 h-2 rounded-full mr-2"
              style={{ backgroundColor: statusStyle.dot }}
            />
            <Text 
              className="text-xs font-semibold capitalize"
              style={{ color: statusStyle.text }}
            >
              {booking.status}
            </Text>
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
            <Text className="text-2xl font-bold text-[#0096c7]">
              ₹{booking.priceBreakdown.totalPrice.toLocaleString()}
            </Text>
          </View>

          {/* Booking Details */}
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

            {/* Dates */}
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-blue-50 rounded-full items-center justify-center mr-3">
                <Calendar size={16} color="#0096c7" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-900">
                  {formatDate(booking.pickupDate)} - {formatDate(booking.dropoffDate)}
                </Text>
                <Text className="text-xs text-gray-500">
                  {formatTime(booking.pickupDate)} pickup
                </Text>
              </View>
            </View>

            {/* Duration Info */}
            {booking.priceBreakdown?.duration && (
              <View className="flex-row items-center">
                <View className="w-8 h-8 bg-green-50 rounded-full items-center justify-center mr-3">
                  <Clock size={16} color="#059669" />
                </View>
                <Text className="text-sm text-gray-600 flex-1">
                  {booking.priceBreakdown.duration} day{booking.priceBreakdown.duration !== 1 ? 's' : ''} rental
                </Text>
              </View>
            )}

            {/* Payment Status */}
            <View className={`rounded-lg p-3 mt-2 ${
              booking.paymentStatus === 'completed' ? 'bg-green-50' :
              booking.paymentStatus === 'pending' ? 'bg-yellow-50' :
              booking.paymentStatus === 'refunded' ? 'bg-blue-50' : 'bg-red-50'
            }`}>
              <Text className={`text-xs font-semibold ${
                booking.paymentStatus === 'completed' ? 'text-green-700' :
                booking.paymentStatus === 'pending' ? 'text-yellow-700' :
                booking.paymentStatus === 'refunded' ? 'text-blue-700' : 'text-red-700'
              }`}>
                Payment: {booking.paymentStatus === 'completed' ? 'Completed' :
                          booking.paymentStatus === 'pending' ? 'Pending' :
                          booking.paymentStatus === 'refunded' ? 'Refunded' :
                          booking.paymentStatus === 'failed' ? 'Failed' : 'Unknown'}
              </Text>
              {booking.paymentMethod && (
                <Text className={`text-xs mt-1 ${
                  booking.paymentStatus === 'completed' ? 'text-green-600' :
                  booking.paymentStatus === 'pending' ? 'text-yellow-600' :
                  booking.paymentStatus === 'refunded' ? 'text-blue-600' : 'text-red-600'
                }`}>
                  via {booking.paymentMethod}
                </Text>
              )}
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row mt-4 space-x-2">
            {/* Receipt Download for Completed Payments */}
            {booking.paymentStatus === 'completed' && (
              <TouchableOpacity
                className="flex-1 bg-blue-50 rounded-lg py-2 px-3 flex-row items-center justify-center mr-2"
                onPress={(e) => handleDownloadReceipt(booking, e)}
              >
                <Download size={16} color="#0096c7" />
                <Text className="text-[#0096c7] text-xs font-semibold ml-1">Receipt</Text>
              </TouchableOpacity>
            )}

            {/* Retry Payment for Failed Payments */}
            {booking.paymentStatus === 'failed' && onNavigateToPayment && (
              <TouchableOpacity
                className="flex-1 bg-red-50 rounded-lg py-2 px-3 flex-row items-center justify-center mr-2"
                onPress={(e) => handleRetryPayment(booking, e)}
              >
                <RefreshCw size={16} color="#DC2626" />
                <Text className="text-red-600 text-xs font-semibold ml-1">Retry</Text>
              </TouchableOpacity>
            )}

            {/* Refund Status for Cancelled Bookings */}
            {booking.status === 'cancelled' && booking.paymentStatus === 'refunded' && (
              <View className="flex-1 bg-blue-50 rounded-lg py-2 px-3 flex-row items-center justify-center mr-2">
                <XCircle size={16} color="#0096c7" />
                <Text className="text-[#0096c7] text-xs font-semibold ml-1">Refunded</Text>
              </View>
            )}

            {/* View Details Arrow */}
            <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center">
              <ChevronRight size={20} color="#6B7280" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Render modern empty state
   */
  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="w-32 h-32 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full items-center justify-center mb-8">
        <Calendar size={64} color="#0096c7" />
      </View>
      
      <Text className="text-2xl font-bold text-gray-900 mb-3 text-center">
        {filter === 'all' ? 'No Bookings Yet' : `No ${filter} Bookings`}
      </Text>
      
      <Text className="text-base text-gray-500 mb-8 text-center leading-6">
        {filter === 'all'
          ? "Ready to hit the road? Browse our amazing vehicles and book your first ride!"
          : `You don't have any ${filter} bookings at the moment.`}
      </Text>
      
      {filter === 'all' && onNavigateToVehicles && (
        <TouchableOpacity
          onPress={onNavigateToVehicles}
          className="bg-[#0096c7] rounded-2xl px-8 py-4 flex-row items-center"
          style={{
            shadowColor: '#0096c7',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 6,
          }}
        >
          <Car size={20} color="white" />
          <Text className="text-white font-bold text-base ml-2">
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
        onPress={fetchBookings}
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
          <Text className="text-gray-500 mt-4 text-base">Loading your bookings...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Modern Header */}
      {renderHeader()}

      {/* Filter Chips */}
      {renderFilterChips()}

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
          {filteredBookings.length > 0 ? (
            <View className="py-6">
              {filteredBookings.map(renderBookingCard)}
            </View>
          ) : (
            renderEmptyState()
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default MyBookingsScreen;
