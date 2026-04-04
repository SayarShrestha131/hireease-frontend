/**
 * Admin Register Person Screen
 * Admin can register people with their details and photos
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getApiBaseUrl } from '../../config/api';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  onNavigateBack: () => void;
}

export const AdminRegisterPersonScreen: React.FC<Props> = ({ onNavigateBack }) => {
  const { token } = useAuth();
  const [fullName, setFullName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validateImageDimensions = async (uri: string): Promise<boolean> => {
    return new Promise((resolve) => {
      Image.getSize(
        uri,
        (width, height) => {
          if (width < 300 || height < 300) {
            Alert.alert('Photo Too Small', 'Please upload a photo with minimum size 300x300.');
            resolve(false);
            return;
          }
          resolve(true);
        },
        () => {
          Alert.alert('Error', 'Could not read image size. Please try another photo.');
          resolve(false);
        }
      );
    });
  };

  const handleCapturePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Camera permission is required');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const isValid = await validateImageDimensions(uri);
        if (!isValid) return;
        setPhotoUri(uri);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to capture photo');
    }
  };

  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Media library permission is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        const isValid = await validateImageDimensions(uri);
        if (!isValid) return;
        setPhotoUri(uri);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to pick photo');
    }
  };

  const handleRegister = async () => {
    // Validate
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter full name');
      return;
    }

    if (!licenseNumber.trim()) {
      Alert.alert('Error', 'Please enter license number');
      return;
    }

    if (!photoUri) {
      Alert.alert('Error', 'Please capture or select a photo');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('fullName', fullName.trim());
      formData.append('licenseNumber', licenseNumber.trim().toUpperCase());
      if (email.trim()) formData.append('email', email.trim());
      if (phone.trim()) formData.append('phone', phone.trim());
      if (address.trim()) formData.append('address', address.trim());

      formData.append('photo', {
        uri: photoUri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);

      const response = await fetch(`${getApiBaseUrl()}/registered-persons/register`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        Alert.alert(
          'Success',
          `${result.data.fullName} registered successfully!\nID: ${result.data.licenseNumber}`,
          [
            {
              text: 'Register Another',
              onPress: () => {
                // Reset form
                setFullName('');
                setLicenseNumber('');
                setEmail('');
                setPhone('');
                setAddress('');
                setPhotoUri(null);
              },
            },
            {
              text: 'Done',
              onPress: onNavigateBack,
            },
          ]
        );
      } else {
        const backendError = String(result.error || '');
        if (backendError.toLowerCase().includes('no face')) {
          Alert.alert('No Face Found', 'No face found in photo. Please upload a clear frontal face image.');
        } else if (backendError.toLowerCase().includes('multiple')) {
          Alert.alert('Multiple Faces Detected', 'Use a photo with only one person.');
        } else {
          Alert.alert('Error', backendError || 'Registration failed');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Register Person</Text>
        <Text style={styles.subtitle}>Add person to face recognition database</Text>
        <Text style={styles.adminBadge}>👑 Admin Panel</Text>

        {/* Photo Section */}
        <View style={styles.photoSection}>
          <Text style={styles.label}>Photo *</Text>
          {photoUri ? (
            <View>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              <View style={styles.photoButtons}>
                <TouchableOpacity style={styles.photoButton} onPress={handleCapturePhoto}>
                  <Text style={styles.photoButtonText}>📷 Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoButton} onPress={handlePickPhoto}>
                  <Text style={styles.photoButtonText}>🖼️ Choose</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.photoButtons}>
              <TouchableOpacity style={styles.photoButton} onPress={handleCapturePhoto}>
                <Text style={styles.photoButtonText}>📷 Capture Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoButton} onPress={handlePickPhoto}>
                <Text style={styles.photoButtonText}>🖼️ Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter full name"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>User ID *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter unique user ID"
            value={licenseNumber}
            onChangeText={setLicenseNumber}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter email (optional)"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter phone number (optional)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter address (optional)"
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Register Button */}
        <TouchableOpacity
          style={[styles.registerButton, loading && styles.registerButtonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerButtonText}>Register Person</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.note}>
          * Required fields. Use a clear frontal face, good lighting, and one person only (min 300x300).
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  adminBadge: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: 'bold',
    marginBottom: 24,
  },
  photoSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  photoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  photoPreview: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 12,
  },
  formSection: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  registerButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  registerButtonDisabled: {
    backgroundColor: '#ccc',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  note: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
