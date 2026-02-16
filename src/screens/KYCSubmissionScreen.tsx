/**
 * KYC Submission Screen
 * 
 * Provides user interface for submitting KYC verification with license details and images.
 * Includes form validation, image picker integration, and error handling.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Upload, X, Calendar } from 'lucide-react-native';
import kycService from '../services/kycService';
import { KYCFormData, KYCFormErrors } from '../types/kyc';
import { ErrorMessage } from '../components/ErrorMessage';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { showSuccess, showError } from '../utils/toast';

interface KYCSubmissionScreenProps {
  onNavigateToStatus: () => void;
  onNavigateBack: () => void;
  previousSubmissionId?: string;
  previousData?: Partial<KYCFormData>;
}

export const KYCSubmissionScreen: React.FC<KYCSubmissionScreenProps> = ({
  onNavigateToStatus,
  onNavigateBack,
  previousSubmissionId,
  previousData,
}) => {
  // Form state
  const [licenseNumber, setLicenseNumber] = useState(previousData?.licenseNumber || '');
  const [fullName, setFullName] = useState(previousData?.fullName || '');
  const [dateOfBirth, setDateOfBirth] = useState(
    previousData?.dateOfBirth ? formatDateForInput(previousData.dateOfBirth) : ''
  );
  const [licenseExpiryDate, setLicenseExpiryDate] = useState(
    previousData?.licenseExpiryDate ? formatDateForInput(previousData.licenseExpiryDate) : ''
  );
  const [licenseFrontImage, setLicenseFrontImage] = useState<{
    uri: string;
    type: string;
    name: string;
  } | null>(null);
  const [licenseBackImage, setLicenseBackImage] = useState<{
    uri: string;
    type: string;
    name: string;
  } | null>(null);
  const [selfieImage, setSelfieImage] = useState<{
    uri: string;
    type: string;
    name: string;
  } | null>(null);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<KYCFormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  /**
   * Format Date object to YYYY-MM-DD string for input
   */
  function formatDateForInput(date: Date | string): string {
    if (typeof date === 'string') {
      return date.split('T')[0];
    }
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Request camera and media library permissions
   */
  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera and photo library access are required to upload license images.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  /**
   * Show image picker options (camera or gallery)
   */
  const showImagePickerOptions = (field: 'front' | 'back') => {
    Alert.alert(
      'Select Image',
      'Choose an option to upload your license image',
      [
        {
          text: 'Take Photo',
          onPress: () => pickImageFromCamera(field),
        },
        {
          text: 'Choose from Gallery',
          onPress: () => pickImageFromGallery(field),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  /**
   * Pick image from camera
   */
  const pickImageFromCamera = async (field: 'front' | 'back') => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const imageData = {
          uri: asset.uri,
          type: 'image/jpeg',
          name: `license_${field}_${Date.now()}.jpg`,
        };

        if (field === 'front') {
          setLicenseFrontImage(imageData);
          setErrors((prev) => ({ ...prev, licenseFrontImage: undefined }));
        } else {
          setLicenseBackImage(imageData);
          setErrors((prev) => ({ ...prev, licenseBackImage: undefined }));
        }
      }
    } catch (error) {
      console.error('Error picking image from camera:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  /**
   * Pick image from gallery
   */
  const pickImageFromGallery = async (field: 'front' | 'back') => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const imageData = {
          uri: asset.uri,
          type: asset.mimeType || 'image/jpeg',
          name: `license_${field}_${Date.now()}.${asset.mimeType?.split('/')[1] || 'jpg'}`,
        };

        if (field === 'front') {
          setLicenseFrontImage(imageData);
          setErrors((prev) => ({ ...prev, licenseFrontImage: undefined }));
        } else {
          setLicenseBackImage(imageData);
          setErrors((prev) => ({ ...prev, licenseBackImage: undefined }));
        }
      }
    } catch (error) {
      console.error('Error picking image from gallery:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  /**
   * Capture selfie using camera
   */
  const captureSelfie = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4], // Portrait aspect ratio for selfie
        quality: 0.8,
        cameraType: ImagePicker.CameraType.front, // Use front camera for selfie
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const imageData = {
          uri: asset.uri,
          type: 'image/jpeg',
          name: `selfie_${Date.now()}.jpg`,
        };

        setSelfieImage(imageData);
      }
    } catch (error) {
      console.error('Error capturing selfie:', error);
      Alert.alert('Error', 'Failed to capture selfie. Please try again.');
    }
  };

  /**
   * Remove selected image
   */
  const removeImage = (field: 'front' | 'back') => {
    if (field === 'front') {
      setLicenseFrontImage(null);
    } else {
      setLicenseBackImage(null);
    }
  };

  /**
   * Clear field-specific error when user starts typing
   */
  const clearFieldError = (field: keyof KYCFormErrors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (generalError) {
      setGeneralError(null);
    }
  };

  /**
   * Validate form inputs
   */
  const validateForm = (): boolean => {
    const newErrors: KYCFormErrors = {};
    let isValid = true;

    // Validate license number
    if (!licenseNumber.trim()) {
      newErrors.licenseNumber = 'License number is required';
      isValid = false;
    }

    // Validate full name
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
      isValid = false;
    }

    // Validate date of birth
    if (!dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
      isValid = false;
    } else {
      const dob = new Date(dateOfBirth);
      if (isNaN(dob.getTime())) {
        newErrors.dateOfBirth = 'Invalid date format';
        isValid = false;
      } else if (dob >= new Date()) {
        newErrors.dateOfBirth = 'Date of birth must be in the past';
        isValid = false;
      }
    }

    // Validate license expiry date
    if (!licenseExpiryDate) {
      newErrors.licenseExpiryDate = 'License expiry date is required';
      isValid = false;
    } else {
      const expiry = new Date(licenseExpiryDate);
      if (isNaN(expiry.getTime())) {
        newErrors.licenseExpiryDate = 'Invalid date format';
        isValid = false;
      } else if (expiry <= new Date()) {
        newErrors.licenseExpiryDate = 'License must not be expired';
        isValid = false;
      }
    }

    // Validate front image
    if (!licenseFrontImage) {
      newErrors.licenseFrontImage = 'Front image of license is required';
      isValid = false;
    }

    // Validate back image
    if (!licenseBackImage) {
      newErrors.licenseBackImage = 'Back image of license is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    // Clear previous errors
    setErrors({});
    setGeneralError(null);

    // Validate form
    if (!validateForm()) {
      showError('Please fill in all required fields correctly');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData: KYCFormData = {
        licenseNumber: licenseNumber.trim(),
        fullName: fullName.trim(),
        dateOfBirth: new Date(dateOfBirth),
        licenseExpiryDate: new Date(licenseExpiryDate),
        licenseFrontImage: licenseFrontImage!,
        licenseBackImage: licenseBackImage!,
        selfieImage: selfieImage, // Include selfie
        previousSubmissionId,
      };

      await kycService.submitKYC(formData);

      // Show success message and navigate
      showSuccess(
        'Your KYC application has been submitted successfully. Verification typically takes 24-48 hours.',
        () => onNavigateToStatus()
      );
    } catch (error) {
      console.error('KYC submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit KYC application';
      setGeneralError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
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
              {previousSubmissionId ? 'Resubmit KYC' : 'Submit KYC Verification'}
            </Text>
            <Text className="text-base text-gray-600">
              Please provide your license details and upload clear photos of both sides
            </Text>
          </View>

          {/* General Error Message */}
          <ErrorMessage message={generalError} onDismiss={() => setGeneralError(null)} />

          {/* License Number */}
          <View className="mb-4">
            <Text className="text-sm text-gray-600 mb-2">License Number *</Text>
            <TextInput
              className={`border rounded-lg px-4 py-3 bg-gray-50 text-base text-gray-900 ${
                errors.licenseNumber ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter your license number"
              placeholderTextColor="#9CA3AF"
              value={licenseNumber}
              onChangeText={(text) => {
                setLicenseNumber(text);
                clearFieldError('licenseNumber');
              }}
              editable={!isSubmitting}
              autoCapitalize="characters"
            />
            {errors.licenseNumber && (
              <Text className="text-red-600 text-sm mt-1">{errors.licenseNumber}</Text>
            )}
          </View>

          {/* Full Name */}
          <View className="mb-4">
            <Text className="text-sm text-gray-600 mb-2">Full Name (as on license) *</Text>
            <TextInput
              className={`border rounded-lg px-4 py-3 bg-gray-50 text-base text-gray-900 ${
                errors.fullName ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter your full name"
              placeholderTextColor="#9CA3AF"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                clearFieldError('fullName');
              }}
              editable={!isSubmitting}
              autoCapitalize="words"
            />
            {errors.fullName && (
              <Text className="text-red-600 text-sm mt-1">{errors.fullName}</Text>
            )}
          </View>

          {/* Date of Birth */}
          <View className="mb-4">
            <Text className="text-sm text-gray-600 mb-2">Date of Birth *</Text>
            <View
              className={`flex-row items-center border rounded-lg px-4 py-3 bg-gray-50 ${
                errors.dateOfBirth ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <Calendar size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-gray-900"
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
                value={dateOfBirth}
                onChangeText={(text) => {
                  setDateOfBirth(text);
                  clearFieldError('dateOfBirth');
                }}
                editable={!isSubmitting}
                keyboardType="numbers-and-punctuation"
              />
            </View>
            {errors.dateOfBirth && (
              <Text className="text-red-600 text-sm mt-1">{errors.dateOfBirth}</Text>
            )}
          </View>

          {/* License Expiry Date */}
          <View className="mb-6">
            <Text className="text-sm text-gray-600 mb-2">License Expiry Date *</Text>
            <View
              className={`flex-row items-center border rounded-lg px-4 py-3 bg-gray-50 ${
                errors.licenseExpiryDate ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <Calendar size={20} color="#6B7280" />
              <TextInput
                className="flex-1 ml-3 text-base text-gray-900"
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
                value={licenseExpiryDate}
                onChangeText={(text) => {
                  setLicenseExpiryDate(text);
                  clearFieldError('licenseExpiryDate');
                }}
                editable={!isSubmitting}
                keyboardType="numbers-and-punctuation"
              />
            </View>
            {errors.licenseExpiryDate && (
              <Text className="text-red-600 text-sm mt-1">{errors.licenseExpiryDate}</Text>
            )}
          </View>

          {/* License Front Image */}
          <View className="mb-4">
            <Text className="text-sm text-gray-600 mb-2">License Front Image *</Text>
            {licenseFrontImage ? (
              <View className="relative">
                <Image
                  source={{ uri: licenseFrontImage.uri }}
                  className="w-full h-48 rounded-lg"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  className="absolute top-2 right-2 bg-red-500 rounded-full p-2"
                  onPress={() => removeImage('front')}
                  disabled={isSubmitting}
                >
                  <X size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                className={`border-2 border-dashed rounded-lg p-8 items-center ${
                  errors.licenseFrontImage ? 'border-red-300' : 'border-gray-300'
                }`}
                onPress={() => showImagePickerOptions('front')}
                disabled={isSubmitting}
              >
                <Upload size={40} color="#6B7280" />
                <Text className="text-gray-600 text-base mt-2">Tap to upload front image</Text>
                <Text className="text-gray-400 text-sm mt-1">JPEG, PNG (Max 5MB)</Text>
              </TouchableOpacity>
            )}
            {errors.licenseFrontImage && (
              <Text className="text-red-600 text-sm mt-1">{errors.licenseFrontImage}</Text>
            )}
          </View>

          {/* License Back Image */}
          <View className="mb-6">
            <Text className="text-sm text-gray-600 mb-2">License Back Image *</Text>
            {licenseBackImage ? (
              <View className="relative">
                <Image
                  source={{ uri: licenseBackImage.uri }}
                  className="w-full h-48 rounded-lg"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  className="absolute top-2 right-2 bg-red-500 rounded-full p-2"
                  onPress={() => removeImage('back')}
                  disabled={isSubmitting}
                >
                  <X size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                className={`border-2 border-dashed rounded-lg p-8 items-center ${
                  errors.licenseBackImage ? 'border-red-300' : 'border-gray-300'
                }`}
                onPress={() => showImagePickerOptions('back')}
                disabled={isSubmitting}
              >
                <Upload size={40} color="#6B7280" />
                <Text className="text-gray-600 text-base mt-2">Tap to upload back image</Text>
                <Text className="text-gray-400 text-sm mt-1">JPEG, PNG (Max 5MB)</Text>
              </TouchableOpacity>
            )}
            {errors.licenseBackImage && (
              <Text className="text-red-600 text-sm mt-1">{errors.licenseBackImage}</Text>
            )}
          </View>

          {/* Selfie Image (Optional but Recommended) */}
          <View className="mb-6">
            <Text className="text-sm text-gray-600 mb-2">
              Live Selfie (Recommended for faster verification)
            </Text>
            {selfieImage ? (
              <View className="relative">
                <Image
                  source={{ uri: selfieImage.uri }}
                  className="w-full h-64 rounded-lg"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  className="absolute top-2 right-2 bg-red-500 rounded-full p-2"
                  onPress={() => setSelfieImage(null)}
                  disabled={isSubmitting}
                >
                  <X size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                className="border-2 border-dashed rounded-lg p-8 items-center border-blue-300 bg-blue-50"
                onPress={captureSelfie}
                disabled={isSubmitting}
              >
                <Camera size={40} color="#0096c7" />
                <Text className="text-blue-700 text-base mt-2 font-semibold">
                  Tap to capture selfie
                </Text>
                <Text className="text-blue-600 text-sm mt-1 text-center">
                  Take a clear photo of your face for identity verification
                </Text>
              </TouchableOpacity>
            )}
            <View className="bg-yellow-50 rounded-lg p-3 mt-2">
              <Text className="text-yellow-800 text-xs">
                💡 Adding a selfie helps us verify your identity faster and prevents fraud
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            className={`rounded-lg py-4 items-center mb-4 ${
              isSubmitting ? 'bg-gray-400' : 'bg-[#0096c7]'
            }`}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white text-base font-semibold">
                {previousSubmissionId ? 'Resubmit KYC' : 'Submit KYC'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Info Text */}
          <View className="bg-blue-50 rounded-lg p-4">
            <Text className="text-blue-800 text-sm">
              ℹ️ Verification typically takes 24-48 hours. You'll be notified once your KYC is reviewed.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      <LoadingOverlay 
        visible={isSubmitting} 
        message="Uploading your documents..." 
      />
    </KeyboardAvoidingView>
  );
};
