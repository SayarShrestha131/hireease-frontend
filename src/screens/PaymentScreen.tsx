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
  Linking,
} from 'react-native';
import {
  CreditCard,
  Wallet,
  Building2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import bookingService from '../services/bookingService';
import paymentService from '../services/paymentService';
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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('esewa');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Payment method options with icons and descriptions
   * Currently only eSewa payment is available
   */
  const paymentMethods: PaymentMethodOption[] = [
    {
      id: 'esewa',
      name: 'eSewa',
      description: 'Pay securely with eSewa digital wallet',
      icon: <Wallet size={24} color="#60BB46" />,
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
   * Handle payment confirmation - Initiate eSewa payment
   */
  const handleConfirmPayment = async () => {
    // Clear previous errors
    setError(null);

    // Show confirmation dialog
    Alert.alert(
      'Proceed to eSewa Payment',
      `You will be redirected to eSewa to complete payment of Rs. ${booking.priceBreakdown.totalPrice.toFixed(2)}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Continue',
          onPress: async () => {
            setIsProcessing(true);

            try {
              console.log('💳 [PaymentScreen] Initiating payment for booking:', booking.bookingId);
              console.log('📋 [PaymentScreen] Booking details:', {
                bookingId: booking.bookingId,
                _id: booking._id,
                totalPrice: booking.priceBreakdown.totalPrice,
              });

              // Initiate payment with eSewa using bookingId (not _id)
              const response = await paymentService.initiatePayment({
                bookingId: booking.bookingId, // Use bookingId (e.g., "BK-20260502-4862")
                paymentMethod: 'esewa',
                returnUrl: 'myapp://payment/verify', // Deep link for return
              });

              console.log('✅ [PaymentScreen] Payment initiated:', response);

              if (response.success && response.data) {
                // Store transaction ID and bookingId for verification later
                await AsyncStorage.setItem('pendingTransactionId', response.data.transactionId);
                await AsyncStorage.setItem('pendingBookingId', booking.bookingId); // Store bookingId

                console.log('💾 [PaymentScreen] Stored transaction data');

                // Open eSewa payment URL
                const canOpen = await Linking.canOpenURL(response.data.paymentUrl);
                
                if (canOpen) {
                  console.log('🌐 [PaymentScreen] Opening eSewa URL:', response.data.paymentUrl);
                  await Linking.openURL(response.data.paymentUrl);
                  
                  showSuccess('Redirecting to eSewa...');
                  
                  // Show info to user
                  Alert.alert(
                    'Complete Payment on eSewa',
                    'You will be redirected back to the app after payment completion.',
                    [{ text: 'OK' }]
                  );
                } else {
                  throw new Error('Cannot open eSewa payment page');
                }
              } else {
                throw new Error(response.error || 'Failed to initiate payment');
              }
            } catch (error) {
              console.error('❌ [PaymentScreen] Payment initiation error:', error);
              const errorMessage = error instanceof Error ? error.message : 'Failed to initiate payment';
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
        <View className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex-row">
          <AlertCircle size={20} color="#60BB46" />
          <View className="flex-1 ml-3">
            <Text className="text-green-800 text-sm font-semibold mb-1">
              eSewa Payment Information
            </Text>
            <Text className="text-green-700 text-sm">
              You will be redirected to eSewa's secure payment page. Use your eSewa ID and password to complete the payment.
            </Text>
            <Text className="text-green-600 text-xs mt-2">
              Test credentials: eSewa ID: 9806800001, Password: Nepal@123, MPIN: 1234
            </Text>
          </View>
        </View>

        {/* Confirm Payment Button */}
        <TouchableOpacity
          className={`rounded-lg py-4 items-center mb-4 ${
            isProcessing ? 'bg-gray-400' : 'bg-[#60BB46]'
          }`}
          onPress={handleConfirmPayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <View className="flex-row items-center">
              <ActivityIndicator color="#FFFFFF" />
              <Text className="text-white text-base font-semibold ml-2">Initiating Payment...</Text>
            </View>
          ) : (
            <Text className="text-white text-base font-semibold">
              Pay with eSewa - Rs. {booking.priceBreakdown.totalPrice.toFixed(2)}
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
