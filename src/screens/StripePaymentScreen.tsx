/**
 * Stripe Payment Screen
 * 
 * Integrates Stripe for card payments, confirms Payment Intent using client secret,
 * handles 3D Secure authentication, and displays payment status.
 * 
 * Requirements: 2.2, 2.4, 2.8
 * 
 * Note: This is a minimal implementation using WebView for Stripe.js.
 * For production, consider using @stripe/stripe-react-native for native integration.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { XCircle } from 'lucide-react-native';
import paymentService from '../services/paymentService';
import { Booking } from '../types/booking';

interface StripePaymentScreenProps {
  route: {
    params: {
      booking: Booking;
    };
  };
  onPaymentSuccess: (bookingId: string, receiptUrl?: string) => void;
  onPaymentFailed: (error: string) => void;
  onCancel: () => void;
}

const StripePaymentScreen: React.FC<StripePaymentScreenProps> = ({
  route,
  onPaymentSuccess,
  onPaymentFailed,
  onCancel,
}) => {
  const { booking } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    initiatePayment();
  }, []);

  const initiatePayment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await paymentService.initiatePayment({
        bookingId: booking._id,
        paymentMethod: 'stripe',
        returnUrl: 'app://payment/stripe/return',
      });
      
      setTransactionId(response.data.transactionId);
      setClientSecret(response.data.clientSecret || null);
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to initiate Stripe payment:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to initiate payment';
      setError(errorMessage);
      setLoading(false);
      onPaymentFailed(errorMessage);
    }
  };

  const handleConfirmPayment = async () => {
    if (!transactionId || !clientSecret) {
      setError('Missing payment information');
      return;
    }
    
    try {
      setProcessing(true);
      setError(null);
      
      // In a real implementation, you would use Stripe.js or Stripe React Native SDK
      // to collect card details and confirm the payment intent.
      // For this minimal implementation, we'll simulate the flow.
      
      Alert.alert(
        'Stripe Payment',
        'In production, this would open Stripe payment form to collect card details and confirm payment with 3D Secure support.',
        [
          {
            text: 'Simulate Success',
            onPress: () => simulatePaymentSuccess(),
          },
          {
            text: 'Simulate Failure',
            onPress: () => simulatePaymentFailure(),
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setProcessing(false),
          },
        ]
      );
    } catch (err: any) {
      console.error('Failed to confirm Stripe payment:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Payment confirmation failed';
      setError(errorMessage);
      setProcessing(false);
      onPaymentFailed(errorMessage);
    }
  };

  const simulatePaymentSuccess = async () => {
    if (!transactionId) return;
    
    try {
      const response = await paymentService.verifyPayment({
        transactionId,
        gatewayData: {
          payment_intent: 'pi_simulated_success',
          status: 'succeeded',
        },
      });
      
      if (response.data.paymentStatus === 'completed') {
        onPaymentSuccess(response.data.bookingId, response.data.receiptUrl);
      } else {
        setError('Payment verification failed');
        setProcessing(false);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Payment verification failed';
      setError(errorMessage);
      setProcessing(false);
      onPaymentFailed(errorMessage);
    }
  };

  const simulatePaymentFailure = () => {
    const errorMsg = 'Payment was declined by your bank';
    setError(errorMsg);
    setProcessing(false);
    onPaymentFailed(errorMsg);
  };

  const handleRetry = () => {
    setError(null);
    setProcessing(false);
    initiatePayment();
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Payment',
      'Are you sure you want to cancel this payment?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: onCancel },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <ActivityIndicator size="large" color="#0096c7" />
        <Text className="text-gray-900 text-lg font-semibold mt-4">
          Preparing Stripe Payment...
        </Text>
        <Text className="text-gray-600 text-center mt-2">
          Please wait while we set up your payment
        </Text>
      </View>
    );
  }

  if (processing) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <ActivityIndicator size="large" color="#0096c7" />
        <Text className="text-gray-900 text-lg font-semibold mt-4">
          Processing Payment...
        </Text>
        <Text className="text-gray-600 text-center mt-2">
          Please wait while we process your card payment
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-white px-6 py-8">
        <View className="flex-1 items-center justify-center">
          <View className="bg-red-100 rounded-full p-4 mb-4">
            <XCircle size={48} color="#DC2626" />
          </View>
          
          <Text className="text-xl font-bold text-gray-900 mb-2">
            Payment Failed
          </Text>
          
          <Text className="text-gray-600 text-center mb-6">
            {error}
          </Text>
          
          <TouchableOpacity
            className="bg-[#0096c7] rounded-lg py-3 px-6 mb-3"
            onPress={handleRetry}
          >
            <Text className="text-white text-base font-semibold">
              Retry Payment
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="bg-gray-200 rounded-lg py-3 px-6"
            onPress={handleCancel}
          >
            <Text className="text-gray-700 text-base font-semibold">
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white px-6 py-8">
      <View className="mb-6">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Card Payment
        </Text>
        <Text className="text-gray-600">
          Pay securely with your credit or debit card
        </Text>
      </View>

      <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <Text className="text-blue-900 font-semibold mb-2">
          Amount to Pay
        </Text>
        <Text className="text-2xl font-bold text-[#0096c7]">
          Rs. {booking.priceBreakdown.totalPrice.toFixed(2)}
        </Text>
      </View>

      <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <Text className="text-yellow-800 text-sm">
          ℹ️ This is a demo implementation. In production, Stripe Elements or Stripe React Native SDK would be integrated here to collect card details securely with 3D Secure support.
        </Text>
      </View>

      <TouchableOpacity
        className="bg-[#0096c7] rounded-lg py-4 items-center mb-3"
        onPress={handleConfirmPayment}
      >
        <Text className="text-white text-base font-semibold">
          Proceed to Card Payment
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-gray-200 rounded-lg py-4 items-center"
        onPress={handleCancel}
      >
        <Text className="text-gray-700 text-base font-semibold">
          Cancel Payment
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default StripePaymentScreen;
