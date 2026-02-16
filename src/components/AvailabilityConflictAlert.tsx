/**
 * AvailabilityConflictAlert Component
 * 
 * Alert component that displays when a vehicle is not available for selected dates
 * Provides date suggestions and options to modify booking
 */

import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Calendar, AlertTriangle } from 'lucide-react-native';
import { Booking } from '../types/booking';

interface AvailabilityConflictAlertProps {
  visible: boolean;
  onClose: () => void;
  onModifyDates: () => void;
  conflictingBookings?: Booking[];
  suggestedDates?: {
    pickupDate: Date;
    dropoffDate: Date;
  }[];
}

export const AvailabilityConflictAlert: React.FC<AvailabilityConflictAlertProps> = ({
  visible,
  onClose,
  onModifyDates,
  conflictingBookings = [],
  suggestedDates = [],
}) => {
  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-6">
        <View className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80%]">
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Icon */}
            <View className="items-center mb-4">
              <View className="bg-orange-100 rounded-full p-4">
                <AlertTriangle size={48} color="#F59E0B" />
              </View>
            </View>

            {/* Title */}
            <Text className="text-xl font-bold text-gray-900 text-center mb-3">
              Vehicle Not Available
            </Text>

            {/* Message */}
            <Text className="text-gray-600 text-center mb-4 leading-6">
              This vehicle is already booked for your selected dates. Please choose different dates or select another vehicle.
            </Text>

            {/* Conflicting Bookings */}
            {conflictingBookings.length > 0 && (
              <View className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <Text className="text-sm font-semibold text-orange-900 mb-2">
                  Existing Bookings:
                </Text>
                {conflictingBookings.map((booking, index) => (
                  <View key={booking._id || index} className="mb-2 last:mb-0">
                    <View className="flex-row items-center">
                      <Calendar size={14} color="#F59E0B" />
                      <Text className="text-xs text-orange-700 ml-2">
                        {formatDate(booking.pickupDate)} - {formatDate(booking.dropoffDate)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Suggested Dates */}
            {suggestedDates.length > 0 && (
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-900 mb-2">
                  Available Date Ranges:
                </Text>
                {suggestedDates.map((suggestion, index) => (
                  <View
                    key={index}
                    className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2"
                  >
                    <View className="flex-row items-center">
                      <Calendar size={14} color="#10B981" />
                      <Text className="text-sm text-green-700 ml-2">
                        {formatDate(suggestion.pickupDate)} - {formatDate(suggestion.dropoffDate)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Buttons */}
            <View className="space-y-3">
              <TouchableOpacity
                onPress={() => {
                  onClose();
                  onModifyDates();
                }}
                className="bg-[#0096c7] py-3 rounded-lg"
                activeOpacity={0.7}
              >
                <Text className="text-white text-center font-semibold text-base">
                  Choose Different Dates
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onClose}
                className="py-3 rounded-lg border border-gray-300"
                activeOpacity={0.7}
              >
                <Text className="text-gray-700 text-center font-semibold text-base">
                  Browse Other Vehicles
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
