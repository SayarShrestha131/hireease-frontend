/**
 * Person Recognition Service
 * Register and verify persons with face recognition
 */

import * as ImagePicker from 'expo-image-picker';
import { getCurrentApiUrl } from '../config/api';

export interface RegisterPersonData {
  fullName: string;
  licenseNumber: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  notes?: string;
}

export interface VerifyPersonData {
  licenseNumber: string;
}

/**
 * Register new person with photo
 */
export const registerPerson = async (data: RegisterPersonData, photoUri: string) => {
  try {
    const formData = new FormData();
    
    formData.append('fullName', data.fullName);
    formData.append('licenseNumber', data.licenseNumber);
    if (data.email) formData.append('email', data.email);
    if (data.phone) formData.append('phone', data.phone);
    if (data.address) formData.append('address', data.address);
    if (data.dateOfBirth) formData.append('dateOfBirth', data.dateOfBirth);
    if (data.notes) formData.append('notes', data.notes);
    
    formData.append('photo', {
      uri: photoUri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any);

    const response = await fetch(`${getCurrentApiUrl()}/registered-persons/register`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Register person error:', error);
    throw error;
  }
};

/**
 * Verify person by license number and captured photo
 */
export const verifyPerson = async (licenseNumber: string, photoUri: string) => {
  try {
    const formData = new FormData();
    
    formData.append('licenseNumber', licenseNumber);
    formData.append('photo', {
      uri: photoUri,
      type: 'image/jpeg',
      name: 'verify.jpg',
    } as any);

    const response = await fetch(`${getCurrentApiUrl()}/registered-persons/verify`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Verify person error:', error);
    throw error;
  }
};

/**
 * Identify unknown person from photo
 */
export const identifyPerson = async (photoUri: string) => {
  try {
    const formData = new FormData();
    
    formData.append('photo', {
      uri: photoUri,
      type: 'image/jpeg',
      name: 'identify.jpg',
    } as any);

    const response = await fetch(`${getCurrentApiUrl()}/registered-persons/identify`, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Identify person error:', error);
    throw error;
  }
};

/**
 * Get all registered persons
 */
export const getAllPersons = async () => {
  try {
    const response = await fetch(`${getCurrentApiUrl()}/registered-persons`);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Get all persons error:', error);
    throw error;
  }
};

/**
 * Capture photo from camera
 */
export const capturePhoto = async (): Promise<string | null> => {
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
    console.error('Capture photo error:', error);
    throw error;
  }
};

/**
 * Pick photo from gallery
 */
export const pickPhoto = async (): Promise<string | null> => {
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
    console.error('Pick photo error:', error);
    throw error;
  }
};
