/**
 * Payment Status Screen
 * 
 * Polls payment status during processing, displays loading state,
 * shows success/failure messages, and provides receipt download link.
 * 
 * Requirements: 5.3, 5.4, 5.5, 16.5
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { CheckCircle2, XCircle, Download } from 'lucide-react-native';
import paymentService from '../services/paymentService';

interface PaymentStatusScreenProps {
  route: {
    params: {
      transactionId: string;
      bookingId?: string;
    };
  };
  onSuccess: (bookingId: string) => void;
  onRetry: () => void;
  onCancel: () => void;
}

const PaymentStatusScreen: React.FC<PaymentStatusScreenProps> = ({
  route,
  onSuccess,
  onRetry,
  onCancel,
}) => {
  const { transactionId, bookingId: initialBookingId } = route.params;
  
  const [status, setStatus] = useState<'processing' | 'completed' | 'failed'>('processing');
  const [bookingId, setBookingId] = useState<string | undefined>(initialBookingId);
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [pollingCount, setPollingCount] = useState(0);

  useEffect(() => {
    if (status === 'processing') {
      const interval = setInterval(() => {
        pollPaymentStatus();
      }, 3000); // Poll every 3 seconds

      // Stop polling after 60 seconds (20 attempts)
      const timeout = setTimeout(() => {
        clearInterval(interval);
        if (status === 'processing') {
          setStatus('failed');
          setError('Payment verification timeout. Please check your booking status.');
        }
      }, 60000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [status, pollingCount]);

  const pollPaymentStatus = async () => {
    try {
      const response = await paymentService.pollPaymentStatus(transactionId);
      
      setPollingCount((prev) => prev + 1);
      
      if (response.status === 'completed') {
        setStatus('completed');
        setBookingId(response.bookingId);
        setReceiptUrl(response.receiptUrl);
      } else if (response.status === 'failed') {
        setStatus('failed');
        setError('Payment failed. Please try again.');
      }
      // Continue polling if status is still 'processing'
    } catch (err: any) {
      console.error('Failed to poll payment status:', err);
      // Don't stop polling on error, just log it
    }
  };

  const handleDownloadReceipt = async () => {
    if (receiptUrl) {
      try {
        const supported = await Linking.canOpenURL(receiptUrl);
        if (supported) {
          await Linking.openURL(receiptUrl);
        }
      } catch (err) {
        console.error('Failed to open receipt:', err);
      }
    } else if (bookingId) {
      try {
        const response = await paymentService.getReceipt(bookingId);
        if (response.data.receiptUrl) {
          await Linking.openURL(response.data.receiptUrl);
        }
      } catch (err) {
        console.error('Failed to download receipt:', err);
      }
    }
  };

  const handleViewBooking = () => {
    if (bookingId) {
      onSuccess(bookingId);
    }
  };

  if (status === 'processing') {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <ActivityIndicator size="large" color="#0096c7" />
        <Text className="text-gray-900 text-lg font-semibold mt-4">
          Processing Payment...
        </Text>
        <Text className="text-gray-600 text-center mt-2">
          Please wait while we confirm your payment
        </Text>
        <Text className="text-gray-500 text-sm mt-4">
          Attempt {pollingCount} of 20
        </Text>
      </View>
    );
  }

  if (status === 'completed') {
    return (
      <View className="flex-1 bg-white px-6 py-8">
        <View className="flex-1 items-center justify-center">
          <View className="bg-green-100 rounded-full p-4 mb-4">
            <CheckCircle2 size={64} color="#059669" />
          </View>
          
          <Text className="text-2xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </Text>
          
          <Text className="text-gray-600 text-center mb-6">
            Your booking has been confirmed. You will receive a confirmation email shortly.
          </Text>

          {bookingId && (
            <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 w-full">
              <Text className="text-sm text-gray-600 mb-1">Booking ID</Text>
              <Text className="text-lg font-semibold text-gray-900">{bookingId}</Text>
            </View>
          )}

          {receiptUrl && (
            <TouchableOpacity
              className="bg-white border-2 border-[#0096c7] rounded-lg py-3 px-6 mb-3 flex-row items-center"
              onPress={handleDownloadReceipt}
            >
              <Download size={20} color="#0096c7" />
              <Text className="text-[#0096c7] text-base font-semibold ml-2">
                Download Receipt
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className="bg-[#0096c7] rounded-lg py-4 px-8 mb-3"
            onPress={handleViewBooking}
          >
            <Text className="text-white text-base font-semibold">
              View Booking Details
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Failed status
  return (
    <View className="flex-1 bg-white px-6 py-8">
      <View className="flex-1 items-center justify-center">
        <View className="bg-red-100 rounded-full p-4 mb-4">
          <XCircle size={64} color="#DC2626" />
        </View>
        
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Payment Failed
        </Text>
        
        <Text className="text-gray-600 text-center mb-6">
          {error || 'We could not process your payment. Please try again.'}
        </Text>

        <TouchableOpacity
          className="bg-[#0096c7] rounded-lg py-3 px-6 mb-3"
          onPress={onRetry}
        >
          <Text className="text-white text-base font-semibold">
            Retry Payment
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-gray-200 rounded-lg py-3 px-6"
          onPress={onCancel}
        >
          <Text className="text-gray-700 text-base font-semibold">
            Cancel
          </Text>
        </TouchableOpacity>

        <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
          <Text className="text-yellow-800 text-sm text-center">
            Need help? Contact support at support@hireease.com
          </Text>
        </View>
      </View>
    </View>
  );
};

export default PaymentStatusScreen;
