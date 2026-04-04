/**
 * Face Verification Service
 * Handles face matching and verification with backend
 */

import * as ImagePicker from 'expo-image-picker';
import { API_URL } from '../config/api';

export interface FaceVerificationResult {
  verified: boolean;
  confidence: number;
  message: string;
}

export interface FaceComparisonResult {
  isMatch: boolean;
  confidence: number;
  similarity: number;
  message: string;
}

/**
 * Verify user identity by comparing captured image with saved profile picture
 */
export const verifyUserFace = async (token: string): Promise<FaceVerificationResult | null> => {
  try {
    // Request camera permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Camera permission is required for face verification');
    }

    // Capture image
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    // Prepare form data
    const formData = new FormData();
    const imageUri = result.assets[0].uri;
    
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'face-verify.jpg',
    } as any);

    // Send to backend
    const response = await fetch(`${API_URL}/face-verification/verify`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      return {
        verified: true,
        confidence: data.data.confidence,
        message: data.message,
      };
    } else {
      return {
        verified: false,
        confidence: data.data?.confidence || 0,
        message: data.error,
      };
    }
  } catch (error: any) {
    console.error('Face verification error:', error);
    throw new Error(error.message || 'Face verification failed');
  }
};

/**
 * Compare two images for face matching
 */
export const compareTwoFaces = async (
  token: string,
  image1Uri: string,
  image2Uri: string
): Promise<FaceComparisonResult> => {
  try {
    const formData = new FormData();
    
    formData.append('image1', {
      uri: image1Uri,
      type: 'image/jpeg',
      name: 'image1.jpg',
    } as any);

    formData.append('image2', {
      uri: image2Uri,
      type: 'image/jpeg',
      name: 'image2.jpg',
    } as any);

    const response = await fetch(`${API_URL}/face-verification/compare`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      return {
        isMatch: data.data.isMatch,
        confidence: data.data.confidence,
        similarity: data.data.similarity,
        message: data.message,
      };
    } else {
      throw new Error(data.error || 'Face comparison failed');
    }
  } catch (error: any) {
    console.error('Face comparison error:', error);
    throw new Error(error.message || 'Face comparison failed');
  }
};

/**
 * Pick image from gallery for comparison
 */
export const pickImageFromGallery = async (): Promise<string | null> => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Media library permission is required');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0].uri;
  } catch (error: any) {
    console.error('Image picker error:', error);
    throw new Error(error.message || 'Failed to pick image');
  }
};

/**
 * Capture image from camera
 */
export const captureImageFromCamera = async (): Promise<string | null> => {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Camera permission is required');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0].uri;
  } catch (error: any) {
    console.error('Camera error:', error);
    throw new Error(error.message || 'Failed to capture image');
  }
};
