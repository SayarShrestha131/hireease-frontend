/**
 * KYCVerificationModal Component
 * 
 * Modal that prompts users to complete KYC verification before booking
 * Provides navigation to KYC submission screen
 */

import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react-native';

interface KYCVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateToKYC: () => void;
  kycStatus?: 'not_submitted' | 'pending' | 'rejected' | 'approved';
}

export const KYCVerificationModal: React.FC<KYCVerificationModalProps> = ({
  visible,
  onClose,
  onNavigateToKYC,
  kycStatus = 'not_submitted',
}) => {
  const getStatusConfig = () => {
    switch (kycStatus) {
      case 'pending':
        return {
          icon: Clock,
          iconColor: '#F59E0B',
          title: 'KYC Verification Pending',
          message: 'Your KYC verification is currently under review. You will be able to book vehicles once your verification is approved.',
          showButton: false,
        };
      case 'rejected':
        return {
          icon: XCircle,
          iconColor: '#DC2626',
          title: 'KYC Verification Rejected',
          message: 'Your KYC verification was rejected. Please resubmit your documents with the correct information to start booking.',
          showButton: true,
          buttonText: 'Resubmit KYC',
        };
      case 'approved':
        return {
          icon: CheckCircle,
          iconColor: '#10B981',
          title: 'KYC Verified',
          message: 'Your KYC verification is approved. You can now book vehicles.',
          showButton: false,
        };
      default: // not_submitted
        return {
          icon: AlertCircle,
          iconColor: '#0096c7',
          title: 'KYC Verification Required',
          message: 'To ensure the safety and security of our platform, you need to complete KYC verification before booking a vehicle. This is a one-time process that takes just a few minutes.',
          showButton: true,
          buttonText: 'Complete KYC Verification',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-6">
        <View className="bg-white rounded-2xl p-6 w-full max-w-md">
          {/* Icon */}
          <View className="items-center mb-4">
            <View className="bg-gray-100 rounded-full p-4">
              <Icon size={48} color={config.iconColor} />
            </View>
          </View>

          {/* Title */}
          <Text className="text-xl font-bold text-gray-900 text-center mb-3">
            {config.title}
          </Text>

          {/* Message */}
          <Text className="text-gray-600 text-center mb-6 leading-6">
            {config.message}
          </Text>

          {/* Buttons */}
          <View className="space-y-3">
            {config.showButton && (
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onNavigateToKYC();
                }}
                className="bg-[#0096c7] py-3 rounded-lg"
                activeOpacity={0.7}
              >
                <Text className="text-white text-center font-semibold text-base">
                  {config.buttonText}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={onClose}
              className="py-3 rounded-lg border border-gray-300"
              activeOpacity={0.7}
            >
              <Text className="text-gray-700 text-center font-semibold text-base">
                {config.showButton ? 'Maybe Later' : 'Close'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
