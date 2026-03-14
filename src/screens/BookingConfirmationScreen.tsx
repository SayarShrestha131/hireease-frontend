/**
 * Booking Confirmation Screen
 * 
 * Displays booking details, vehicle information, rental period, selected add-ons,
 * and detailed price breakdown. Allows user to review and confirm booking before payment.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { Calendar, Clock, CheckCircle2 } from 'lucide-react-native';
import bookingService from '../services/bookingService';
import { Vehicle } from '../types/vehicle';
import { AddOns, PriceBreakdown, Booking } from '../types/booking';
import { ErrorDisplay, KYCVerificationModal, AvailabilityConflictAlert } from '../components';
import { useBookingErrorHandler } from '../hooks/useBookingErrorHandler';
import { showError } from '../utils/toast';
import { retryOperation } from '../utils/retry';

interface BookingConfirmationScreenProps {
  route: {
    params: {
      vehicle: Vehicle;
      pickupDate: Date;
      pickupTime: string;
      dropoffDate: Date;
      dropoffTime: string;
      addOns: AddOns;
      priceBreakdown: PriceBreakdown;
    };
  };
  onNavigateToPayment: (booking: Booking) => void;
  onNavigateToKYC: () => void;
  onNavigateBack: () => void;
}

export const BookingConfirmationScreen: React.FC<BookingConfirmationScreenProps> = ({
  route,
  onNavigateToPayment,
  onNavigateToKYC,
  onNavigateBack,
}) => {
  const { vehicle, pickupDate, pickupTime, dropoffDate, dropoffTime, addOns, priceBreakdown } =
    route.params;

  // Error handling hook
  const {
    error,
    showKYCModal,
    kycStatus,
    showAvailabilityAlert,
    conflictingBookings,
    handleError,
    clearError,
    closeKYCModal,
    closeAvailabilityAlert,
  } = useBookingErrorHandler();

  // UI state
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  /**
   * Format date to display string (DD MMM YYYY)
   */
  const formatDate = (date: Date): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  /**
   * Format date to ISO string for API (YYYY-MM-DD)
   */
  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  /**
   * Get selected add-ons as array of names with costs
   */
  const getSelectedAddOns = (): { name: string; cost: number }[] => {
    const selected: { name: string; cost: number }[] = [];
    const addOnRates = {
      helmet: 50,
      gps: 100,
      insurance: 200,
    };

    if (addOns.helmet) {
      selected.push({
        name: 'Helmet',
        cost: addOnRates.helmet * priceBreakdown.duration,
      });
    }
    if (addOns.gps) {
      selected.push({
        name: 'GPS Navigation',
        cost: addOnRates.gps * priceBreakdown.duration,
      });
    }
    if (addOns.insurance) {
      selected.push({
        name: 'Insurance Coverage',
        cost: addOnRates.insurance * priceBreakdown.duration,
      });
    }

    return selected;
  };

  /**
   * Handle booking creation
   */
  const handleCreateBooking = async () => {
    // Clear previous errors
    clearError();

    // Validate terms acceptance
    if (!termsAccepted) {
      Alert.alert(
        'Terms Required',
        'Please accept the terms and conditions to continue.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsCreatingBooking(true);

    try {
      // Use retry mechanism for network resilience
      const booking = await retryOperation(
        () => bookingService.createBooking({
          vehicleId: vehicle._id,
          pickupDate: formatDateForAPI(pickupDate),
          pickupTime,
          dropoffDate: formatDateForAPI(dropoffDate),
          dropoffTime,
          addOns,
        }),
        {
          maxRetries: 2,
          onRetry: (attempt) => {
            console.log(`Retrying booking creation (attempt ${attempt})...`);
          }
        }
      );

      // Navigate to payment screen
      onNavigateToPayment(booking);
    } catch (err) {
      console.error('Booking creation error:', err);
      // Use error handler to show appropriate UI feedback
      handleError(err, () => handleCreateBooking());
    } finally {
      setIsCreatingBooking(false);
    }
  };

  /**
   * Navigate to KYC submission
   */
  const navigateToKYC = () => {
    closeKYCModal();
    onNavigateToKYC();
  };

  /**
   * Handle modify dates action
   */
  const handleModifyDates = () => {
    closeAvailabilityAlert();
    onNavigateBack(); // Go back to booking form
  };

  const selectedAddOns = getSelectedAddOns();
  const vehicleImage = vehicle.images && vehicle.images.length > 0 ? vehicle.images[0] : null;

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 px-6 py-8">
        {/* Header */}
        <View className="mb-6">
          <TouchableOpacity onPress={onNavigateBack} className="mb-3">
            <Text className="text-[#0096c7] text-base">← Back</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900 mb-2">Confirm Booking</Text>
          <Text className="text-base text-gray-600">
            Review your booking details before proceeding to payment
          </Text>
        </View>

        {/* Error Display */}
        <ErrorDisplay 
          error={error} 
          onRetry={handleCreateBooking}
          onDismiss={clearError}
        />

        {/* Vehicle Details */}
        <View className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Vehicle Details</Text>

          {vehicleImage && (
            <Image
              source={{ uri: vehicleImage }}
              className="w-full h-48 rounded-lg mb-3"
              resizeMode="cover"
            />
          )}

          <Text className="text-xl font-bold text-gray-900 mb-1">{vehicle.name}</Text>
          <Text className="text-base text-gray-600 mb-3">
            {vehicle.brand} {vehicle.model} • {vehicle.year}
          </Text>

          {/* Specifications */}
          {vehicle.specifications && (
            <View className="bg-gray-50 rounded-lg p-3">
              <View className="flex-row flex-wrap">
                {vehicle.specifications.engine && (
                  <View className="w-1/2 mb-2">
                    <Text className="text-xs text-gray-500">Engine</Text>
                    <Text className="text-sm text-gray-900">{vehicle.specifications.engine}</Text>
                  </View>
                )}
                {vehicle.specifications.power && (
                  <View className="w-1/2 mb-2">
                    <Text className="text-xs text-gray-500">Power</Text>
                    <Text className="text-sm text-gray-900">{vehicle.specifications.power}</Text>
                  </View>
                )}
                {vehicle.specifications.mileage && (
                  <View className="w-1/2 mb-2">
                    <Text className="text-xs text-gray-500">Mileage</Text>
                    <Text className="text-sm text-gray-900">{vehicle.specifications.mileage}</Text>
                  </View>
                )}
                {vehicle.specifications.color && (
                  <View className="w-1/2 mb-2">
                    <Text className="text-xs text-gray-500">Color</Text>
                    <Text className="text-sm text-gray-900">{vehicle.specifications.color}</Text>
                  </View>
                )}
                <View className="w-1/2 mb-2">
                  <Text className="text-xs text-gray-500">Transmission</Text>
                  <Text className="text-sm text-gray-900 capitalize">{vehicle.transmission}</Text>
                </View>
                <View className="w-1/2 mb-2">
                  <Text className="text-xs text-gray-500">Seats</Text>
                  <Text className="text-sm text-gray-900">{vehicle.seats}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Rental Period */}
        <View className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Rental Period</Text>

          {/* Pickup */}
          <View className="flex-row items-start mb-3">
            <View className="bg-green-100 rounded-full p-2 mr-3">
              <Calendar size={20} color="#059669" />
            </View>
            <View className="flex-1">
              <Text className="text-sm text-gray-500 mb-1">Pickup</Text>
              <Text className="text-base font-semibold text-gray-900">
                {formatDate(pickupDate)}
              </Text>
              <View className="flex-row items-center mt-1">
                <Clock size={14} color="#6B7280" />
                <Text className="text-sm text-gray-600 ml-1">{pickupTime}</Text>
              </View>
            </View>
          </View>

          {/* Dropoff */}
          <View className="flex-row items-start">
            <View className="bg-red-100 rounded-full p-2 mr-3">
              <Calendar size={20} color="#DC2626" />
            </View>
            <View className="flex-1">
              <Text className="text-sm text-gray-500 mb-1">Dropoff</Text>
              <Text className="text-base font-semibold text-gray-900">
                {formatDate(dropoffDate)}
              </Text>
              <View className="flex-row items-center mt-1">
                <Clock size={14} color="#6B7280" />
                <Text className="text-sm text-gray-600 ml-1">{dropoffTime}</Text>
              </View>
            </View>
          </View>

          {/* Duration */}
          <View className="bg-blue-50 rounded-lg p-3 mt-3">
            <Text className="text-sm text-gray-600">
              Total Duration:{' '}
              <Text className="font-semibold text-[#0096c7]">
                {priceBreakdown.duration} {priceBreakdown.duration === 1 ? 'day' : 'days'}
              </Text>
            </Text>
          </View>
        </View>

        {/* Selected Add-ons */}
        {selectedAddOns.length > 0 && (
          <View className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Selected Add-ons</Text>
            {selectedAddOns.map((addOn, index) => (
              <View
                key={index}
                className="flex-row justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
              >
                <View className="flex-row items-center flex-1">
                  <CheckCircle2 size={18} color="#059669" />
                  <Text className="text-base text-gray-900 ml-2">{addOn.name}</Text>
                </View>
                <Text className="text-base font-semibold text-gray-900">
                  Rs. {addOn.cost.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Price Breakdown */}
        <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Price Breakdown</Text>

          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">
              Base Price ({priceBreakdown.duration} {priceBreakdown.duration === 1 ? 'day' : 'days'})
            </Text>
            <Text className="text-gray-900">Rs. {priceBreakdown.basePrice.toFixed(2)}</Text>
          </View>

          {priceBreakdown.durationDiscount > 0 && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-green-600">Duration Discount</Text>
              <Text className="text-green-600">
                - Rs. {priceBreakdown.durationDiscount.toFixed(2)}
              </Text>
            </View>
          )}

          {priceBreakdown.addOnsTotal > 0 && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Add-ons Total</Text>
              <Text className="text-gray-900">Rs. {priceBreakdown.addOnsTotal.toFixed(2)}</Text>
            </View>
          )}

          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">VAT (13%)</Text>
            <Text className="text-gray-900">Rs. {priceBreakdown.tax.toFixed(2)}</Text>
          </View>

          <View className="flex-row justify-between mb-3">
            <Text className="text-gray-600">Service Fee (5%)</Text>
            <Text className="text-gray-900">Rs. {priceBreakdown.serviceFee.toFixed(2)}</Text>
          </View>

          <View className="border-t border-blue-300 pt-3">
            <View className="flex-row justify-between">
              <Text className="text-xl font-bold text-gray-900">Total Amount</Text>
              <Text className="text-xl font-bold text-[#0096c7]">
                Rs. {priceBreakdown.totalPrice.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Terms and Conditions */}
        <TouchableOpacity
          className="flex-row items-start mb-6"
          onPress={() => setTermsAccepted(!termsAccepted)}
        >
          <View
            className={`w-6 h-6 rounded border-2 items-center justify-center mr-3 mt-0.5 ${
              termsAccepted ? 'bg-[#0096c7] border-[#0096c7]' : 'border-gray-300'
            }`}
          >
            {termsAccepted && <Text className="text-white text-xs">✓</Text>}
          </View>
          <Text className="flex-1 text-sm text-gray-700">
            I agree to the{' '}
            <Text className="text-[#0096c7] font-semibold">terms and conditions</Text> and{' '}
            <Text className="text-[#0096c7] font-semibold">cancellation policy</Text>. I understand
            that I must have valid KYC verification to complete this booking.
          </Text>
        </TouchableOpacity>

        {/* Confirm Booking Button */}
        <TouchableOpacity
          className={`rounded-lg py-4 items-center mb-4 ${
            isCreatingBooking || !termsAccepted ? 'bg-gray-400' : 'bg-[#0096c7]'
          }`}
          onPress={handleCreateBooking}
          disabled={isCreatingBooking || !termsAccepted}
        >
          {isCreatingBooking ? (
            <View className="flex-row items-center">
              <ActivityIndicator color="#FFFFFF" />
              <Text className="text-white text-base font-semibold ml-2">Creating Booking...</Text>
            </View>
          ) : (
            <Text className="text-white text-base font-semibold">Confirm & Proceed to Payment</Text>
          )}
        </TouchableOpacity>

        {/* Info Text */}
        <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <Text className="text-yellow-800 text-sm">
            ℹ️ Your booking will be created with "pending" status. You'll need to complete payment
            to confirm your reservation.
          </Text>
        </View>
      </View>

      {/* KYC Verification Modal */}
      <KYCVerificationModal
        visible={showKYCModal}
        onClose={closeKYCModal}
        onNavigateToKYC={navigateToKYC}
        kycStatus={kycStatus}
      />

      {/* Availability Conflict Alert */}
      <AvailabilityConflictAlert
        visible={showAvailabilityAlert}
        onClose={closeAvailabilityAlert}
        onModifyDates={handleModifyDates}
        conflictingBookings={conflictingBookings}
      />
    </ScrollView>
  );
};
