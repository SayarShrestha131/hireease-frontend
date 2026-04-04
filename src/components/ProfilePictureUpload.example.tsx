/**
 * ProfilePictureUpload Component - Usage Example
 * 
 * This file demonstrates how to use the ProfilePictureUpload component
 * in different scenarios.
 */

import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { ProfilePictureUpload } from './ProfilePictureUpload';
import apiClient from '../services/apiClient';

/**
 * Example 1: Basic Usage
 * Simple profile picture upload without any callbacks
 */
export const BasicExample = () => {
  return (
    <View className="p-4">
      <Text className="text-lg font-bold mb-4">Upload Profile Picture</Text>
      <ProfilePictureUpload />
    </View>
  );
};

/**
 * Example 2: With Current Image
 * Display existing profile picture with option to change
 */
export const WithCurrentImageExample = () => {
  const currentImageUrl = 'https://api.example.com/profile/picture/user123.jpg';
  
  return (
    <View className="p-4">
      <Text className="text-lg font-bold mb-4">Update Profile Picture</Text>
      <ProfilePictureUpload currentImageUrl={currentImageUrl} />
    </View>
  );
};

/**
 * Example 3: With Upload Handling
 * Handle the complete upload flow with API integration
 */
export const WithUploadHandlingExample = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImageSelected = async (imageUri: string) => {
    try {
      setIsUploading(true);
      setUploadError(null);

      // Create form data
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('profilePicture', {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      // Upload to server
      const response = await apiClient.post('/profile/picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        Alert.alert('Success', 'Profile picture uploaded successfully!');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Upload failed';
      setUploadError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View className="p-4">
      <Text className="text-lg font-bold mb-4">Upload with API Integration</Text>
      <ProfilePictureUpload
        onImageSelected={handleImageSelected}
        disabled={isUploading}
      />
      {uploadError && (
        <Text className="text-red-600 mt-2">{uploadError}</Text>
      )}
    </View>
  );
};

/**
 * Example 4: With All Callbacks
 * Full control over the upload lifecycle
 */
export const WithAllCallbacksExample = () => {
  const [status, setStatus] = useState<string>('idle');

  const handleUploadStart = () => {
    setStatus('Uploading...');
    console.log('Upload started');
  };

  const handleUploadSuccess = (imageUri: string) => {
    setStatus('Upload successful!');
    console.log('Upload succeeded:', imageUri);
    Alert.alert('Success', 'Profile picture uploaded successfully!');
  };

  const handleUploadError = (error: string) => {
    setStatus(`Error: ${error}`);
    console.error('Upload failed:', error);
  };

  const handleImageSelected = (imageUri: string) => {
    console.log('Image selected:', imageUri);
    setStatus('Image selected, ready to upload');
  };

  return (
    <View className="p-4">
      <Text className="text-lg font-bold mb-4">Full Callback Control</Text>
      <Text className="text-sm text-gray-600 mb-4">Status: {status}</Text>
      <ProfilePictureUpload
        onUploadStart={handleUploadStart}
        onUploadSuccess={handleUploadSuccess}
        onUploadError={handleUploadError}
        onImageSelected={handleImageSelected}
      />
    </View>
  );
};

/**
 * Example 5: Disabled State
 * Disable upload during form submission or other operations
 */
export const DisabledExample = () => {
  const [isFormSubmitting, setIsFormSubmitting] = useState(true);

  return (
    <View className="p-4">
      <Text className="text-lg font-bold mb-4">Disabled During Form Submission</Text>
      <Text className="text-sm text-gray-600 mb-4">
        Upload is disabled while form is being submitted
      </Text>
      <ProfilePictureUpload disabled={isFormSubmitting} />
    </View>
  );
};

/**
 * Example 6: Integration with Profile Screen
 * How to use in a real profile management screen
 */
export const ProfileScreenIntegrationExample = () => {
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleImageSelected = async (imageUri: string) => {
    try {
      setIsUpdating(true);

      // Upload to server
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'profile.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('profilePicture', {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      const response = await apiClient.post('/profile/picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        // Update local state with new image URL
        setProfilePictureUrl(response.data.data.user.profilePicture);
        Alert.alert('Success', 'Profile picture updated successfully!');
      }
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to upload profile picture'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <View className="p-4">
      <Text className="text-2xl font-bold mb-2">My Profile</Text>
      <Text className="text-gray-600 mb-6">Update your profile information</Text>

      <View className="bg-white rounded-lg p-6 shadow-sm">
        <Text className="text-lg font-bold mb-4">Profile Picture</Text>
        <ProfilePictureUpload
          currentImageUrl={profilePictureUrl}
          onImageSelected={handleImageSelected}
          disabled={isUpdating}
        />
      </View>

      {/* Other profile fields would go here */}
    </View>
  );
};
