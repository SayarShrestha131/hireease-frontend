/**
 * PayPal Payment Screen
 * 
 * Initiates PayPal order, redirects to PayPal approval URL,
 * handles return from PayPal with order capture, and displays payment status.
 * 
 * Requirements: 3.2, 3.3, 3.4, 3.5
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react-native';
import paymentService from '../services/paymentService';
import { Booking } from '../types/booking';
import * as ExpoLinking from 'expo-linking';

interface PayPalPaymentScreenProps {
  route: {
    params: {
      booking: Booking;
    };
  };
  onPaymentSuccess: (bookingId: string, receiptUrl?: string) => void;
  onPaymentFailed: (error: string) => void;
  onCancel: () => void;
}

const PayPalPaymentScreen: React.FC<PayPalPaymentScreenProps> = ({
  route,
  onPaymentSuccess,
  onPaymentFailed,
  onCancel,
}) => {
  const { booking } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    initiatePayment();
    
    // Listen for deep link return from PayPal
    const subscription = ExpoLinking.addEventListener('url', handleDeepLink);
    
    return () => {
      subscription.remove();
    };
  }, []);

  const initiatePayment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const returnUrl = ExpoLinking.createURL('payment/paypal/return');
      
      const response = await paymentService.initiatePayment({
        bookingId: booking._id,
        paymentMethod: 'paypal',
        returnUrl,
      });
      
      setTransactionId(response.data.transactionId);
      setPaymentUrl(response.data.paymentUrl || null);
      
      if (response.data.paymentUrl) {
        // Open PayPal approval page
        const supported = await Linking.canOpenURL(response.data.paymentUrl);
        if (supported) {
          await Linking.openURL(response.data.paymentUrl);
        } else {
          throw new Error('Cannot open PayPal payment page');
        }
      }
      
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to initiate PayPal payment:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to initiate payment';
      setError(errorMessage);
      setLoading(false);
      onPaymentFailed(errorMessage);
    }
  };

  const handleDeepLink = ({ url }: { url: string }) => {
    const { queryParams } = ExpoLinking.parse(url);
    
    if (queryParams && transactionId) {
      verifyPayment(queryParams);
    }
  };

  const verifyPayment = async (gatewayData: Record<string, any>) => {
    if (!transactionId) return;
    
    try {
      setVerifying(true);
      setError(null);
      
      const response = await paymentService.verifyPayment({
        transactionId,
        gatewayData,
      });
      
      if (response.data.paymentStatus === 'completed') {
        onPaymentSuccess(response.data.bookingId, response.data.receiptUrl);
      } else if (response.data.paymentStatus === 'failed') {
        const errorMsg = 'Payment verification failed';
        setError(errorMsg);
        onPaymentFailed(errorMsg);
      } else {
        setError('Payment is still processing. Please wait...');
      }
    } catch (err: any) {
      console.error('Failed to verify PayPal payment:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Payment verification failed';
      setError(errorMessage);
      onPaymentFailed(errorMessage);
    } finally {
      setVerifying(false);
    }
  };

  const handleRetry = () => {
    setError(null);
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
          Initiating PayPal Payment...
        </Text>
        <Text className="text-gray-600 text-center mt-2">
          Please wait while we redirect you to PayPal
        </Text>
      </View>
    );
  }

  if (verifying) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <ActivityIndicator size="large" color="#0096c7" />
        <Text className="text-gray-900 text-lg font-semibold mt-4">
          Verifying Payment...
        </Text>
        <Text className="text-gray-600 text-center mt-2">
          Please wait while we confirm your payment with PayPal
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
      <View className="flex-1 items-center justify-center">
        <View className="bg-blue-100 rounded-full p-4 mb-4">
          <AlertCircle size={48} color="#0096c7" />
        </View>
        
        <Text className="text-xl font-bold text-gray-900 mb-2">
          Complete Payment on PayPal
        </Text>
        
        <Text className="text-gray-600 text-center mb-6">
          You will be redirected back to the app after completing payment
        </Text>
        
        {paymentUrl && (
          <TouchableOpacity
            className="bg-[#0096c7] rounded-lg py-3 px-6 mb-3"
            onPress={() => Linking.openURL(paymentUrl)}
          >
            <Text className="text-white text-base font-semibold">
              Open PayPal Payment
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          className="bg-gray-200 rounded-lg py-3 px-6"
          onPress={handleCancel}
        >
          <Text className="text-gray-700 text-base font-semibold">
            Cancel Payment
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PayPalPaymentScreen;
