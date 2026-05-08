/**
 * Payment Verification Screen
 * 
 * Handles the return from Khalti payment gateway via deep link.
 * Verifies the payment status and navigates to appropriate screen.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import paymentService from '../services/paymentService';
import { showError, showSuccess } from '../utils/toast';

interface PaymentVerificationScreenProps {
  route: {
    params: {
      pidx?: string;
      status?: string;
      transaction_id?: string;
      tidx?: string;
      amount?: string;
      mobile?: string;
      purchase_order_id?: string;
      purchase_order_name?: string;
    };
  };
  onNavigateToBookingSuccess: (bookingId: string) => void;
  onNavigateToHome: () => void;
}

export const PaymentVerificationScreen: React.FC<PaymentVerificationScreenProps> = ({
  route,
  onNavigateToBookingSuccess,
  onNavigateToHome,
}) => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'success' | 'failed' | 'pending'>('pending');
  const [message, setMessage] = useState('Verifying your payment...');
  const [bookingId, setBookingId] = useState<string | null>(null);

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    try {
      console.log('🔍 [PaymentVerification] Starting verification with params:', route.params);

      // Get stored transaction and booking IDs
      const storedTransactionId = await AsyncStorage.getItem('pendingTransactionId');
      const storedBookingId = await AsyncStorage.getItem('pendingBookingId');

      console.log('📦 [PaymentVerification] Stored data:', {
        transactionId: storedTransactionId,
        bookingId: storedBookingId,
      });

      // Extract parameters from deep link
      const { pidx, status, transaction_id, tidx } = route.params;

      // Use pidx or transaction_id from URL, fallback to stored
      const transactionIdToVerify = pidx || transaction_id || tidx || storedTransactionId;

      if (!transactionIdToVerify) {
        throw new Error('No transaction ID found for verification');
      }

      if (!storedBookingId) {
        throw new Error('No booking ID found');
      }

      console.log('✅ [PaymentVerification] Verifying transaction:', transactionIdToVerify);

      // Call verification API
      const response = await paymentService.verifyPayment({
        transactionId: transactionIdToVerify,
        bookingId: storedBookingId,
        paymentMethod: 'khalti',
      });

      console.log('📥 [PaymentVerification] Verification response:', response);

      if (response.success && response.data) {
        // Payment successful
        setVerificationStatus('success');
        setMessage('Payment completed successfully!');
        setBookingId(storedBookingId);
        showSuccess('Payment verified successfully');

        // Clear stored data
        await AsyncStorage.removeItem('pendingTransactionId');
        await AsyncStorage.removeItem('pendingBookingId');

        // Navigate to success screen after 2 seconds
        setTimeout(() => {
          onNavigateToBookingSuccess(storedBookingId);
        }, 2000);
      } else {
        // Payment failed
        throw new Error(response.error || 'Payment verification failed');
      }
    } catch (error) {
      console.error('❌ [PaymentVerification] Error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify payment';
      setVerificationStatus('failed');
      setMessage(errorMessage);
      showError(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRetry = () => {
    setIsVerifying(true);
    setVerificationStatus('pending');
    setMessage('Verifying your payment...');
    verifyPayment();
  };

  const handleGoHome = () => {
    onNavigateToHome();
  };

  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center px-6">
        {/* Verification Status Icon */}
        {isVerifying && (
          <View className="items-center mb-6">
            <ActivityIndicator size="large" color="#5C2D91" />
          </View>
        )}

        {!isVerifying && verificationStatus === 'success' && (
          <View className="items-center mb-6">
            <View className="bg-green-100 rounded-full p-6 mb-4">
              <CheckCircle2 size={64} color="#10b981" />
            </View>
          </View>
        )}

        {!isVerifying && verificationStatus === 'failed' && (
          <View className="items-center mb-6">
            <View className="bg-red-100 rounded-full p-6 mb-4">
              <XCircle size={64} color="#ef4444" />
            </View>
          </View>
        )}

        {/* Status Message */}
        <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
          {verificationStatus === 'success' && 'Payment Successful'}
          {verificationStatus === 'failed' && 'Payment Failed'}
          {verificationStatus === 'pending' && 'Verifying Payment'}
        </Text>

        <Text className="text-base text-gray-600 text-center mb-8">
          {message}
        </Text>

        {/* Action Buttons */}
        {!isVerifying && verificationStatus === 'failed' && (
          <View className="w-full">
            <TouchableOpacity
              className="bg-[#5C2D91] rounded-lg py-4 items-center mb-3"
              onPress={handleRetry}
            >
              <Text className="text-white text-base font-semibold">Retry Verification</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-gray-200 rounded-lg py-4 items-center"
              onPress={handleGoHome}
            >
              <Text className="text-gray-900 text-base font-semibold">Go to Home</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isVerifying && verificationStatus === 'success' && (
          <View className="bg-green-50 border border-green-200 rounded-lg p-4 w-full">
            <View className="flex-row items-center">
              <AlertCircle size={20} color="#10b981" />
              <Text className="text-green-800 text-sm ml-2">
                Redirecting to booking details...
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};
