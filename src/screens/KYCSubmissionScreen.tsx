/**
 * KYC Submission Screen (Redesigned)
 *
 * Enhanced KYC submission form with comprehensive data collection:
 * - Government issuing authority selection
 * - License office selection
 * - Address collection
 * - Father's name
 * - Contact number
 * - OCR auto-verification with 80% confidence threshold
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
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Upload, X, Calendar, MapPin, Phone, User, Building, Landmark } from 'lucide-react-native';
import kycService from '../services/kycService';
import { KYCFormData, KYCFormErrors } from '../types/kyc';
import { ErrorMessage } from '../components/ErrorMessage';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { SelfieCapture } from '../components/SelfieCapture';
import { showSuccess, showError } from '../utils/toast';

interface KYCSubmissionScreenProps {
  onNavigateToStatus: () => void;
  onNavigateBack: () => void;
  previousSubmissionId?: string;
  previousData?: Partial<KYCFormData>;
}

const LICENSE_OFFICES = [
  { label: 'Kathmandu Transport Office', value: 'Kathmandu Transport Office' },
  { label: 'Lalitpur Transport Office', value: 'Lalitpur Transport Office' },
  { label: 'Bhaktapur Transport Office', value: 'Bhaktapur Transport Office' },
  { label: 'Pokhara Transport Office', value: 'Pokhara Transport Office' },
  { label: 'Chitwan Transport Office', value: 'Chitwan Transport Office' },
  { label: 'Rupandehi Transport Office', value: 'Rupandehi Transport Office' },
  { label: 'Kaski Transport Office', value: 'Kaski Transport Office' },
  { label: 'Jhapa Transport Office', value: 'Jhapa Transport Office' },
  { label: 'Morang Transport Office', value: 'Morang Transport Office' },
  { label: 'Sunsari Transport Office', value: 'Sunsari Transport Office' },
  { label: 'Banke Transport Office', value: 'Banke Transport Office' },
  { label: 'Kailali Transport Office', value: 'Kailali Transport Office' },
  { label: 'Other', value: 'Other' },
];

export const KYCSubmissionScreen: React.FC<KYCSubmissionScreenProps> = ({
  onNavigateToStatus,
  onNavigateBack,
  previousSubmissionId,
  previousData,
}) => {
  // Form state - Personal Information
  const [licenseNumber, setLicenseNumber] = useState(previousData?.licenseNumber || '');
  const [fullName, setFullName] = useState(previousData?.fullName || '');
  const [fatherName, setFatherName] = useState(previousData?.fatherName || '');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(
    previousData?.dateOfBirth ? new Date(previousData.dateOfBirth) : null
  );
  
  // Form state - License Information
  const [licenseExpiryDate, setLicenseExpiryDate] = useState<Date | null>(
    previousData?.licenseExpiryDate ? new Date(previousData.licenseExpiryDate) : null
  );
  const [licenseIssueDate, setLicenseIssueDate] = useState<Date | null>(
    previousData?.licenseIssueDate ? new Date(previousData.licenseIssueDate) : null
  );
  const [issuedBy, setIssuedBy] = useState(previousData?.issuedBy || 'Government of Nepal');
  const [licenseOffice, setLicenseOffice] = useState(previousData?.licenseOffice || '');
  const [showOfficeDropdown, setShowOfficeDropdown] = useState(false);
  const [customLicenseOffice, setCustomLicenseOffice] = useState('');
  
  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentDatePicker, setCurrentDatePicker] = useState<'dob' | 'expiry' | 'issue' | null>(null);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  
  // Form state - Contact Information
  const [address, setAddress] = useState(previousData?.address || '');
  const [contactNumber, setContactNumber] = useState(previousData?.contactNumber || '');
  
  // Image state
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
  const [faceValidationError, setFaceValidationError] = useState<string | null>(null);

  /**
   * Format Date object to YYYY-MM-DD string for display
   */
  function formatDateForDisplay(date: Date | null): string {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Open date picker for a specific field
   */
  const openDatePicker = (field: 'dob' | 'expiry' | 'issue') => {
    setCurrentDatePicker(field);
    // Set initial date based on field
    if (field === 'dob') {
      setTempDate(dateOfBirth || new Date(2000, 0, 1));
    } else if (field === 'expiry') {
      setTempDate(licenseExpiryDate || new Date(new Date().setFullYear(new Date().getFullYear() + 5)));
    } else {
      setTempDate(licenseIssueDate || new Date());
    }
    setShowDatePicker(true);
  };

  /**
   * Handle date change from picker
   */
  const onDateChange = (event: any, selectedDate?: Date) => {
    if (event.type === 'set' && selectedDate) {
      setTempDate(selectedDate);
    } else {
      setShowDatePicker(false);
      setCurrentDatePicker(null);
    }
  };

  /**
   * Confirm selected date
   */
  const confirmDate = () => {
    if (tempDate && currentDatePicker) {
      if (currentDatePicker === 'dob') {
        setDateOfBirth(tempDate);
        clearFieldError('dateOfBirth');
      } else if (currentDatePicker === 'expiry') {
        setLicenseExpiryDate(tempDate);
        clearFieldError('licenseExpiryDate');
      } else if (currentDatePicker === 'issue') {
        setLicenseIssueDate(tempDate);
      }
    }
    setShowDatePicker(false);
    setCurrentDatePicker(null);
  };

  /**
   * Cancel date picker
   */
  const cancelDate = () => {
    setShowDatePicker(false);
    setCurrentDatePicker(null);
    setTempDate(null);
  };

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
        
        // Determine file extension and MIME type
        const uri = asset.uri;
        const uriParts = uri.split('.');
        const fileExtension = uriParts[uriParts.length - 1].toLowerCase();
        
        // Map extension to MIME type, default to jpeg
        let mimeType = 'image/jpeg';
        if (fileExtension === 'png') {
          mimeType = 'image/png';
        } else if (fileExtension === 'jpg' || fileExtension === 'jpeg') {
          mimeType = 'image/jpeg';
        }
        
        const imageData = {
          uri: asset.uri,
          type: mimeType,
          name: `license_${field}_${Date.now()}.${fileExtension}`,
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
  const handleSelfieCapture = (imageData: { uri: string; type: string; name: string }) => {
    if (imageData.uri) {
      setSelfieImage(imageData);
      clearFieldError('selfieImage');
      setFaceValidationError(null); // Clear face validation error on new capture
    } else {
      setSelfieImage(null);
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

    // Validate father's name
    if (!fatherName.trim()) {
      newErrors.fatherName = "Father's name is required";
      isValid = false;
    }

    // Validate date of birth
    if (!dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
      isValid = false;
    } else if (dateOfBirth >= new Date()) {
      newErrors.dateOfBirth = 'Date of birth must be in the past';
      isValid = false;
    }

    // Validate license expiry date
    if (!licenseExpiryDate) {
      newErrors.licenseExpiryDate = 'License expiry date is required';
      isValid = false;
    } else if (licenseExpiryDate <= new Date()) {
      newErrors.licenseExpiryDate = 'License must not be expired';
      isValid = false;
    }

    // Validate issued by
    if (!issuedBy) {
      newErrors.issuedBy = 'Issuing authority is required';
      isValid = false;
    }

    // Validate license office
    const finalLicenseOffice = licenseOffice === 'Other' ? customLicenseOffice : licenseOffice;
    if (!finalLicenseOffice) {
      newErrors.licenseOffice = 'License office is required';
      isValid = false;
    }

    // Validate address
    if (!address.trim()) {
      newErrors.address = 'Address is required';
      isValid = false;
    }

    // Validate contact number
    if (!contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
      isValid = false;
    } else if (!/^[0-9]{10}$/.test(contactNumber.replace(/[\s\-\+]/g, ''))) {
      newErrors.contactNumber = 'Please enter a valid 10-digit contact number';
      isValid = false;
    }

    // Validate front image
    if (!licenseFrontImage) {
      newErrors.licenseFrontImage = 'Front image of license is required';
      isValid = false;
    }

    // Validate selfie image
    if (!selfieImage) {
      newErrors.selfieImage = 'Selfie image is required';
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
      const finalLicenseOffice = licenseOffice === 'Other' ? customLicenseOffice : licenseOffice;

      const formData: KYCFormData = {
        licenseNumber: licenseNumber.trim(),
        fullName: fullName.trim(),
        fatherName: fatherName.trim(),
        dateOfBirth: dateOfBirth!,
        licenseExpiryDate: licenseExpiryDate!,
        licenseIssueDate: licenseIssueDate || undefined,
        issuedBy,
        licenseOffice: finalLicenseOffice,
        address: address.trim(),
        contactNumber: contactNumber.trim(),
        licenseFrontImage: licenseFrontImage!,
        licenseBackImage: licenseBackImage!,
        selfieImage: selfieImage,
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
      
      // Check if error is related to face validation
      if (errorMessage.toLowerCase().includes('face') || 
          errorMessage.toLowerCase().includes('selfie') ||
          errorMessage.toLowerCase().includes('identity')) {
        setFaceValidationError(errorMessage);
      }
      
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
              Please provide your license details and upload clear photos
            </Text>
          </View>

          {/* General Error Message */}
          <ErrorMessage message={generalError} onDismiss={() => setGeneralError(null)} />

          {/* Section: Personal Information */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-800 mb-3">Personal Information</Text>
            
            {/* Full Name */}
            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-2">Full Name (as on license) *</Text>
              <View className={`flex-row items-center border rounded-lg px-4 py-3 bg-gray-50 ${
                errors.fullName ? 'border-red-300' : 'border-gray-300'
              }`}>
                <User size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-900"
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
              </View>
              {errors.fullName && (
                <Text className="text-red-600 text-sm mt-1">{errors.fullName}</Text>
              )}
            </View>

            {/* Father's Name */}
            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-2">Father's Name (as on license) *</Text>
              <View className={`flex-row items-center border rounded-lg px-4 py-3 bg-gray-50 ${
                errors.fatherName ? 'border-red-300' : 'border-gray-300'
              }`}>
                <User size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-900"
                  placeholder="Enter your father's name"
                  placeholderTextColor="#9CA3AF"
                  value={fatherName}
                  onChangeText={(text) => {
                    setFatherName(text);
                    clearFieldError('fatherName');
                  }}
                  editable={!isSubmitting}
                  autoCapitalize="words"
                />
              </View>
              {errors.fatherName && (
                <Text className="text-red-600 text-sm mt-1">{errors.fatherName}</Text>
              )}
            </View>

            {/* Date of Birth */}
            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-2">Date of Birth *</Text>
              <TouchableOpacity
                onPress={() => !isSubmitting && openDatePicker('dob')}
                disabled={isSubmitting}
                className={`flex-row items-center justify-between border rounded-lg px-4 py-3 bg-gray-50 ${
                  errors.dateOfBirth ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <View className="flex-row items-center">
                  <Calendar size={20} color="#6B7280" />
                  <Text className={`ml-3 text-base ${
                    dateOfBirth ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {dateOfBirth ? formatDateForDisplay(dateOfBirth) : 'Select date of birth'}
                  </Text>
                </View>
                <Text className="text-gray-400">▼</Text>
              </TouchableOpacity>
              {errors.dateOfBirth && (
                <Text className="text-red-600 text-sm mt-1">{errors.dateOfBirth}</Text>
              )}
            </View>
          </View>

          {/* Section: License Information */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-800 mb-3">License Information</Text>

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

            {/* Issued By */}
            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-2">Issued By *</Text>
              <View className={`flex-row items-center border rounded-lg px-4 py-3 bg-gray-50 ${
                errors.issuedBy ? 'border-red-300' : 'border-gray-300'
              }`}>
                <Landmark size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-900"
                  value={issuedBy}
                  onChangeText={(text) => {
                    setIssuedBy(text);
                    clearFieldError('issuedBy');
                  }}
                  editable={!isSubmitting}
                />
              </View>
              {errors.issuedBy && (
                <Text className="text-red-600 text-sm mt-1">{errors.issuedBy}</Text>
              )}
            </View>

            {/* License Office */}
            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-2">License Office *</Text>
              <View className={`border rounded-lg bg-gray-50 ${
                errors.licenseOffice ? 'border-red-300' : 'border-gray-300'
              }`}>
                <TouchableOpacity
                  onPress={() => !isSubmitting && setShowOfficeDropdown(!showOfficeDropdown)}
                  className="flex-row items-center px-4 py-3"
                  disabled={isSubmitting}
                >
                  <Building size={20} color="#6B7280" />
                  <Text className="flex-1 ml-3 text-base text-gray-900">
                    {licenseOffice || 'Select license office'}
                  </Text>
                  <Text className="text-gray-400">{showOfficeDropdown ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {showOfficeDropdown && (
                  <ScrollView className="max-h-48 border-t border-gray-200">
                    {LICENSE_OFFICES.map((office) => (
                      <TouchableOpacity
                        key={office.value}
                        onPress={() => {
                          setLicenseOffice(office.value);
                          setShowOfficeDropdown(false);
                          clearFieldError('licenseOffice');
                        }}
                        className="px-4 py-3 border-b border-gray-100"
                      >
                        <Text className="text-base text-gray-800">{office.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
              {licenseOffice === 'Other' && (
                <TextInput
                  className={`mt-2 border rounded-lg px-4 py-3 bg-gray-50 text-base text-gray-900 ${
                    errors.licenseOffice ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter custom license office"
                  placeholderTextColor="#9CA3AF"
                  value={customLicenseOffice}
                  onChangeText={(text) => {
                    setCustomLicenseOffice(text);
                    clearFieldError('licenseOffice');
                  }}
                  editable={!isSubmitting}
                />
              )}
              {errors.licenseOffice && (
                <Text className="text-red-600 text-sm mt-1">{errors.licenseOffice}</Text>
              )}
            </View>

            {/* License Expiry Date */}
            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-2">License Expiry Date *</Text>
              <TouchableOpacity
                onPress={() => !isSubmitting && openDatePicker('expiry')}
                disabled={isSubmitting}
                className={`flex-row items-center justify-between border rounded-lg px-4 py-3 bg-gray-50 ${
                  errors.licenseExpiryDate ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <View className="flex-row items-center">
                  <Calendar size={20} color="#6B7280" />
                  <Text className={`ml-3 text-base ${
                    licenseExpiryDate ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {licenseExpiryDate ? formatDateForDisplay(licenseExpiryDate) : 'Select expiry date'}
                  </Text>
                </View>
                <Text className="text-gray-400">▼</Text>
              </TouchableOpacity>
              {errors.licenseExpiryDate && (
                <Text className="text-red-600 text-sm mt-1">{errors.licenseExpiryDate}</Text>
              )}
            </View>

            {/* License Issue Date (Optional) */}
            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-2">License Issue Date (Optional)</Text>
              <TouchableOpacity
                onPress={() => !isSubmitting && openDatePicker('issue')}
                disabled={isSubmitting}
                className={`flex-row items-center justify-between border rounded-lg px-4 py-3 bg-gray-50 border-gray-300`}
              >
                <View className="flex-row items-center">
                  <Calendar size={20} color="#6B7280" />
                  <Text className={`ml-3 text-base ${
                    licenseIssueDate ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {licenseIssueDate ? formatDateForDisplay(licenseIssueDate) : 'Select issue date (optional)'}
                  </Text>
                </View>
                <Text className="text-gray-400">▼</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Section: Contact Information */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-800 mb-3">Contact Information</Text>
            
            {/* Address */}
            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-2">Full Address *</Text>
              <View className={`flex-row items-start border rounded-lg px-4 py-3 bg-gray-50 ${
                errors.address ? 'border-red-300' : 'border-gray-300'
              }`}>
                <MapPin size={20} color="#6B7280" className="mt-1" />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-900"
                  placeholder="Enter your full address"
                  placeholderTextColor="#9CA3AF"
                  value={address}
                  onChangeText={(text) => {
                    setAddress(text);
                    clearFieldError('address');
                  }}
                  editable={!isSubmitting}
                  multiline
                  numberOfLines={3}
                />
              </View>
              {errors.address && (
                <Text className="text-red-600 text-sm mt-1">{errors.address}</Text>
              )}
            </View>

            {/* Contact Number */}
            <View className="mb-4">
              <Text className="text-sm text-gray-600 mb-2">Contact Number *</Text>
              <View className={`flex-row items-center border rounded-lg px-4 py-3 bg-gray-50 ${
                errors.contactNumber ? 'border-red-300' : 'border-gray-300'
              }`}>
                <Phone size={20} color="#6B7280" />
                <TextInput
                  className="flex-1 ml-3 text-base text-gray-900"
                  placeholder="98XXXXXXXX"
                  placeholderTextColor="#9CA3AF"
                  value={contactNumber}
                  onChangeText={(text) => {
                    setContactNumber(text);
                    clearFieldError('contactNumber');
                  }}
                  editable={!isSubmitting}
                  keyboardType="phone-pad"
                />
              </View>
              {errors.contactNumber && (
                <Text className="text-red-600 text-sm mt-1">{errors.contactNumber}</Text>
              )}
            </View>
          </View>

          {/* Section: License Images */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-800 mb-3">License Images</Text>
            
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
              <Text className="text-sm text-gray-600 mb-2">License Back Image (Optional)</Text>
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
            </View>
          </View>

          {/* Section: Selfie */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-800 mb-3">Live Selfie</Text>
            <SelfieCapture
              onCapture={handleSelfieCapture}
              currentImage={selfieImage}
              disabled={isSubmitting}
              validationError={faceValidationError}
            />
            {errors.selfieImage && (
              <Text className="text-red-600 text-sm mt-1">{errors.selfieImage}</Text>
            )}
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
              ℹ️ Verification typically takes 24-48 hours. Applications with high confidence scores (≥80%) may be auto-approved instantly.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={cancelDate}
        >
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-white rounded-t-3xl">
              {/* Modal Header */}
              <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
                <TouchableOpacity onPress={cancelDate}>
                  <Text className="text-[#0096c7] text-base font-semibold">Cancel</Text>
                </TouchableOpacity>
                <Text className="text-lg font-bold text-gray-900">
                  {currentDatePicker === 'dob' && 'Date of Birth'}
                  {currentDatePicker === 'expiry' && 'Expiry Date'}
                  {currentDatePicker === 'issue' && 'Issue Date'}
                </Text>
                <TouchableOpacity onPress={confirmDate}>
                  <Text className="text-[#0096c7] text-base font-semibold">Done</Text>
                </TouchableOpacity>
              </View>

              {/* Date Picker */}
              <View className="bg-white pb-6">
                <DateTimePicker
                  value={tempDate || new Date()}
                  mode="date"
                  display="spinner"
                  onChange={onDateChange}
                  maximumDate={
                    currentDatePicker === 'dob' ? new Date() :
                    currentDatePicker === 'issue' ? new Date() : undefined
                  }
                  minimumDate={
                    currentDatePicker === 'dob' ? new Date(1900, 0, 1) :
                    currentDatePicker === 'expiry' ? new Date() : undefined
                  }
                  textColor="#000000"
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Android Date Picker */}
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={tempDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            if (event.type === 'set' && selectedDate) {
              if (currentDatePicker === 'dob') {
                setDateOfBirth(selectedDate);
                clearFieldError('dateOfBirth');
              } else if (currentDatePicker === 'expiry') {
                setLicenseExpiryDate(selectedDate);
                clearFieldError('licenseExpiryDate');
              } else if (currentDatePicker === 'issue') {
                setLicenseIssueDate(selectedDate);
              }
            }
            setShowDatePicker(false);
            setCurrentDatePicker(null);
          }}
          maximumDate={
            currentDatePicker === 'dob' ? new Date() :
            currentDatePicker === 'issue' ? new Date() : undefined
          }
          minimumDate={
            currentDatePicker === 'dob' ? new Date(1900, 0, 1) :
            currentDatePicker === 'expiry' ? new Date() : undefined
          }
        />
      )}

      {/* Loading Overlay */}
      <LoadingOverlay
        visible={isSubmitting}
        message="Uploading your documents and processing with OCR..."
      />
    </KeyboardAvoidingView>
  );
};
