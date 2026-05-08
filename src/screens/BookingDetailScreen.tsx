/**
 * Booking Detail Screen
 * 
 * Displays complete booking information including vehicle details, rental period,
 * price breakdown, payment information, status timeline, and cancellation options.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Car,
  Phone,
  Mail,
  Package,
  Download,
} from 'lucide-react-native';
import bookingService from '../services/bookingService';
import paymentService from '../services/paymentService';
import { Booking, BookingStatus } from '../types/booking';
import { getCurrentApiUrl } from '../config/api';

interface BookingDetailScreenProps {
  bookingId: string;
  onNavigateBack: () => void;
}

export const BookingDetailScreen: React.FC<BookingDetailScreenProps> = ({
  bookingId,
  onNavigateBack,
}) => {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  /**
   * Fetch booking details on mount
   */
  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  /**
   * Fetch receipt if payment is completed
   */
  useEffect(() => {
    // Fetch receipt if payment is completed
    if (booking && booking.paymentStatus === 'completed') {
      fetchReceipt();
    }
  }, [booking?.paymentStatus]);

  /**
   * Fetch receipt from API
   */
  const fetchReceipt = async () => {
    if (!booking) return;
    
    try {
      setLoadingReceipt(true);
      const response = await paymentService.getReceipt(booking._id);
      setReceiptUrl(response.data.receiptUrl);
    } catch (error) {
      console.error('Failed to fetch receipt:', error);
    } finally {
      setLoadingReceipt(false);
    }
  };

  /**
   * Handle receipt download
   */
  const handleDownloadReceipt = async () => {
    if (receiptUrl) {
      try {
        const supported = await Linking.canOpenURL(receiptUrl);
        if (supported) {
          await Linking.openURL(receiptUrl);
        }
      } catch (error) {
        console.error('Failed to open receipt:', error);
        Alert.alert('Error', 'Failed to open receipt. Please try again.');
      }
    }
  };

  /**
   * Fetch booking details from API
   */
  const fetchBookingDetails = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const bookingData = await bookingService.getBookingById(bookingId);
      setBooking(bookingData);
    } catch (err: any) {
      console.error('Error fetching booking details:', err);
      setError(err.message || 'Failed to load booking details');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle booking cancellation with confirmation
   */
  const handleCancelBooking = () => {
    if (!booking) return;

    // Check if booking can be cancelled
    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      Alert.alert(
        'Cannot Cancel',
        'This booking cannot be cancelled. Only pending or confirmed bookings can be cancelled.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Check if pickup date has passed
    const pickupDate = new Date(booking.pickupDate);
    const now = new Date();
    if (pickupDate <= now) {
      Alert.alert(
        'Cannot Cancel',
        'This booking cannot be cancelled as the pickup date has passed.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Show confirmation dialog
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? This action cannot be undone.',
      [
        {
          text: 'No, Keep Booking',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: confirmCancellation,
        },
      ]
    );
  };

  /**
   * Confirm and execute booking cancellation
   */
  const confirmCancellation = async () => {
    if (!booking) return;

    try {
      setIsCancelling(true);
      
      // Cancel the booking
      const updatedBooking = await bookingService.cancelBooking(booking._id);
      
      // If payment was completed, initiate refund
      if (booking.paymentStatus === 'completed') {
        try {
          await paymentService.requestRefund({
            bookingId: booking._id,
            reason: 'User requested cancellation',
          });
          
          Alert.alert(
            'Booking Cancelled',
            'Your booking has been successfully cancelled. A refund has been initiated and will be processed within 5-7 business days.',
            [{ text: 'OK' }]
          );
        } catch (refundError) {
          console.error('Refund initiation failed:', refundError);
          Alert.alert(
            'Booking Cancelled',
            'Your booking has been cancelled, but there was an issue initiating the refund. Please contact support for assistance.',
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert(
          'Booking Cancelled',
          'Your booking has been successfully cancelled.',
          [{ text: 'OK' }]
        );
      }
      
      setBooking(updatedBooking);
    } catch (err: any) {
      console.error('Error cancelling booking:', err);
      Alert.alert(
        'Cancellation Failed',
        err.message || 'Failed to cancel booking. Please try again or contact support.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCancelling(false);
    }
  };

  /**
   * Handle contact support
   */
  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'How would you like to contact us?',
      [
        {
          text: 'Email',
          onPress: () => {
            Alert.alert('Email Support', 'support@vehiclerental.com');
          },
        },
        {
          text: 'Phone',
          onPress: () => {
            Alert.alert('Phone Support', '+977-1-234567');
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  /**
   * Format date to display string (DD MMM YYYY)
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  /**
   * Format date and time to display string
   */
  const formatDateTime = (dateString: string, timeString: string): string => {
    return `${formatDate(dateString)} at ${timeString}`;
  };

  /**
   * Get status color and icon
   */
  const getStatusInfo = (status: BookingStatus) => {
    switch (status) {
      case 'pending':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: AlertCircle,
          iconColor: '#D97706',
          label: 'Pending',
        };
      case 'confirmed':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle,
          iconColor: '#059669',
          label: 'Confirmed',
        };
      case 'active':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: CheckCircle,
          iconColor: '#0096c7',
          label: 'Active',
        };
      case 'completed':
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: CheckCircle,
          iconColor: '#6B7280',
          label: 'Completed',
        };
      case 'cancelled':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: XCircle,
          iconColor: '#DC2626',
          label: 'Cancelled',
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: AlertCircle,
          iconColor: '#6B7280',
          label: status,
        };
    }
  };

  /**
   * Get payment status color
   */
  const getPaymentStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'text-green-700';
      case 'pending':
        return 'text-yellow-700';
      case 'failed':
        return 'text-red-700';
      case 'refunded':
        return 'text-blue-700';
      default:
        return 'text-gray-700';
    }
  };

  /**
   * Get selected add-ons as array of objects
   */
  const getSelectedAddOns = () => {
    if (!booking) return [];
    
    const addOns = [];
    if (booking.addOns.helmet) {
      addOns.push({ name: 'Helmet', rate: 50 });
    }
    if (booking.addOns.gps) {
      addOns.push({ name: 'GPS Navigation', rate: 100 });
    }
    if (booking.addOns.insurance) {
      addOns.push({ name: 'Insurance Coverage', rate: 200 });
    }
    return addOns;
  };

  /**
   * Check if booking can be cancelled
   */
  const canCancelBooking = (): boolean => {
    if (!booking) return false;
    
    // Can only cancel pending or confirmed bookings
    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      return false;
    }
    
    // Cannot cancel if pickup date has passed
    const pickupDate = new Date(booking.pickupDate);
    const now = new Date();
    return pickupDate > now;
  };

  /**
   * Render status timeline
   */
  const renderStatusTimeline = () => {
    if (!booking) return null;

    const statuses = [
      { key: 'pending', label: 'Booking Created', active: true },
      { key: 'confirmed', label: 'Payment Confirmed', active: booking.status !== 'pending' && booking.status !== 'cancelled' },
      { key: 'active', label: 'Rental Active', active: booking.status === 'active' || booking.status === 'completed' },
      { key: 'completed', label: 'Rental Completed', active: booking.status === 'completed' },
    ];

    // If cancelled, show different timeline
    if (booking.status === 'cancelled') {
      return (
        <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <View className="flex-row items-center">
            <XCircle size={24} color="#DC2626" />
            <View className="ml-3 flex-1">
              <Text className="text-red-900 font-semibold text-base">Booking Cancelled</Text>
              {booking.cancelledAt && (
                <Text className="text-red-700 text-sm mt-1">
                  Cancelled on {formatDate(booking.cancelledAt)}
                </Text>
              )}
            </View>
          </View>
        </View>
      );
    }

    return (
      <View className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <Text className="text-base font-semibold text-gray-900 mb-4">Booking Status</Text>
        {statuses.map((status, index) => (
          <View key={status.key} className="flex-row items-start mb-3 last:mb-0">
            <View className="items-center mr-3">
              <View
                className={`w-6 h-6 rounded-full items-center justify-center ${
                  status.active ? 'bg-[#0096c7]' : 'bg-gray-300'
                }`}
              >
                {status.active && <CheckCircle size={16} color="#FFFFFF" />}
              </View>
              {index < statuses.length - 1 && (
                <View
                  className={`w-0.5 h-8 ${status.active ? 'bg-[#0096c7]' : 'bg-gray-300'}`}
                />
              )}
            </View>
            <View className="flex-1 pt-0.5">
              <Text
                className={`text-sm ${
                  status.active ? 'text-gray-900 font-semibold' : 'text-gray-500'
                }`}
              >
                {status.label}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  /**
   * Render loading state
   */
  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-white px-6 py-4 border-b border-gray-200">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={onNavigateBack} className="mr-4">
              <ArrowLeft size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-800">Booking Details</Text>
          </View>
        </View>

        {/* Loading */}
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0096c7" />
          <Text className="text-gray-600 mt-4">Loading booking details...</Text>
        </View>
      </View>
    );
  }

  /**
   * Render error state
   */
  if (error || !booking) {
    return (
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-white px-6 py-4 border-b border-gray-200">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={onNavigateBack} className="mr-4">
              <ArrowLeft size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-800">Booking Details</Text>
          </View>
        </View>

        {/* Error */}
        <View className="flex-1 items-center justify-center px-6">
          <AlertCircle size={64} color="#DC2626" />
          <Text className="text-xl font-bold text-gray-800 mt-6 text-center">
            Failed to Load Booking
          </Text>
          <Text className="text-base text-gray-600 mt-2 text-center">
            {error || 'Booking not found'}
          </Text>
          <TouchableOpacity
            onPress={fetchBookingDetails}
            className="bg-[#0096c7] rounded-lg px-6 py-3 mt-6"
          >
            <Text className="text-white font-semibold text-base">Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const statusInfo = getStatusInfo(booking.status);
  const StatusIcon = statusInfo.icon;
  const selectedAddOns = getSelectedAddOns();
  
  // Get vehicle image URL
  const getVehicleImageUrl = () => {
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
  
  const vehicleImage = getVehicleImageUrl();

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity onPress={onNavigateBack} className="mr-4">
              <ArrowLeft size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-800">Booking Details</Text>
          </View>
          <View className={`px-3 py-1.5 rounded-full border ${statusInfo.color}`}>
            <Text className="text-xs font-semibold capitalize">{statusInfo.label}</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="px-6 py-6">
          {/* Booking ID */}
          <View className="bg-blue-50 border-2 border-[#0096c7] rounded-lg p-4 mb-4">
            <Text className="text-sm text-gray-600 text-center mb-1">Booking ID</Text>
            <Text className="text-xl font-bold text-[#0096c7] text-center">
              {booking.bookingId}
            </Text>
          </View>

          {/* Status Timeline */}
          {renderStatusTimeline()}

          {/* Vehicle Details */}
          {booking.vehicle && (
            <View className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <Text className="text-base font-semibold text-gray-900 mb-3">Vehicle Details</Text>
              
              {/* Vehicle Image or Placeholder */}
              {vehicleImage ? (
                <Image
                  source={{ 
                    uri: vehicleImage,
                    headers: {
                      'Accept': 'image/*',
                    }
                  }}
                  className="w-full h-48 rounded-lg mb-3"
                  style={{
                    width: '100%',
                    height: 192,
                    borderRadius: 8,
                    backgroundColor: '#E5E7EB'
                  }}
                  resizeMode="cover"
                  onError={(error) => {
                    console.error('[BookingDetailScreen] Image load error:', error.nativeEvent.error);
                  }}
                />
              ) : (
                <View className="w-full h-48 rounded-lg bg-gray-200 items-center justify-center mb-3">
                  <Car size={64} color="#9CA3AF" />
                  <Text className="text-gray-500 mt-2 text-sm">No Image Available</Text>
                </View>
              )}
              <Text className="text-xl font-bold text-gray-900 mb-1">
                {booking.vehicle.name}
              </Text>
              <Text className="text-base text-gray-600 mb-3">
                {booking.vehicle.brand} {booking.vehicle.vehicleModel}
              </Text>
              
              {/* Specifications */}
              {booking.vehicle.specifications && (
                <View className="bg-gray-50 rounded-lg p-3">
                  <View className="flex-row flex-wrap">
                    {booking.vehicle.specifications.engine && (
                      <View className="w-1/2 mb-2">
                        <Text className="text-xs text-gray-500">Engine</Text>
                        <Text className="text-sm font-medium text-gray-900">
                          {booking.vehicle.specifications.engine}
                        </Text>
                      </View>
                    )}
                    {booking.vehicle.specifications.power && (
                      <View className="w-1/2 mb-2">
                        <Text className="text-xs text-gray-500">Power</Text>
                        <Text className="text-sm font-medium text-gray-900">
                          {booking.vehicle.specifications.power}
                        </Text>
                      </View>
                    )}
                    {booking.vehicle.specifications.mileage && (
                      <View className="w-1/2 mb-2">
                        <Text className="text-xs text-gray-500">Mileage</Text>
                        <Text className="text-sm font-medium text-gray-900">
                          {booking.vehicle.specifications.mileage}
                        </Text>
                      </View>
                    )}
                    {booking.vehicle.specifications.color && (
                      <View className="w-1/2 mb-2">
                        <Text className="text-xs text-gray-500">Color</Text>
                        <Text className="text-sm font-medium text-gray-900">
                          {booking.vehicle.specifications.color}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Rental Period */}
          <View className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <Text className="text-base font-semibold text-gray-900 mb-3">Rental Period</Text>
            
            {/* Pickup */}
            <View className="bg-green-50 rounded-lg p-3 mb-3">
              <View className="flex-row items-start">
                <View className="bg-green-100 rounded-full p-2 mr-3">
                  <MapPin size={18} color="#059669" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">Pickup</Text>
                  <View className="flex-row items-center mb-1">
                    <Calendar size={14} color="#6B7280" />
                    <Text className="text-sm font-semibold text-gray-900 ml-2">
                      {formatDate(booking.pickupDate)}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Clock size={14} color="#6B7280" />
                    <Text className="text-sm text-gray-600 ml-2">{booking.pickupTime}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Dropoff */}
            <View className="bg-red-50 rounded-lg p-3 mb-3">
              <View className="flex-row items-start">
                <View className="bg-red-100 rounded-full p-2 mr-3">
                  <MapPin size={18} color="#DC2626" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1">Dropoff</Text>
                  <View className="flex-row items-center mb-1">
                    <Calendar size={14} color="#6B7280" />
                    <Text className="text-sm font-semibold text-gray-900 ml-2">
                      {formatDate(booking.dropoffDate)}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Clock size={14} color="#6B7280" />
                    <Text className="text-sm text-gray-600 ml-2">{booking.dropoffTime}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Duration */}
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600">Total Duration</Text>
              <Text className="text-gray-900 font-semibold">
                {booking.priceBreakdown.duration}{' '}
                {booking.priceBreakdown.duration === 1 ? 'day' : 'days'}
              </Text>
            </View>
          </View>

          {/* Add-ons */}
          {selectedAddOns.length > 0 && (
            <View className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
              <Text className="text-base font-semibold text-gray-900 mb-3">Add-ons</Text>
              {selectedAddOns.map((addOn, index) => (
                <View
                  key={index}
                  className="flex-row justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                >
                  <View className="flex-row items-center">
                    <Package size={16} color="#6B7280" />
                    <Text className="text-gray-900 ml-2">{addOn.name}</Text>
                  </View>
                  <Text className="text-gray-600">
                    Rs. {addOn.rate}/day × {booking.priceBreakdown.duration} days
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Price Breakdown */}
          <View className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <Text className="text-base font-semibold text-gray-900 mb-3">Price Breakdown</Text>
            
            <View className="space-y-2">
              <View className="flex-row justify-between items-center py-2">
                <Text className="text-gray-600">Base Price</Text>
                <Text className="text-gray-900">Rs. {booking.priceBreakdown.basePrice.toFixed(2)}</Text>
              </View>

              {booking.priceBreakdown.durationDiscount > 0 && (
                <View className="flex-row justify-between items-center py-2">
                  <Text className="text-green-600">Duration Discount</Text>
                  <Text className="text-green-600">
                    - Rs. {booking.priceBreakdown.durationDiscount.toFixed(2)}
                  </Text>
                </View>
              )}

              {booking.priceBreakdown.addOnsTotal > 0 && (
                <View className="flex-row justify-between items-center py-2">
                  <Text className="text-gray-600">Add-ons Total</Text>
                  <Text className="text-gray-900">Rs. {booking.priceBreakdown.addOnsTotal.toFixed(2)}</Text>
                </View>
              )}

              <View className="flex-row justify-between items-center py-2">
                <Text className="text-gray-600">VAT (13%)</Text>
                <Text className="text-gray-900">Rs. {booking.priceBreakdown.tax.toFixed(2)}</Text>
              </View>

              <View className="flex-row justify-between items-center py-2">
                <Text className="text-gray-600">Service Fee (5%)</Text>
                <Text className="text-gray-900">Rs. {booking.priceBreakdown.serviceFee.toFixed(2)}</Text>
              </View>

              <View className="border-t border-gray-200 pt-3 mt-2">
                <View className="flex-row justify-between items-center">
                  <Text className="text-lg font-bold text-gray-900">Total Amount</Text>
                  <Text className="text-lg font-bold text-[#0096c7]">
                    Rs. {booking.priceBreakdown.totalPrice.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Payment Information */}
          <View className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <Text className="text-base font-semibold text-gray-900 mb-3">Payment Information</Text>
            
            <View className="flex-row justify-between items-center py-2">
              <Text className="text-gray-600">Payment Status</Text>
              <Text className={`font-semibold capitalize ${getPaymentStatusColor(booking.paymentStatus)}`}>
                {booking.paymentStatus}
              </Text>
            </View>

            {booking.paymentMethod && (
              <View className="flex-row justify-between items-center py-2">
                <Text className="text-gray-600">Payment Method</Text>
                <Text className="text-gray-900">{booking.paymentMethod}</Text>
              </View>
            )}

            {booking.paidAt && (
              <View className="flex-row justify-between items-center py-2">
                <Text className="text-gray-600">Paid At</Text>
                <Text className="text-gray-900">{formatDate(booking.paidAt)}</Text>
              </View>
            )}

            {booking.paymentId && (
              <View className="flex-row justify-between items-center py-2">
                <Text className="text-gray-600">Transaction ID</Text>
                <Text className="text-gray-900 text-xs">{booking.paymentId}</Text>
              </View>
            )}

            {/* Refund Status */}
            {booking.paymentStatus === 'refunded' && (
              <View className="bg-blue-50 rounded-lg p-3 mt-3">
                <Text className="text-blue-900 font-semibold text-sm mb-1">
                  Refund Processed
                </Text>
                <Text className="text-blue-700 text-xs">
                  Your refund has been processed and should appear in your account within 5-7 business days.
                </Text>
              </View>
            )}

            {/* Receipt Download */}
            {booking.paymentStatus === 'completed' && (
              <View className="mt-3">
                {loadingReceipt ? (
                  <View className="bg-gray-100 rounded-lg py-3 items-center">
                    <ActivityIndicator size="small" color="#0096c7" />
                    <Text className="text-gray-600 text-xs mt-1">Loading receipt...</Text>
                  </View>
                ) : receiptUrl ? (
                  <TouchableOpacity
                    className="bg-blue-50 border border-[#0096c7] rounded-lg py-3 items-center flex-row justify-center"
                    onPress={handleDownloadReceipt}
                  >
                    <Download size={18} color="#0096c7" />
                    <Text className="text-[#0096c7] text-sm font-semibold ml-2">
                      Download Receipt
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View className="mb-6">
            {/* Cancel Booking Button */}
            {canCancelBooking() && (
              <TouchableOpacity
                onPress={handleCancelBooking}
                disabled={isCancelling}
                className={`border-2 border-red-500 rounded-lg py-4 items-center mb-3 ${
                  isCancelling ? 'opacity-50' : ''
                }`}
              >
                {isCancelling ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <>
                    <Text className="text-red-500 text-base font-semibold">Cancel Booking</Text>
                    <Text className="text-red-400 text-xs mt-1">
                      Refund will be processed if applicable
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Contact Support Button */}
            <TouchableOpacity
              onPress={handleContactSupport}
              className="bg-gray-100 rounded-lg py-4 items-center flex-row justify-center"
            >
              <Phone size={20} color="#6B7280" />
              <Text className="text-gray-700 text-base font-semibold ml-2">
                Contact Support
              </Text>
            </TouchableOpacity>
          </View>

          {/* Important Information */}
          {booking.status === 'confirmed' && (
            <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <Text className="text-blue-900 font-semibold mb-2">📋 Important Reminders</Text>
              <Text className="text-blue-800 text-sm mb-2">
                • Please arrive at the pickup location on time
              </Text>
              <Text className="text-blue-800 text-sm mb-2">
                • Bring a valid ID and driving license
              </Text>
              <Text className="text-blue-800 text-sm">
                • Contact support if you need to make any changes
              </Text>
            </View>
          )}

          {/* Support Contact */}
          <View className="bg-gray-50 rounded-lg p-4 mb-6">
            <Text className="text-gray-700 text-sm text-center mb-2">
              Need help with this booking?
            </Text>
            <View className="flex-row items-center justify-center mb-1">
              <Mail size={14} color="#6B7280" />
              <Text className="text-[#0096c7] font-semibold text-sm ml-2">
                sayarstha3@gmail.com
              </Text>
            </View>
            <View className="flex-row items-center justify-center">
              <Phone size={14} color="#6B7280" />
              <Text className="text-[#0096c7] font-semibold text-sm ml-2">
                +9779813870131
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default BookingDetailScreen;
