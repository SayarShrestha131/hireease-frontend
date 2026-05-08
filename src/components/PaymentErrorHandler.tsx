/**
 * Payment Error Handler Component
 * 
 * Displays user-friendly error messages from backend,
 * shows retry button, suggests alternative payment methods,
 * and displays support contact for unresolved issues.
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.6, 18.2
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { XCircle, RefreshCw, CreditCard, Mail } from 'lucide-react-native';
import { PaymentMethod } from '../types/payment';

interface PaymentErrorHandlerProps {
  error: string;
  errorCode?: string;
  currentPaymentMethod?: PaymentMethod;
  onRetry?: () => void;
  onChangePaymentMethod?: () => void;
  onContactSupport?: () => void;
  onDismiss?: () => void;
}

const PaymentErrorHandler: React.FC<PaymentErrorHandlerProps> = ({
  error,
  errorCode,
  currentPaymentMethod,
  onRetry,
  onChangePaymentMethod,
  onContactSupport,
  onDismiss,
}) => {
  // Map error codes to user-friendly messages
  const getUserFriendlyMessage = (): string => {
    if (!errorCode) return error;

    switch (errorCode) {
      case 'INSUFFICIENT_FUNDS':
        return 'Your payment was declined due to insufficient funds. Please check your account balance and try again.';
      case 'INVALID_CARD':
      case 'CARD_DECLINED':
        return 'Your card was declined. Please check your card details or try a different payment method.';
      case 'EXPIRED_CARD':
        return 'Your card has expired. Please use a different card or payment method.';
      case 'NETWORK_ERROR':
      case 'TIMEOUT':
        return 'We encountered a connection issue. Please check your internet connection and try again.';
      case 'GATEWAY_ERROR':
      case 'GATEWAY_UNAVAILABLE':
        return 'The payment gateway is temporarily unavailable. Please try a different payment method or try again later.';
      case 'PAYMENT_ALREADY_PROCESSED':
        return 'This payment has already been processed. Please check your booking status.';
      case 'INVALID_AMOUNT':
        return 'There was an issue with the payment amount. Please refresh and try again.';
      case 'AUTHENTICATION_FAILED':
        return 'Payment authentication failed. Please verify your payment details and try again.';
      case 'RATE_LIMIT_EXCEEDED':
        return 'Too many payment attempts. Please wait a few minutes before trying again.';
      default:
        return error;
    }
  };

  // Determine if we should suggest alternative payment method
  const shouldSuggestAlternative = (): boolean => {
    const gatewayErrorCodes = [
      'GATEWAY_ERROR',
      'GATEWAY_UNAVAILABLE',
      'TIMEOUT',
      'NETWORK_ERROR',
    ];
    return errorCode ? gatewayErrorCodes.includes(errorCode) : false;
  };

  // Determine if retry is appropriate
  const shouldShowRetry = (): boolean => {
    const retryableCodes = [
      'NETWORK_ERROR',
      'TIMEOUT',
      'GATEWAY_ERROR',
      'AUTHENTICATION_FAILED',
    ];
    return !errorCode || retryableCodes.includes(errorCode);
  };

  const friendlyMessage = getUserFriendlyMessage();
  const showAlternative = shouldSuggestAlternative();
  const showRetry = shouldShowRetry();

  return (
    <View className="bg-white border border-red-200 rounded-lg p-4">
      {/* Error Icon and Title */}
      <View className="flex-row items-start mb-3">
        <View className="bg-red-100 rounded-full p-2 mr-3">
          <XCircle size={24} color="#DC2626" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900 mb-1">
            Payment Failed
          </Text>
          <Text className="text-gray-700">{friendlyMessage}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="mt-4 space-y-2">
        {/* Retry Button */}
        {showRetry && onRetry && (
          <TouchableOpacity
            className="bg-[#0096c7] rounded-lg py-3 px-4 flex-row items-center justify-center mb-2"
            onPress={onRetry}
          >
            <RefreshCw size={18} color="#FFFFFF" />
            <Text className="text-white text-base font-semibold ml-2">
              Retry Payment
            </Text>
          </TouchableOpacity>
        )}

        {/* Alternative Payment Method Button */}
        {showAlternative && onChangePaymentMethod && (
          <TouchableOpacity
            className="bg-white border-2 border-[#0096c7] rounded-lg py-3 px-4 flex-row items-center justify-center mb-2"
            onPress={onChangePaymentMethod}
          >
            <CreditCard size={18} color="#0096c7" />
            <Text className="text-[#0096c7] text-base font-semibold ml-2">
              Try Different Payment Method
            </Text>
          </TouchableOpacity>
        )}

        {/* Contact Support Button */}
        {onContactSupport && (
          <TouchableOpacity
            className="bg-gray-100 rounded-lg py-3 px-4 flex-row items-center justify-center mb-2"
            onPress={onContactSupport}
          >
            <Mail size={18} color="#4B5563" />
            <Text className="text-gray-700 text-base font-semibold ml-2">
              Contact Support
            </Text>
          </TouchableOpacity>
        )}

        {/* Dismiss Button */}
        {onDismiss && (
          <TouchableOpacity
            className="py-2"
            onPress={onDismiss}
          >
            <Text className="text-gray-600 text-center">Dismiss</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Support Information */}
      <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
        <Text className="text-yellow-800 text-sm">
          <Text className="font-semibold">Need help?</Text> Contact our support team at{' '}
          <Text className="font-semibold">support@hireease.com</Text> or call{' '}
          <Text className="font-semibold">+977-1-234567</Text>
        </Text>
      </View>

      {/* Error Code (for debugging) */}
      {errorCode && (
        <Text className="text-xs text-gray-400 mt-2 text-center">
          Error Code: {errorCode}
        </Text>
      )}
    </View>
  );
};

export default PaymentErrorHandler;
