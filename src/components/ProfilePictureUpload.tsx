/**
 * ProfilePictureUpload Component
 * 
 * Reusable component for uploading profile pictures with face validation.
 * Provides camera and gallery options, image preview, upload progress,
 * and error handling for face validation failures.
 * 
 * Features:
 * - Image picker with camera and gallery options
 * - Image preview before upload
 * - Upload progress indicator
 * - Face validation error handling with retry option
 * - User-friendly error messages and guidance
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  Upload,
  X,
  AlertCircle,
  CheckCircle,
} from 'lucide-react-native';

export interface ProfilePictureUploadProps {
  currentImageUrl?: string | null;
  onUploadStart?: () => void;
  onUploadSuccess?: (imageUri: string) => void;
  onUploadError?: (error: string) => void;
  onImageSelected?: (imageUri: string) => void;
  disabled?: boolean;
}

export const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentImageUrl,
  onUploadStart,
  onUploadSuccess,
  onUploadError,
  onImageSelected,
  disabled = false,
}) => {
  // State management
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  /**
   * Request camera permissions
   */
  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to take a profile picture.'
      );
      return false;
    }
    return true;
  };

  /**
   * Request media library permissions
   */
  const requestMediaLibraryPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Media library permission is required to select a profile picture.'
      );
      return false;
    }
    return true;
  };

  /**
   * Handle camera capture
   */
  const handleCapturePhoto = async () => {
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        cameraType: ImagePicker.CameraType.front,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        setError(null);
        setShowSuccess(false);
        
        if (onImageSelected) {
          onImageSelected(imageUri);
        }
      }
    } catch (err) {
      console.error('Error capturing photo:', err);
      const errorMessage = 'Failed to capture photo. Please try again.';
      setError(errorMessage);
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    }
  };

  /**
   * Handle image selection from gallery
   */
  const handlePickImage = async () => {
    try {
      const hasPermission = await requestMediaLibraryPermission();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setSelectedImage(imageUri);
        setError(null);
        setShowSuccess(false);
        
        if (onImageSelected) {
          onImageSelected(imageUri);
        }
      }
    } catch (err) {
      console.error('Error picking image:', err);
      const errorMessage = 'Failed to select image. Please try again.';
      setError(errorMessage);
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    }
  };

  /**
   * Show image picker options
   */
  const showImagePickerOptions = () => {
    Alert.alert(
      'Select Profile Picture',
      'Choose how you want to provide your profile picture',
      [
        {
          text: 'Take Photo',
          onPress: handleCapturePhoto,
        },
        {
          text: 'Choose from Gallery',
          onPress: handlePickImage,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  /**
   * Handle retry after error
   */
  const handleRetry = () => {
    setError(null);
    setShowSuccess(false);
    showImagePickerOptions();
  };

  /**
   * Clear selected image
   */
  const handleClearImage = () => {
    setSelectedImage(null);
    setError(null);
    setShowSuccess(false);
    setUploadProgress(0);
  };

  /**
   * Simulate upload progress (for visual feedback)
   * In real implementation, this would track actual upload progress
   */
  const simulateUploadProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);
    return interval;
  };

  /**
   * Get the display image URL
   */
  const getDisplayImageUrl = (): string | null => {
    if (selectedImage) {
      return selectedImage;
    }
    if (currentImageUrl) {
      return currentImageUrl;
    }
    return null;
  };

  /**
   * Render error display
   */
  const renderError = () => {
    if (!error) return null;

    return (
      <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <View className="flex-row items-start">
          <AlertCircle size={20} color="#DC2626" />
          <View className="flex-1 ml-2">
            <Text className="text-sm font-medium text-red-800 mb-1">
              Upload Failed
            </Text>
            <Text className="text-sm text-red-700">{error}</Text>
            
            {/* Guidance for face validation errors */}
            {error.toLowerCase().includes('face') && (
              <View className="mt-2 pt-2 border-t border-red-200">
                <Text className="text-xs font-medium text-red-800 mb-1">
                  Tips for a good profile picture:
                </Text>
                <Text className="text-xs text-red-700">
                  • Face the camera directly{'\n'}
                  • Ensure good lighting{'\n'}
                  • Remove sunglasses or masks{'\n'}
                  • Keep a neutral expression{'\n'}
                  • Avoid blurry images
                </Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Retry Button */}
        <TouchableOpacity
          onPress={handleRetry}
          className="bg-red-600 rounded-lg py-2 mt-3"
          activeOpacity={0.7}
        >
          <Text className="text-white text-center font-semibold text-sm">
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  /**
   * Render success message
   */
  const renderSuccess = () => {
    if (!showSuccess) return null;

    return (
      <View className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <View className="flex-row items-center">
          <CheckCircle size={20} color="#10B981" />
          <Text className="text-sm font-medium text-green-800 ml-2">
            Profile picture uploaded successfully!
          </Text>
        </View>
      </View>
    );
  };

  /**
   * Render upload progress
   */
  const renderUploadProgress = () => {
    if (!isUploading) return null;

    return (
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm text-gray-600">Uploading...</Text>
          <Text className="text-sm font-semibold text-[#0096c7]">
            {uploadProgress}%
          </Text>
        </View>
        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <View
            className="h-full bg-[#0096c7]"
            style={{ width: `${uploadProgress}%` }}
          />
        </View>
      </View>
    );
  };

  const displayImageUrl = getDisplayImageUrl();

  return (
    <View>
      {/* Error Display */}
      {renderError()}

      {/* Success Display */}
      {renderSuccess()}

      {/* Upload Progress */}
      {renderUploadProgress()}

      {/* Image Preview */}
      {displayImageUrl ? (
        <View className="mb-4">
          <View className="relative">
            <Image
              source={{ uri: displayImageUrl }}
              className="w-full h-64 rounded-lg"
              resizeMode="cover"
            />
            
            {/* Loading Overlay */}
            {isUploading && (
              <View className="absolute inset-0 bg-black/50 rounded-lg items-center justify-center">
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text className="text-white font-semibold mt-2">
                  Validating face...
                </Text>
              </View>
            )}
            
            {/* Clear Button */}
            {!isUploading && selectedImage && (
              <TouchableOpacity
                onPress={handleClearImage}
                className="absolute top-2 right-2 bg-red-500 rounded-full p-2"
                activeOpacity={0.7}
              >
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>

          {/* Change Image Button */}
          {!isUploading && (
            <TouchableOpacity
              onPress={showImagePickerOptions}
              disabled={disabled}
              className="border border-gray-300 rounded-lg py-3 flex-row items-center justify-center mt-3"
              activeOpacity={0.7}
            >
              <Upload size={20} color="#6B7280" />
              <Text className="text-gray-700 font-medium ml-2">
                Change Image
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        /* Upload Buttons */
        <View className="space-y-3">
          {/* Camera Button */}
          <TouchableOpacity
            onPress={handleCapturePhoto}
            disabled={disabled || isUploading}
            className={`rounded-lg py-4 flex-row items-center justify-center ${
              disabled || isUploading ? 'bg-gray-300' : 'bg-[#0096c7]'
            }`}
            activeOpacity={0.7}
          >
            <Camera size={20} color="#FFFFFF" />
            <Text className="text-white font-semibold ml-2">
              Take Photo
            </Text>
          </TouchableOpacity>

          {/* Gallery Button */}
          <TouchableOpacity
            onPress={handlePickImage}
            disabled={disabled || isUploading}
            className={`border rounded-lg py-4 flex-row items-center justify-center ${
              disabled || isUploading
                ? 'border-gray-300 bg-gray-100'
                : 'border-gray-300'
            }`}
            activeOpacity={0.7}
          >
            <Upload size={20} color="#6B7280" />
            <Text className="text-gray-700 font-semibold ml-2">
              Choose from Gallery
            </Text>
          </TouchableOpacity>

          {/* File Requirements */}
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <Text className="text-xs font-medium text-blue-800 mb-1">
              Profile Picture Requirements:
            </Text>
            <Text className="text-xs text-blue-700">
              • Clear frontal face photo{'\n'}
              • Good lighting, no shadows{'\n'}
              • No sunglasses or face coverings{'\n'}
              • Supported formats: JPEG, PNG{'\n'}
              • Maximum size: 5MB
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};
