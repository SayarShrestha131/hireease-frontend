/**
 * Register Person Screen
 * Register new person with photo for face recognition
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
import { capturePhoto, pickPhoto, registerPerson } from '../services/personRecognitionService';

interface Props {
  onNavigateBack?: () => void;
}

export const RegisterPersonScreen: React.FC<Props> = ({ onNavigateBack }) => {
  const [fullName, setFullName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCapturePhoto = async () => {
    try {
      const uri = await capturePhoto();
      if (uri) {
        setPhotoUri(uri);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to capture photo');
    }
  };

  const handlePickPhoto = async () => {
    try {
      const uri = await pickPhoto();
      if (uri) {
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
      const result = await registerPerson(
        {
          fullName: fullName.trim(),
          licenseNumber: licenseNumber.trim().toUpperCase(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
        },
        photoUri
      );

      if (result.success) {
        Alert.alert(
          'Success',
          `${result.data.fullName} registered successfully!\nLicense: ${result.data.licenseNumber}`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset form
                setFullName('');
                setLicenseNumber('');
                setEmail('');
                setPhone('');
                setPhotoUri(null);
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Registration failed');
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
        {onNavigateBack && (
          <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
        
        <Text style={styles.title}>Register New Person</Text>
        <Text style={styles.subtitle}>Add person to face recognition database</Text>

        {/* Photo Section */}
        <View style={styles.photoSection}>
          <Text style={styles.label}>Photo *</Text>
          {photoUri ? (
            <View>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              <TouchableOpacity style={styles.changePhotoButton} onPress={handleCapturePhoto}>
                <Text style={styles.changePhotoText}>Retake Photo</Text>
              </TouchableOpacity>
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

          <Text style={styles.label}>License Number *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter license number"
            value={licenseNumber}
            onChangeText={setLicenseNumber}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Email (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Phone (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
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
          * Required fields. Photo will be used for face recognition verification.
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
  changePhotoButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  changePhotoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
