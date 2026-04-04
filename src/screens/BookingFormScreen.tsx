/**
 * Booking Form Screen
 * 
 * Provides user interface for creating a vehicle booking with date/time selection,
 * add-on selection, and real-time price calculation.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Clock, ChevronRight, AlertTriangle, CheckCircle, XCircle } from 'lucide-react-native';
import bookingService from '../services/bookingService';
import kycService from '../services/kycService';
import { Vehicle } from '../types/vehicle';
import { AddOns, PriceBreakdown, BookingFormErrors } from '../types/booking';
import { KYCSubmission } from '../types/kyc';
import { ErrorMessage } from '../components/ErrorMessage';
import { showError, showKYCRequired } from '../utils/toast';
import { handleApiError, validateBookingDates, isKYCError } from '../utils/errorHandler';
import { logBookingOperation, logKYCCheck } from '../utils/logger';

interface BookingFormScreenProps {
  route: {
    params: {
      vehicleId: string;
      vehicle: Vehicle;
    };
  };
  onNavigateToConfirmation: (data: {
    vehicle: Vehicle;
    pickupDate: Date;
    pickupTime: string;
    dropoffDate: Date;
    dropoffTime: string;
    addOns: AddOns;
    priceBreakdown: PriceBreakdown;
  }) => void;
  onNavigateToKYC: () => void;
  onNavigateBack: () => void;
}

export const BookingFormScreen: React.FC<BookingFormScreenProps> = ({
  route,
  onNavigateToConfirmation,
  onNavigateToKYC,
  onNavigateBack,
}) => {
  const { vehicle } = route.params;

  // Form state
  const [pickupDate, setPickupDate] = useState<Date>(new Date(Date.now() + 24 * 60 * 60 * 1000)); // Tomorrow
  const [pickupTime, setPickupTime] = useState<string>('10:00');
  const [dropoffDate, setDropoffDate] = useState<Date>(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)); // 3 days later
  const [dropoffTime, setDropoffTime] = useState<string>('10:00');
  
  // Add-ons state
  const [addOns, setAddOns] = useState<AddOns>({
    helmet: false,
    gps: false,
    insurance: false,
  });

  // Date picker visibility state
  const [showPickupDatePicker, setShowPickupDatePicker] = useState(false);
  const [showDropoffDatePicker, setShowDropoffDatePicker] = useState(false);

  // UI state
  const [isCalculating, setIsCalculating] = useState(false);
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const [errors, setErrors] = useState<BookingFormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // KYC state
  const [kycStatus, setKycStatus] = useState<KYCSubmission | null>(null);
  const [isLoadingKYC, setIsLoadingKYC] = useState(true);
  const [showKYCModal, setShowKYCModal] = useState(false);

  // Business rule constants
  const MAX_BOOKING_DURATION_DAYS = 90;
  const MIN_ADVANCE_BOOKING_HOURS = 2;

  /**
   * Format date to display string (DD MMM YYYY)
   */
  const formatDate = (date: Date): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  /**
   * Format date to ISO string for API (YYYY-MM-DD)
   */
  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  /**
   * Validate form inputs with comprehensive business rules
   */
  const validateForm = (): boolean => {
    const newErrors: BookingFormErrors = {};
    let isValid = true;

    // Get current date and time
    const now = new Date();
    
    // Parse pickup date and time
    const pickupDateTime = new Date(pickupDate);
    const [pickupHour, pickupMinute] = pickupTime.split(':').map(Number);
    pickupDateTime.setHours(pickupHour, pickupMinute, 0, 0);

    // Parse dropoff date and time
    const dropoffDateTime = new Date(dropoffDate);
    const [dropoffHour, dropoffMinute] = dropoffTime.split(':').map(Number);
    dropoffDateTime.setHours(dropoffHour, dropoffMinute, 0, 0);

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(pickupTime)) {
      newErrors.pickupTime = 'Invalid time format (HH:MM)';
      isValid = false;
    }
    if (!timeRegex.test(dropoffTime)) {
      newErrors.dropoffTime = 'Invalid time format (HH:MM)';
      isValid = false;
    }

    // Validate pickup date is in the future
    if (pickupDateTime <= now) {
      newErrors.pickupDate = 'Pickup date and time must be in the future';
      isValid = false;
    }

    // Validate minimum advance booking time (2 hours)
    const minAdvanceTime = new Date(now.getTime() + MIN_ADVANCE_BOOKING_HOURS * 60 * 60 * 1000);
    if (pickupDateTime < minAdvanceTime) {
      newErrors.pickupDate = `Booking must be made at least ${MIN_ADVANCE_BOOKING_HOURS} hours in advance`;
      isValid = false;
    }

    // Validate dropoff date is after pickup date
    if (dropoffDateTime <= pickupDateTime) {
      newErrors.dateRange = 'Dropoff date and time must be after pickup date and time';
      isValid = false;
    }

    // Calculate booking duration in days
    const durationMs = dropoffDateTime.getTime() - pickupDateTime.getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

    // Validate maximum booking duration (90 days)
    if (durationDays > MAX_BOOKING_DURATION_DAYS) {
      newErrors.dateRange = `Booking duration cannot exceed ${MAX_BOOKING_DURATION_DAYS} days. Current duration: ${durationDays} days`;
      isValid = false;
    }

    // Validate minimum booking duration (at least 1 day)
    if (durationDays < 1) {
      newErrors.dateRange = 'Booking must be at least 1 day';
      isValid = false;
    }

    // Validate add-on selections (ensure they are boolean values)
    if (typeof addOns.helmet !== 'boolean' || 
        typeof addOns.gps !== 'boolean' || 
        typeof addOns.insurance !== 'boolean') {
      newErrors.addOns = 'Invalid add-on selection';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  /**
   * Calculate price based on current form values
   */
  const calculatePrice = async () => {
    // Clear previous errors
    setErrors({});
    setGeneralError(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsCalculating(true);
    logBookingOperation('Calculate Price - Form', vehicle._id, {
      pickupDate: formatDateForAPI(pickupDate),
      dropoffDate: formatDateForAPI(dropoffDate),
      addOns,
    });

    try {
      // First, perform client-side availability pre-check
      const availabilityCheck = await bookingService.checkAvailability(
        vehicle._id,
        formatDateForAPI(pickupDate),
        formatDateForAPI(dropoffDate)
      );

      if (!availabilityCheck.available) {
        const errorMsg = availabilityCheck.message || 'Vehicle is not available for the selected dates';
        setGeneralError(errorMsg);
        setPriceBreakdown(null);
        showError(errorMsg);
        return;
      }

      // If available, calculate the price
      const breakdown = await bookingService.calculatePrice({
        vehicleId: vehicle._id,
        pickupDate: formatDateForAPI(pickupDate),
        dropoffDate: formatDateForAPI(dropoffDate),
        addOns,
      });

      setPriceBreakdown(breakdown);
      logBookingOperation('Price Calculated Successfully', vehicle._id, {
        totalPrice: breakdown.totalPrice,
        duration: breakdown.duration,
      });
    } catch (error) {
      console.error('Price calculation error:', error);
      
      // Use centralized error handler
      handleApiError(
        error,
        'Price calculation',
        () => {
          // Navigate to KYC screen if needed
          Alert.alert(
            'KYC Required',
            'You need to complete KYC verification before booking. Would you like to do it now?',
            [
              { text: 'Later', style: 'cancel' },
              { text: 'Complete KYC', onPress: () => {
                onNavigateToKYC();
              }},
            ]
          );
        },
        () => calculatePrice() // Retry function
      );
      
      setPriceBreakdown(null);
    } finally {
      setIsCalculating(false);
    }
  };

  /**
   * Check KYC status on component mount
   */
  useEffect(() => {
    checkKYCStatus();
  }, []);

  /**
   * Calculate price whenever form values change
   */
  useEffect(() => {
    // Debounce price calculation
    const timer = setTimeout(() => {
      calculatePrice();
    }, 500);

    return () => clearTimeout(timer);
  }, [pickupDate, dropoffDate, addOns]);

  /**
   * Check user's KYC verification status
   */
  const checkKYCStatus = async () => {
    try {
      setIsLoadingKYC(true);
      const status = await kycService.getKYCStatus();
      setKycStatus(status);
      
      logKYCCheck(
        'current-user',
        status?.status === 'approved',
        status?.status || 'not_submitted'
      );
    } catch (error) {
      console.error('Failed to check KYC status:', error);
      // Don't show error to user, just log it
    } finally {
      setIsLoadingKYC(false);
    }
  };

  /**
   * Check if user is KYC verified
   */
  const isKYCVerified = (): boolean => {
    return kycStatus?.status === 'approved';
  };

  /**
   * Get KYC status display info
   */
  const getKYCStatusInfo = () => {
    if (!kycStatus) {
      return {
        text: 'Not Submitted',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        icon: <AlertTriangle size={16} color="#6B7280" />,
      };
    }

    switch (kycStatus.status) {
      case 'approved':
        return {
          text: 'Verified',
          color: 'text-green-700',
          bgColor: 'bg-green-100',
          icon: <CheckCircle size={16} color="#15803d" />,
        };
      case 'pending':
        return {
          text: 'Under Review',
          color: 'text-yellow-700',
          bgColor: 'bg-yellow-100',
          icon: <Clock size={16} color="#a16207" />,
        };
      case 'rejected':
        return {
          text: 'Rejected',
          color: 'text-red-700',
          bgColor: 'bg-red-100',
          icon: <XCircle size={16} color="#b91c1c" />,
        };
      default:
        return {
          text: 'Unknown',
          color: 'text-gray-600',
          bgColor: 'bg-gray-100',
          icon: <AlertTriangle size={16} color="#6B7280" />,
        };
    }
  };

  /**
   * Handle pickup date change
   */
  const onPickupDateChange = (event: any, selectedDate?: Date) => {
    setShowPickupDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setPickupDate(selectedDate);
      setErrors((prev) => ({ ...prev, pickupDate: undefined, dateRange: undefined }));
    }
  };

  /**
   * Handle dropoff date change
   */
  const onDropoffDateChange = (event: any, selectedDate?: Date) => {
    setShowDropoffDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDropoffDate(selectedDate);
      setErrors((prev) => ({ ...prev, dropoffDate: undefined, dateRange: undefined }));
    }
  };

  /**
   * Toggle add-on selection
   */
  const toggleAddOn = (addOn: keyof AddOns) => {
    setAddOns((prev) => ({
      ...prev,
      [addOn]: !prev[addOn],
    }));
  };

  /**
   * Handle continue to confirmation
   */
  const handleContinue = () => {
    // Validate form
    if (!validateForm()) {
      showError('Please fix the errors before continuing');
      return;
    }

    // Check if price is calculated
    if (!priceBreakdown) {
      showError('Please wait for price calculation to complete');
      return;
    }

    // Check KYC verification status
    if (!isKYCVerified()) {
      setShowKYCModal(true);
      return;
    }

    // Navigate to confirmation screen
    onNavigateToConfirmation({
      vehicle,
      pickupDate,
      pickupTime,
      dropoffDate,
      dropoffTime,
      addOns,
      priceBreakdown,
    });
  };

  /**
   * Handle KYC modal close
   */
  const handleKYCModalClose = () => {
    setShowKYCModal(false);
  };

  /**
   * Handle navigate to KYC submission
   */
  const handleNavigateToKYC = () => {
    setShowKYCModal(false);
    onNavigateToKYC();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        className="flex-1"
      >
        <View className="flex-1 px-6 py-8">
          {/* Header */}
          <View className="mb-6">
            <TouchableOpacity onPress={onNavigateBack} className="mb-3">
              <Text className="text-[#0096c7] text-base">← Back</Text>
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              Book {vehicle.name}
            </Text>
            <Text className="text-base text-gray-600">
              Select your rental dates and add-ons
            </Text>
          </View>

          {/* General Error Message */}
          <ErrorMessage message={generalError} onDismiss={() => setGeneralError(null)} />

          {/* KYC Status Warning Banner */}
          {!isLoadingKYC && !isKYCVerified() && (
            <View className={`rounded-lg p-4 mb-4 ${
              kycStatus?.status === 'rejected' ? 'bg-red-50 border border-red-200' :
              kycStatus?.status === 'pending' ? 'bg-yellow-50 border border-yellow-200' :
              'bg-orange-50 border border-orange-200'
            }`}>
              <View className="flex-row items-start">
                <View className="mr-3 mt-0.5">
                  {kycStatus?.status === 'rejected' ? (
                    <XCircle size={20} color="#b91c1c" />
                  ) : kycStatus?.status === 'pending' ? (
                    <Clock size={20} color="#a16207" />
                  ) : (
                    <AlertTriangle size={20} color="#c2410c" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className={`font-semibold text-sm mb-1 ${
                    kycStatus?.status === 'rejected' ? 'text-red-800' :
                    kycStatus?.status === 'pending' ? 'text-yellow-800' :
                    'text-orange-800'
                  }`}>
                    {kycStatus?.status === 'rejected' ? 'KYC Verification Rejected' :
                     kycStatus?.status === 'pending' ? 'KYC Verification Pending' :
                     'KYC Verification Required'}
                  </Text>
                  <Text className={`text-xs ${
                    kycStatus?.status === 'rejected' ? 'text-red-700' :
                    kycStatus?.status === 'pending' ? 'text-yellow-700' :
                    'text-orange-700'
                  }`}>
                    {kycStatus?.status === 'rejected' 
                      ? 'Your KYC verification was rejected. Please resubmit with correct information to book vehicles.'
                      : kycStatus?.status === 'pending'
                      ? 'Your KYC verification is under review. You can view prices but cannot book until approved.'
                      : 'You need to complete KYC verification before you can book vehicles. You can view prices and details.'}
                  </Text>
                  {kycStatus?.status !== 'pending' && (
                    <TouchableOpacity 
                      onPress={handleNavigateToKYC}
                      className="mt-2"
                    >
                      <Text className={`text-xs font-semibold underline ${
                        kycStatus?.status === 'rejected' ? 'text-red-800' : 'text-orange-800'
                      }`}>
                        {kycStatus?.status === 'rejected' ? 'Resubmit KYC' : 'Complete KYC Now →'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* KYC Status Badge */}
          {!isLoadingKYC && (
            <View className="mb-4">
              <View className="flex-row items-center">
                <Text className="text-sm text-gray-600 mr-2">KYC Status:</Text>
                <View className={`flex-row items-center px-3 py-1 rounded-full ${getKYCStatusInfo().bgColor}`}>
                  {getKYCStatusInfo().icon}
                  <Text className={`text-xs font-medium ml-1 ${getKYCStatusInfo().color}`}>
                    {getKYCStatusInfo().text}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Vehicle Info */}
          <View className="bg-blue-50 rounded-lg p-4 mb-6">
            <Text className="text-gray-900 font-semibold text-lg mb-1">{vehicle.name}</Text>
            <Text className="text-gray-600 text-sm">{vehicle.brand} {vehicle.model}</Text>
            <Text className="text-[#0096c7] font-bold text-lg mt-2">
              Rs. {vehicle.pricePerDay}/day
            </Text>
          </View>

          {/* Pickup Date */}
          <View className="mb-4">
            <Text className="text-sm text-gray-600 mb-2">Pickup Date *</Text>
            <TouchableOpacity
              className={`flex-row items-center border rounded-lg px-4 py-3 bg-gray-50 ${
                errors.pickupDate ? 'border-red-300' : 'border-gray-300'
              }`}
              onPress={() => setShowPickupDatePicker(true)}
            >
              <Calendar size={20} color="#6B7280" />
              <Text className="flex-1 ml-3 text-base text-gray-900">
                {formatDate(pickupDate)}
              </Text>
              <ChevronRight size={20} color="#6B7280" />
            </TouchableOpacity>
            {errors.pickupDate && (
              <Text className="text-red-600 text-sm mt-1">{errors.pickupDate}</Text>
            )}
          </View>

          {showPickupDatePicker && (
            <DateTimePicker
              value={pickupDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onPickupDateChange}
              minimumDate={new Date()}
            />
          )}

          {/* Pickup Time */}
          <View className="mb-4">
            <Text className="text-sm text-gray-600 mb-2">Pickup Time *</Text>
            <View
              className={`flex-row items-center border rounded-lg px-4 py-3 bg-gray-50 ${
                errors.pickupTime ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <Clock size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-gray-900"
                placeholder="HH:MM (e.g., 10:00)"
                placeholderTextColor="#9CA3AF"
                value={pickupTime}
                onChangeText={(text) => {
                  setPickupTime(text);
                  setErrors((prev) => ({ ...prev, pickupTime: undefined }));
                }}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            </View>
            {errors.pickupTime && (
              <Text className="text-red-600 text-sm mt-1">{errors.pickupTime}</Text>
            )}
          </View>

          {/* Dropoff Date */}
          <View className="mb-4">
            <Text className="text-sm text-gray-600 mb-2">Dropoff Date *</Text>
            <TouchableOpacity
              className={`flex-row items-center border rounded-lg px-4 py-3 bg-gray-50 ${
                errors.dropoffDate || errors.dateRange ? 'border-red-300' : 'border-gray-300'
              }`}
              onPress={() => setShowDropoffDatePicker(true)}
            >
              <Calendar size={20} color="#6B7280" />
              <Text className="flex-1 ml-3 text-base text-gray-900">
                {formatDate(dropoffDate)}
              </Text>
              <ChevronRight size={20} color="#6B7280" />
            </TouchableOpacity>
            {errors.dropoffDate && (
              <Text className="text-red-600 text-sm mt-1">{errors.dropoffDate}</Text>
            )}
            {errors.dateRange && (
              <Text className="text-red-600 text-sm mt-1">{errors.dateRange}</Text>
            )}
          </View>

          {showDropoffDatePicker && (
            <DateTimePicker
              value={dropoffDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDropoffDateChange}
              minimumDate={new Date(pickupDate.getTime() + 24 * 60 * 60 * 1000)}
            />
          )}

          {/* Dropoff Time */}
          <View className="mb-6">
            <Text className="text-sm text-gray-600 mb-2">Dropoff Time *</Text>
            <View
              className={`flex-row items-center border rounded-lg px-4 py-3 bg-gray-50 ${
                errors.dropoffTime ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <Clock size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-gray-900"
                placeholder="HH:MM (e.g., 10:00)"
                placeholderTextColor="#9CA3AF"
                value={dropoffTime}
                onChangeText={(text) => {
                  setDropoffTime(text);
                  setErrors((prev) => ({ ...prev, dropoffTime: undefined }));
                }}
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            </View>
            {errors.dropoffTime && (
              <Text className="text-red-600 text-sm mt-1">{errors.dropoffTime}</Text>
            )}
          </View>

          {/* Add-ons Section */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Add-ons (Optional)</Text>
            
            {/* Helmet */}
            <TouchableOpacity
              className="flex-row items-center justify-between border border-gray-300 rounded-lg p-4 mb-3"
              onPress={() => toggleAddOn('helmet')}
            >
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900">Helmet</Text>
                <Text className="text-sm text-gray-600">Rs. 50/day</Text>
              </View>
              <View
                className={`w-6 h-6 rounded border-2 items-center justify-center ${
                  addOns.helmet ? 'bg-[#0096c7] border-[#0096c7]' : 'border-gray-300'
                }`}
              >
                {addOns.helmet && <Text className="text-white text-xs">✓</Text>}
              </View>
            </TouchableOpacity>

            {/* GPS */}
            <TouchableOpacity
              className="flex-row items-center justify-between border border-gray-300 rounded-lg p-4 mb-3"
              onPress={() => toggleAddOn('gps')}
            >
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900">GPS Navigation</Text>
                <Text className="text-sm text-gray-600">Rs. 100/day</Text>
              </View>
              <View
                className={`w-6 h-6 rounded border-2 items-center justify-center ${
                  addOns.gps ? 'bg-[#0096c7] border-[#0096c7]' : 'border-gray-300'
                }`}
              >
                {addOns.gps && <Text className="text-white text-xs">✓</Text>}
              </View>
            </TouchableOpacity>

            {/* Insurance */}
            <TouchableOpacity
              className="flex-row items-center justify-between border border-gray-300 rounded-lg p-4"
              onPress={() => toggleAddOn('insurance')}
            >
              <View className="flex-1">
                <Text className="text-base font-medium text-gray-900">Insurance Coverage</Text>
                <Text className="text-sm text-gray-600">Rs. 200/day</Text>
              </View>
              <View
                className={`w-6 h-6 rounded border-2 items-center justify-center ${
                  addOns.insurance ? 'bg-[#0096c7] border-[#0096c7]' : 'border-gray-300'
                }`}
              >
                {addOns.insurance && <Text className="text-white text-xs">✓</Text>}
              </View>
            </TouchableOpacity>
          </View>

          {/* Price Breakdown */}
          {isCalculating ? (
            <View className="bg-gray-50 rounded-lg p-4 mb-6 items-center">
              <ActivityIndicator color="#0096c7" />
              <Text className="text-gray-600 text-sm mt-2">Calculating price...</Text>
            </View>
          ) : priceBreakdown ? (
            <View className="bg-blue-50 rounded-lg p-4 mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-3">Price Breakdown</Text>
              
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-600">Base Price ({priceBreakdown.duration} days)</Text>
                <Text className="text-gray-900">Rs. {priceBreakdown.basePrice.toFixed(2)}</Text>
              </View>

              {priceBreakdown.durationDiscount > 0 && (
                <View className="flex-row justify-between mb-2">
                  <Text className="text-green-600">Duration Discount</Text>
                  <Text className="text-green-600">- Rs. {priceBreakdown.durationDiscount.toFixed(2)}</Text>
                </View>
              )}

              {priceBreakdown.addOnsTotal > 0 && (
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-600">Add-ons</Text>
                  <Text className="text-gray-900">Rs. {priceBreakdown.addOnsTotal.toFixed(2)}</Text>
                </View>
              )}

              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-600">VAT (13%)</Text>
                <Text className="text-gray-900">Rs. {priceBreakdown.tax.toFixed(2)}</Text>
              </View>

              <View className="flex-row justify-between mb-3">
                <Text className="text-gray-600">Service Fee (5%)</Text>
                <Text className="text-gray-900">Rs. {priceBreakdown.serviceFee.toFixed(2)}</Text>
              </View>

              <View className="border-t border-gray-300 pt-3">
                <View className="flex-row justify-between">
                  <Text className="text-lg font-bold text-gray-900">Total</Text>
                  <Text className="text-lg font-bold text-[#0096c7]">
                    Rs. {priceBreakdown.totalPrice.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          ) : null}

          {/* Continue Button */}
          <TouchableOpacity
            className={`rounded-lg py-4 items-center mb-4 ${
              isCalculating || !priceBreakdown ? 'bg-gray-400' : 
              isKYCVerified() ? 'bg-[#0096c7]' : 'bg-orange-500'
            }`}
            onPress={handleContinue}
            disabled={isCalculating || !priceBreakdown}
          >
            <Text className="text-white text-base font-semibold">
              {isKYCVerified() ? 'Continue to Confirmation' : 'View Booking Details'}
            </Text>
          </TouchableOpacity>

          {/* Info Text */}
          {isKYCVerified() ? (
            <View className="bg-green-50 rounded-lg p-4 mb-3">
              <Text className="text-green-800 text-sm">
                ✅ Your KYC is verified. You can proceed with booking.
              </Text>
            </View>
          ) : (
            <View className="bg-yellow-50 rounded-lg p-4 mb-3">
              <Text className="text-yellow-800 text-sm">
                ℹ️ You can view prices and details, but you'll need to complete KYC verification before booking.
              </Text>
            </View>
          )}

          {/* Booking Rules Info */}
          <View className="bg-blue-50 rounded-lg p-4">
            <Text className="text-blue-900 font-semibold text-sm mb-2">Booking Guidelines</Text>
            <Text className="text-blue-800 text-xs mb-1">
              • Bookings must be made at least {MIN_ADVANCE_BOOKING_HOURS} hours in advance
            </Text>
            <Text className="text-blue-800 text-xs mb-1">
              • Maximum booking duration: {MAX_BOOKING_DURATION_DAYS} days
            </Text>
            <Text className="text-blue-800 text-xs">
              • Minimum booking duration: 1 day
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* KYC Verification Required Modal */}
      <Modal
        visible={showKYCModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleKYCModalClose}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-md">
            {/* Icon */}
            <View className="items-center mb-4">
              <View className="bg-orange-100 rounded-full p-4">
                <AlertTriangle size={48} color="#c2410c" />
              </View>
            </View>

            {/* Title */}
            <Text className="text-xl font-bold text-gray-900 text-center mb-2">
              KYC Verification Required
            </Text>

            {/* Message */}
            <Text className="text-base text-gray-600 text-center mb-6">
              {kycStatus?.status === 'rejected'
                ? 'Your previous KYC verification was rejected. Please resubmit with correct information to proceed with booking.'
                : kycStatus?.status === 'pending'
                ? 'Your KYC verification is currently under review. You can view vehicle details and prices, but cannot complete a booking until your verification is approved.'
                : 'To ensure the safety and security of our platform, you need to complete KYC (Know Your Customer) verification before booking a vehicle.'}
            </Text>

            {/* What you can do */}
            <View className="bg-blue-50 rounded-lg p-4 mb-6">
              <Text className="text-sm font-semibold text-blue-900 mb-2">
                {kycStatus?.status === 'pending' ? 'What you can do:' : 'What you need:'}
              </Text>
              {kycStatus?.status === 'pending' ? (
                <>
                  <Text className="text-xs text-blue-800 mb-1">• View vehicle details and prices</Text>
                  <Text className="text-xs text-blue-800 mb-1">• Calculate booking costs</Text>
                  <Text className="text-xs text-blue-800">• Wait for verification approval (usually 24-48 hours)</Text>
                </>
              ) : (
                <>
                  <Text className="text-xs text-blue-800 mb-1">• Valid driving license</Text>
                  <Text className="text-xs text-blue-800 mb-1">• Clear photos of license (front & back)</Text>
                  <Text className="text-xs text-blue-800">• A selfie for identity verification</Text>
                </>
              )}
            </View>

            {/* Buttons */}
            <View className="space-y-3">
              {kycStatus?.status !== 'pending' && (
                <TouchableOpacity
                  className="bg-[#0096c7] rounded-lg py-4 items-center"
                  onPress={handleNavigateToKYC}
                >
                  <Text className="text-white text-base font-semibold">
                    {kycStatus?.status === 'rejected' ? 'Resubmit KYC' : 'Complete KYC Now'}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                className="bg-gray-200 rounded-lg py-4 items-center"
                onPress={handleKYCModalClose}
              >
                <Text className="text-gray-700 text-base font-semibold">
                  {kycStatus?.status === 'pending' ? 'OK, Got It' : 'Maybe Later'}
                </Text>
              </TouchableOpacity>
            </View>

            {kycStatus?.status === 'rejected' && kycStatus.reviewNote && (
              <View className="mt-4 bg-red-50 rounded-lg p-3">
                <Text className="text-xs font-semibold text-red-900 mb-1">Rejection Reason:</Text>
                <Text className="text-xs text-red-800">{kycStatus.reviewNote}</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};
