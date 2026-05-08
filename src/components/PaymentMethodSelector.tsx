/**
 * Payment Method Selector Component
 * 
 * Displays available payment methods (Khalti, Stripe, PayPal) with icons
 * and handles payment method selection. Disables unavailable gateways.
 * 
 * Requirements: 10.7, 18.2
 */

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CreditCard, Wallet } from 'lucide-react-native';
import paymentService from '../services/paymentService';
import { PaymentMethod, GatewayStatus } from '../types/payment';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null;
  onSelectMethod: (method: PaymentMethod) => void;
  disabled?: boolean;
}

interface GatewayInfo {
  method: PaymentMethod;
  name: string;
  description: string;
  icon: 'wallet' | 'card';
  status: GatewayStatus;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onSelectMethod,
  disabled = false,
}) => {
  const [gateways, setGateways] = useState<GatewayInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGatewayHealth();
  }, []);

  const loadGatewayHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await paymentService.getGatewayHealth();
      
      const gatewayList: GatewayInfo[] = [
        {
          method: 'khalti',
          name: 'Khalti',
          description: 'Pay with Khalti wallet',
          icon: 'wallet',
          status: response.data.khalti,
        },
        {
          method: 'stripe',
          name: 'Credit/Debit Card',
          description: 'Pay with Stripe',
          icon: 'card',
          status: response.data.stripe,
        },
        {
          method: 'paypal',
          name: 'PayPal',
          description: 'Pay with PayPal account',
          icon: 'wallet',
          status: response.data.paypal,
        },
      ];
      
      setGateways(gatewayList);
    } catch (err) {
      console.error('Failed to load gateway health:', err);
      setError('Failed to load payment methods. Please try again.');
      
      // Fallback: show all methods as available
      setGateways([
        {
          method: 'khalti',
          name: 'Khalti',
          description: 'Pay with Khalti wallet',
          icon: 'wallet',
          status: 'available',
        },
        {
          method: 'stripe',
          name: 'Credit/Debit Card',
          description: 'Pay with Stripe',
          icon: 'card',
          status: 'available',
        },
        {
          method: 'paypal',
          name: 'PayPal',
          description: 'Pay with PayPal account',
          icon: 'wallet',
          status: 'available',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMethod = (method: PaymentMethod, status: GatewayStatus) => {
    if (status === 'available' && !disabled) {
      onSelectMethod(method);
    }
  };

  if (loading) {
    return (
      <View className="bg-white border border-gray-200 rounded-lg p-6">
        <Text className="text-lg font-semibold text-gray-900 mb-4">
          Select Payment Method
        </Text>
        <View className="items-center py-8">
          <ActivityIndicator size="large" color="#0096c7" />
          <Text className="text-gray-600 mt-3">Loading payment methods...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-white border border-gray-200 rounded-lg p-4">
      <Text className="text-lg font-semibold text-gray-900 mb-4">
        Select Payment Method
      </Text>

      {error && (
        <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <Text className="text-yellow-800 text-sm">{error}</Text>
        </View>
      )}

      <View className="space-y-3">
        {gateways.map((gateway) => {
          const isSelected = selectedMethod === gateway.method;
          const isAvailable = gateway.status === 'available';
          const isDisabled = !isAvailable || disabled;

          return (
            <TouchableOpacity
              key={gateway.method}
              className={`border-2 rounded-lg p-4 ${
                isSelected
                  ? 'border-[#0096c7] bg-blue-50'
                  : isDisabled
                  ? 'border-gray-200 bg-gray-50'
                  : 'border-gray-200 bg-white'
              }`}
              onPress={() => handleSelectMethod(gateway.method, gateway.status)}
              disabled={isDisabled}
            >
              <View className="flex-row items-center">
                <View
                  className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${
                    isSelected
                      ? 'bg-[#0096c7]'
                      : isDisabled
                      ? 'bg-gray-300'
                      : 'bg-gray-200'
                  }`}
                >
                  {gateway.icon === 'wallet' ? (
                    <Wallet
                      size={24}
                      color={isSelected ? '#FFFFFF' : isDisabled ? '#9CA3AF' : '#4B5563'}
                    />
                  ) : (
                    <CreditCard
                      size={24}
                      color={isSelected ? '#FFFFFF' : isDisabled ? '#9CA3AF' : '#4B5563'}
                    />
                  )}
                </View>

                <View className="flex-1">
                  <Text
                    className={`text-base font-semibold ${
                      isDisabled ? 'text-gray-400' : 'text-gray-900'
                    }`}
                  >
                    {gateway.name}
                  </Text>
                  <Text
                    className={`text-sm ${
                      isDisabled ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {gateway.description}
                  </Text>
                  {!isAvailable && (
                    <Text className="text-xs text-red-600 mt-1">
                      Currently unavailable
                    </Text>
                  )}
                </View>

                {isSelected && (
                  <View className="w-6 h-6 rounded-full bg-[#0096c7] items-center justify-center">
                    <Text className="text-white text-xs font-bold">✓</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default PaymentMethodSelector;
