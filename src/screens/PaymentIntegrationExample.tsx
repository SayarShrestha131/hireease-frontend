/**
 * Payment Integration Example
 * 
 * This file demonstrates how to integrate all payment components
 * into a complete payment flow for a booking.
 * 
 * Usage:
 * 1. User confirms booking on BookingConfirmationScreen
 * 2. Navigate to this screen with booking data
 * 3. User selects payment method
 * 4. Navigate to appropriate payment screen (Khalti/Stripe/PayPal)
 * 5. Handle payment completion and navigate to success screen
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { PaymentMethodSelector, PaymentErrorHandler } from '../components';
import { PaymentMethod } from '../types/payment';
import { Booking } from '../types/booking';

interface PaymentIntegrationExampleProps {
  route: {
    params: {
      booking: Booking;
    };
  };
  // Navigation functions (replace with actual navigation)
  onNavigateToKhalti: (booking: Booking) => void;
  onNavigateToStripe: (booking: Booking) => void;
  onNavigateToPayPal: (booking: Booking) => void;
  onCancel: () => void;
}

const PaymentIntegrationExample: React.FC<PaymentIntegrationExampleProps> = ({
  route,
  onNavigateToKhalti,
  onNavigateToStripe,
  onNavigateToPayPal,
  onCancel,
}) => {
  const { booking } = route.params;
  
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | undefined>();

  const handleProceedToPayment = () => {
    if (!selectedMethod) {
      Alert.alert('Payment Method Required', 'Please select a payment method to continue.');
      return;
    }

    // Navigate to appropriate payment screen based on selected method
    switch (selectedMethod) {
      case 'khalti':
        onNavigateToKhalti(booking);
        break;
      case 'stripe':
        onNavigateToStripe(booking);
        break;
      case 'paypal':
        onNavigateToPayPal(booking);
        break;
    }
  };

  const handleRetry = () => {
    setError(null);
    setErrorCode(undefined);
  };

  const handleChangePaymentMethod = () => {
    setSelectedMethod(null);
    setError(null);
    setErrorCode(undefined);
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Email: support@hireease.com\nPhone: +977-1-234567',
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="px-6 py-8">
        {/* Header */}
        <View className="mb-6">
          <TouchableOpacity onPress={onCancel} className="mb-3">
            <Text className="text-[#0096c7] text-base">← Back</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Complete Payment
          </Text>
          <Text className="text-base text-gray-600">
            Select your preferred payment method to complete your booking
          </Text>
        </View>

        {/* Booking Summary */}
        <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <Text className="text-sm text-gray-600 mb-1">Booking ID</Text>
          <Text className="text-base font-semibold text-gray-900 mb-3">
            {booking.bookingId}
          </Text>
          
          <Text className="text-sm text-gray-600 mb-1">Amount to Pay</Text>
          <Text className="text-2xl font-bold text-[#0096c7]">
            Rs. {booking.priceBreakdown.totalPrice.toFixed(2)}
          </Text>
        </View>

        {/* Error Display */}
        {error && (
          <View className="mb-6">
            <PaymentErrorHandler
              error={error}
              errorCode={errorCode}
              currentPaymentMethod={selectedMethod || undefined}
              onRetry={handleRetry}
              onChangePaymentMethod={handleChangePaymentMethod}
              onContactSupport={handleContactSupport}
              onDismiss={() => setError(null)}
            />
          </View>
        )}

        {/* Payment Method Selector */}
        <View className="mb-6">
          <PaymentMethodSelector
            selectedMethod={selectedMethod}
            onSelectMethod={setSelectedMethod}
            disabled={false}
          />
        </View>

        {/* Proceed Button */}
        <TouchableOpacity
          className={`rounded-lg py-4 items-center mb-4 ${
            !selectedMethod ? 'bg-gray-400' : 'bg-[#0096c7]'
          }`}
          onPress={handleProceedToPayment}
          disabled={!selectedMethod}
        >
          <Text className="text-white text-base font-semibold">
            Proceed to Payment
          </Text>
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          className="bg-gray-200 rounded-lg py-4 items-center"
          onPress={onCancel}
        >
          <Text className="text-gray-700 text-base font-semibold">
            Cancel
          </Text>
        </TouchableOpacity>

        {/* Security Notice */}
        <View className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
          <Text className="text-green-800 text-sm">
            🔒 Your payment is secure and encrypted. We never store your card details.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default PaymentIntegrationExample;

/**
 * INTEGRATION GUIDE
 * 
 * 1. Payment Flow Navigation:
 * 
 * BookingConfirmationScreen
 *   → PaymentIntegrationExample (select method)
 *   → KhaltiPaymentScreen / StripePaymentScreen / PayPalPaymentScreen
 *   → PaymentStatusScreen (polling)
 *   → BookingSuccessScreen (on success)
 * 
 * 2. Required Navigation Setup:
 * 
 * In your navigation stack, add these screens:
 * - PaymentSelection (this example)
 * - KhaltiPayment
 * - StripePayment
 * - PayPalPayment
 * - PaymentStatus
 * 
 * 3. Deep Linking Setup (for Khalti and PayPal):
 * 
 * In app.json, add:
 * {
 *   "expo": {
 *     "scheme": "hireease",
 *     "ios": {
 *       "bundleIdentifier": "com.hireease.app"
 *     },
 *     "android": {
 *       "package": "com.hireease.app"
 *     }
 *   }
 * }
 * 
 * 4. Payment History Access:
 * 
 * Add PaymentHistoryScreen to your profile or bookings section:
 * <PaymentHistoryScreen onBack={() => navigation.goBack()} />
 * 
 * 5. Error Handling:
 * 
 * Use PaymentErrorHandler component anywhere you need to display payment errors:
 * <PaymentErrorHandler
 *   error="Payment failed"
 *   errorCode="INSUFFICIENT_FUNDS"
 *   onRetry={handleRetry}
 *   onChangePaymentMethod={handleChangeMethod}
 * />
 */
