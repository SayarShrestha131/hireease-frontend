/**
 * Booking Success Screen
 * 
 * Displays success confirmation after payment completion with booking details.
 * Provides navigation options to view booking details, bookings list, or return home.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Linking,
} from 'react-native';
import {
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  Home,
  FileText,
  List,
  Download,
} from 'lucide-react-native';
import { Booking } from '../types/booking';
import paymentService from '../services/paymentService';

interface BookingSuccessScreenProps {
  route: {
    params: {
      booking: Booking;
    };
  };
  onNavigateToBookingDetails: (bookingId: string) => void;
  onNavigateToBookingsList: () => void;
  onNavigateToHome: () => void;
}

export const BookingSuccessScreen: React.FC<BookingSuccessScreenProps> = ({
  route,
  onNavigateToBookingDetails,
  onNavigateToBookingsList,
  onNavigateToHome,
}) => {
  const { booking } = route.params;

  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  /**
   * Fetch receipt on mount if payment is completed
   * Note: Receipts are available for completed Khalti payments
   */
  useEffect(() => {
    // Fetch receipt if payment is completed
    if (booking.paymentStatus === 'completed') {
      fetchReceipt();
    }
  }, [booking._id, booking.paymentStatus]);

  /**
   * Fetch receipt from API
   */
  const fetchReceipt = async () => {
    try {
      setLoadingReceipt(true);
      const response = await paymentService.getReceipt(booking.bookingId);
      setReceiptUrl(response.data.receiptUrl);
    } catch (error: any) {
      console.error('Failed to fetch receipt:', error);
      // Don't show error to user - receipt is optional
      // The button simply won't appear if receipt can't be fetched
      if (error.response?.status === 401) {
        console.log('Authentication required for receipt - user may need to log in again');
      } else if (error.response?.status === 404) {
        console.log('Receipt not yet available for this booking');
      }
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
      }
    }
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
   * Get selected add-ons as array of names
   */
  const getSelectedAddOns = (): string[] => {
    const selected: string[] = [];
    if (booking.addOns.helmet) selected.push('Helmet');
    if (booking.addOns.gps) selected.push('GPS Navigation');
    if (booking.addOns.insurance) selected.push('Insurance Coverage');
    return selected;
  };

  const selectedAddOns = getSelectedAddOns();
  const vehicleImage = booking.vehicle?.images && booking.vehicle.images.length > 0 
    ? booking.vehicle.images[0] 
    : null;

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 px-6 py-8">
        {/* Success Animation/Icon */}
        <View className="items-center mb-8">
          <View className="bg-green-100 rounded-full p-6 mb-4">
            <CheckCircle size={64} color="#059669" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Booking Confirmed!
          </Text>
          <Text className="text-base text-gray-600 text-center">
            Your vehicle has been successfully reserved
          </Text>
        </View>

        {/* Booking ID - Prominently Displayed */}
        <View className="bg-blue-50 border-2 border-[#0096c7] rounded-lg p-4 mb-6">
          <Text className="text-sm text-gray-600 text-center mb-1">Booking ID</Text>
          <Text className="text-2xl font-bold text-[#0096c7] text-center">
            {booking.bookingId}
          </Text>
          <Text className="text-xs text-gray-500 text-center mt-2">
            Save this ID for future reference
          </Text>
        </View>

        {/* Booking Summary */}
        <View className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</Text>

          {/* Vehicle Details */}
          {booking.vehicle && (
            <View className="mb-4">
              {vehicleImage && (
                <Image
                  source={{ uri: vehicleImage }}
                  className="w-full h-40 rounded-lg mb-3"
                  resizeMode="cover"
                />
              )}
              <Text className="text-xl font-bold text-gray-900 mb-1">
                {booking.vehicle.name}
              </Text>
              <Text className="text-base text-gray-600">
                {booking.vehicle.brand} {booking.vehicle.vehicleModel}
              </Text>
            </View>
          )}

          {/* Rental Period */}
          <View className="bg-gray-50 rounded-lg p-3 mb-3">
            {/* Pickup */}
            <View className="flex-row items-start mb-3">
              <View className="bg-green-100 rounded-full p-2 mr-3">
                <MapPin size={18} color="#059669" />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-500 mb-1">Pickup</Text>
                <View className="flex-row items-center">
                  <Calendar size={14} color="#6B7280" />
                  <Text className="text-sm font-semibold text-gray-900 ml-1">
                    {formatDate(booking.pickupDate)}
                  </Text>
                </View>
                <View className="flex-row items-center mt-1">
                  <Clock size={14} color="#6B7280" />
                  <Text className="text-sm text-gray-600 ml-1">{booking.pickupTime}</Text>
                </View>
              </View>
            </View>

            {/* Dropoff */}
            <View className="flex-row items-start">
              <View className="bg-red-100 rounded-full p-2 mr-3">
                <MapPin size={18} color="#DC2626" />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-500 mb-1">Dropoff</Text>
                <View className="flex-row items-center">
                  <Calendar size={14} color="#6B7280" />
                  <Text className="text-sm font-semibold text-gray-900 ml-1">
                    {formatDate(booking.dropoffDate)}
                  </Text>
                </View>
                <View className="flex-row items-center mt-1">
                  <Clock size={14} color="#6B7280" />
                  <Text className="text-sm text-gray-600 ml-1">{booking.dropoffTime}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Duration */}
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-600">Duration</Text>
            <Text className="text-gray-900 font-semibold">
              {booking.priceBreakdown.duration}{' '}
              {booking.priceBreakdown.duration === 1 ? 'day' : 'days'}
            </Text>
          </View>

          {/* Add-ons */}
          {selectedAddOns.length > 0 && (
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-600">Add-ons</Text>
              <Text className="text-gray-900 font-semibold">
                {selectedAddOns.join(', ')}
              </Text>
            </View>
          )}

          {/* Total Amount */}
          <View className="border-t border-gray-200 pt-3 mt-2">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-bold text-gray-900">Total Paid</Text>
              <Text className="text-lg font-bold text-[#0096c7]">
                Rs. {booking.priceBreakdown.totalPrice.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Payment Status */}
          <View className={`rounded-lg p-3 mt-3 ${
            booking.paymentStatus === 'completed' ? 'bg-green-50' : 
            booking.paymentStatus === 'pending' ? 'bg-yellow-50' : 'bg-red-50'
          }`}>
            <View className="flex-row items-center justify-center">
              <CheckCircle size={16} color={
                booking.paymentStatus === 'completed' ? '#059669' :
                booking.paymentStatus === 'pending' ? '#D97706' : '#DC2626'
              } />
              <Text className={`font-semibold ml-2 ${
                booking.paymentStatus === 'completed' ? 'text-green-700' :
                booking.paymentStatus === 'pending' ? 'text-yellow-700' : 'text-red-700'
              }`}>
                {booking.paymentStatus === 'completed' ? 'Payment Completed' :
                 booking.paymentStatus === 'pending' ? 'Payment Pending' :
                 booking.paymentStatus === 'failed' ? 'Payment Failed' : 'Payment Status Unknown'}
              </Text>
            </View>
            {booking.paymentMethod && (
              <Text className={`text-sm text-center mt-1 ${
                booking.paymentStatus === 'completed' ? 'text-green-600' :
                booking.paymentStatus === 'pending' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                via {booking.paymentMethod}
              </Text>
            )}
          </View>
        </View>

        {/* Receipt Download Button */}
        {booking.paymentStatus === 'completed' && (
          <View className="mb-6">
            {loadingReceipt ? (
              <View className="bg-gray-100 rounded-lg py-4 items-center">
                <ActivityIndicator size="small" color="#0096c7" />
                <Text className="text-gray-600 text-sm mt-2">Loading receipt...</Text>
              </View>
            ) : receiptUrl ? (
              <TouchableOpacity
                className="bg-white border-2 border-[#0096c7] rounded-lg py-4 items-center flex-row justify-center"
                onPress={handleDownloadReceipt}
              >
                <Download size={20} color="#0096c7" />
                <Text className="text-[#0096c7] text-base font-semibold ml-2">
                  Download Receipt
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {/* Action Buttons */}
        <View className="mb-6">
          {/* View Booking Details */}
          <TouchableOpacity
            className="bg-[#0096c7] rounded-lg py-4 items-center mb-3 flex-row justify-center"
            onPress={() => onNavigateToBookingDetails(booking._id)}
          >
            <FileText size={20} color="#FFFFFF" />
            <Text className="text-white text-base font-semibold ml-2">
              View Booking Details
            </Text>
          </TouchableOpacity>

          {/* View All Bookings */}
          <TouchableOpacity
            className="bg-white border-2 border-[#0096c7] rounded-lg py-4 items-center mb-3 flex-row justify-center"
            onPress={onNavigateToBookingsList}
          >
            <List size={20} color="#0096c7" />
            <Text className="text-[#0096c7] text-base font-semibold ml-2">
              View All Bookings
            </Text>
          </TouchableOpacity>

          {/* Return to Home */}
          <TouchableOpacity
            className="bg-gray-100 rounded-lg py-4 items-center flex-row justify-center"
            onPress={onNavigateToHome}
          >
            <Home size={20} color="#6B7280" />
            <Text className="text-gray-700 text-base font-semibold ml-2">
              Return to Home
            </Text>
          </TouchableOpacity>
        </View>

        {/* Important Information */}
        <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <Text className="text-blue-900 font-semibold mb-2">📋 Important Information</Text>
          <Text className="text-blue-800 text-sm mb-2">
            • Please arrive at the pickup location on time
          </Text>
          <Text className="text-blue-800 text-sm mb-2">
            • Bring a valid ID and driving license
          </Text>
          <Text className="text-blue-800 text-sm mb-2">
            • A confirmation email has been sent to your registered email
          </Text>
          <Text className="text-blue-800 text-sm">
            • Contact support if you need to make any changes
          </Text>
        </View>

        {/* Contact Support */}
        <View className="bg-gray-50 rounded-lg p-4 mb-6">
          <Text className="text-gray-700 text-sm text-center">
            Need help? Contact our support team
          </Text>
          <Text className="text-[#0096c7] font-semibold text-center mt-1">
            sayarstha3@gmail.com
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};
