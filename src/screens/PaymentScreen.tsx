/**
 * Payment Screen
 * 
 * Allows users to select a payment method and confirm payment for their booking.
 * Displays booking summary and total amount. Handles payment confirmation API call
 * and navigates to success screen on completion.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  CreditCard,
  Wallet,
  Building2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import bookingService from '../services/bookingService';
import { Booking, PaymentMethod } from '../types/booking';
import { ErrorMessage } from '../components/ErrorMessage';
import { showError, showSuccess } from '../utils/toast';

interface PaymentScreenProps {
  route: {
    params: {
      booking: Booking;
    };
  };
  onNavigateToSuccess: (booking: Booking) => void;
  onNavigateBack: () => void;
}

/**
 * Payment method option interface
 */
interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
}

export const PaymentScreen: React.FC<PaymentScreenProps> = ({
  route,
  onNavigateToSuccess,
  onNavigateBack,
}) => {
  const { booking } = route.params;

  // UI state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('Direct');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Payment method options with icons and descriptions
   */
  const paymentMethods: PaymentMethodOption[] = [
    {
      id: 'eSewa',
      name: 'eSewa',
      description: 'Pay securely with eSewa wallet',
      icon: <Wallet size={24} color="#60A917" />,
      available: true,
    },
    {
      id: 'Khalti',
      name: 'Khalti',
      description: 'Pay securely with Khalti wallet',
      icon: <Wallet size={24} color="#5D2E8E" />,
      available: true,
    },
    {
      id: 'Card',
      name: 'Credit/Debit Card',
      description: 'Pay with Visa, Mastercard, or other cards',
      icon: <CreditCard size={24} color="#0096c7" />,
      available: true,
    },
    {
      id: 'Direct',
      name: 'Direct Payment',
      description: 'Pay directly at our office',
      icon: <Building2 size={24} color="#6B7280" />,
      available: true,
    },
  ];

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

  /**
   * Handle payment method selection
   */
  const handleSelectPaymentMethod = (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    setError(null);
  };

  /**
   * Handle payment confirmation
   */
  const handleConfirmPayment = async () => {
    // Clear previous errors
    setError(null);

    // Show confirmation dialog
    Alert.alert(
      'Confirm Payment',
      `Are you sure you want to proceed with payment of Rs. ${booking.priceBreakdown.totalPrice.toFixed(2)} via ${selectedPaymentMethod}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: async () => {
            setIsProcessing(true);

            try {
              const updatedBooking = await bookingService.confirmPayment(booking._id, {
                paymentMethod: selectedPaymentMethod,
                paymentId: `${selectedPaymentMethod.toUpperCase()}-${Date.now()}`, // Mock payment ID
              });

              showSuccess('Payment confirmed successfully!');
              
              // Navigate to success screen
              onNavigateToSuccess(updatedBooking);
            } catch (error) {
              console.error('Payment confirmation error:', error);
              const errorMessage = error instanceof Error ? error.message : 'Failed to confirm payment';
              setError(errorMessage);
              showError(errorMessage);
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  /**
   * Handle retry after error
   */
  const handleRetry = () => {
    setError(null);
    handleConfirmPayment();
  };

  const selectedAddOns = getSelectedAddOns();

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 px-6 py-8">
        {/* Header */}
        <View className="mb-6">
          <TouchableOpacity onPress={onNavigateBack} className="mb-3">
            <Text className="text-[#0096c7] text-base">← Back</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900 mb-2">Payment</Text>
          <Text className="text-base text-gray-600">
            Select your preferred payment method and confirm
          </Text>
        </View>

        {/* Error Message with Retry */}
        {error && (
          <View className="mb-6">
            <ErrorMessage message={error} onDismiss={() => setError(null)} />
            <TouchableOpacity
              className="mt-3 bg-[#0096c7] rounded-lg py-3 items-center"
              onPress={handleRetry}
              disabled={isProcessing}
            >
              <Text className="text-white text-base font-semibold">Retry Payment</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Booking Summary */}
        <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Booking Summary</Text>

          {/* Booking ID */}
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Booking ID</Text>
            <Text className="text-gray-900 font-semibold">{booking.bookingId}</Text>
          </View>

          {/* Vehicle Name */}
          {booking.vehicle && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Vehicle</Text>
              <Text className="text-gray-900 font-semibold">{booking.vehicle.name}</Text>
            </View>
          )}

          {/* Rental Period */}
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Pickup</Text>
            <Text className="text-gray-900">
              {formatDate(booking.pickupDate)} {booking.pickupTime}
            </Text>
          </View>

          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Dropoff</Text>
            <Text className="text-gray-900">
              {formatDate(booking.dropoffDate)} {booking.dropoffTime}
            </Text>
          </View>

          {/* Duration */}
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Duration</Text>
            <Text className="text-gray-900">
              {booking.priceBreakdown.duration}{' '}
              {booking.priceBreakdown.duration === 1 ? 'day' : 'days'}
            </Text>
          </View>

          {/* Add-ons */}
          {selectedAddOns.length > 0 && (
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Add-ons</Text>
              <Text className="text-gray-900">{selectedAddOns.join(', ')}</Text>
            </View>
          )}

          {/* Total Amount */}
          <View className="border-t border-blue-300 pt-3 mt-2">
            <View className="flex-row justify-between">
              <Text className="text-xl font-bold text-gray-900">Total Amount</Text>
              <Text className="text-xl font-bold text-[#0096c7]">
                Rs. {booking.priceBreakdown.totalPrice.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Method Selection */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Select Payment Method</Text>

          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              className={`border-2 rounded-lg p-4 mb-3 ${
                selectedPaymentMethod === method.id
                  ? 'border-[#0096c7] bg-blue-50'
                  : 'border-gray-200 bg-white'
              } ${!method.available ? 'opacity-50' : ''}`}
              onPress={() => method.available && handleSelectPaymentMethod(method.id)}
              disabled={!method.available || isProcessing}
            >
              <View className="flex-row items-center">
                {/* Icon */}
                <View className="mr-3">{method.icon}</View>

                {/* Method Info */}
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900 mb-1">
                    {method.name}
                  </Text>
                  <Text className="text-sm text-gray-600">{method.description}</Text>
                  {!method.available && (
                    <Text className="text-xs text-red-600 mt-1">Currently unavailable</Text>
                  )}
                </View>

                {/* Selection Indicator */}
                {selectedPaymentMethod === method.id && (
                  <CheckCircle2 size={24} color="#0096c7" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Payment Info Notice */}
        <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex-row">
          <AlertCircle size={20} color="#D97706" />
          <View className="flex-1 ml-3">
            <Text className="text-yellow-800 text-sm">
              This is a simplified payment flow for MVP. In production, you will be redirected to
              the payment gateway for secure payment processing.
            </Text>
          </View>
        </View>

        {/* Confirm Payment Button */}
        <TouchableOpacity
          className={`rounded-lg py-4 items-center mb-4 ${
            isProcessing ? 'bg-gray-400' : 'bg-[#0096c7]'
          }`}
          onPress={handleConfirmPayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <View className="flex-row items-center">
              <ActivityIndicator color="#FFFFFF" />
              <Text className="text-white text-base font-semibold ml-2">Processing Payment...</Text>
            </View>
          ) : (
            <Text className="text-white text-base font-semibold">
              Confirm Payment - Rs. {booking.priceBreakdown.totalPrice.toFixed(2)}
            </Text>
          )}
        </TouchableOpacity>

        {/* Security Notice */}
        <View className="bg-gray-50 rounded-lg p-4 mb-6">
          <Text className="text-gray-600 text-sm text-center">
            🔒 Your payment information is secure and encrypted
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};
