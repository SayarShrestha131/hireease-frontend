/**
 * User Verify Screen
 * Users can verify their identity against admin-registered database
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  onNavigateBack: () => void;
}

export const UserVerifyScreen: React.FC<Props> = ({ onNavigateBack }) => {
  const { token } = useAuth();
  const [licenseNumber, setLicenseNumber] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [statusText, setStatusText] = useState<string | null>(null);

  const getLockKey = (userId: string) => `face-lockout:${userId.toUpperCase()}`;
  const getFailKey = (userId: string) => `face-fails:${userId.toUpperCase()}`;

  const classifyDistance = (distance: number): 'VERIFIED' | 'UNCERTAIN' | 'REJECTED' => {
    if (distance < 0.45) return 'VERIFIED';
    if (distance <= 0.55) return 'UNCERTAIN';
    return 'REJECTED';
  };

  const readLockout = async (userId: string): Promise<number> => {
    const value = await AsyncStorage.getItem(getLockKey(userId));
    return value ? Number(value) : 0;
  };

  const clearFailures = async (userId: string) => {
    await AsyncStorage.multiRemove([getLockKey(userId), getFailKey(userId)]);
  };

  const registerFailure = async (userId: string): Promise<number> => {
    const current = Number((await AsyncStorage.getItem(getFailKey(userId))) || '0') + 1;
    await AsyncStorage.setItem(getFailKey(userId), String(current));
    if (current >= 3) {
      const lockUntil = Date.now() + 60_000;
      await AsyncStorage.setItem(getLockKey(userId), String(lockUntil));
    }
    return current;
  };

  const logAttempt = async (payload: {
    userId: string;
    distance: number | null;
    result: 'VERIFIED' | 'UNCERTAIN' | 'REJECTED' | 'ERROR';
  }) => {
    try {
      await fetch(`${API_URL}/registered-persons/verify-attempts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: payload.userId,
          timestamp: new Date().toISOString(),
          distance: payload.distance,
          result: payload.result,
        }),
      });
    } catch {
      // Best effort logging only.
    }
  };

  const handleCapturePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Camera permission is required');
        return;
      }

      const captureResult = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!captureResult.canceled) {
        setPhotoUri(captureResult.assets[0].uri);
        setResult(null); // Clear previous result
        setStatusText(null);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to capture photo');
    }
  };

  const handleVerify = async () => {
    const userId = licenseNumber.trim().toUpperCase();
    if (!userId) {
      Alert.alert('Error', 'Please enter your user ID');
      return;
    }

    if (!photoUri) {
      Alert.alert('Error', 'Please capture your photo first');
      return;
    }

    setLoading(true);
    setResult(null);
    setStatusText(null);

    try {
      const lockUntil = await readLockout(userId);
      if (lockUntil > Date.now()) {
        const seconds = Math.ceil((lockUntil - Date.now()) / 1000);
        Alert.alert('Temporarily Blocked', `Too many failed attempts. Try again in ${seconds}s.`);
        return;
      }

      const formData = new FormData();
      formData.append('licenseNumber', userId);
      formData.append('photo', {
        uri: photoUri,
        type: 'image/jpeg',
        name: 'verify.jpg',
      } as any);

      const response = await fetch(`${API_URL}/registered-persons/verify`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const verifyResult = await response.json();
      setResult(verifyResult);

      if (!verifyResult.success) {
        await registerFailure(userId);
        await logAttempt({ userId, distance: null, result: 'ERROR' });
        if (String(verifyResult.error || '').toLowerCase().includes('not found')) {
          Alert.alert('User Not Registered', 'User not registered');
          return;
        }
        Alert.alert('Verification Failed', verifyResult.error || 'Identity could not be verified');
        return;
      }

      const distanceRaw = verifyResult?.data?.distance;
      const distance =
        typeof distanceRaw === 'number'
          ? distanceRaw
          : typeof verifyResult?.data?.confidence === 'number'
            ? 1 - verifyResult.data.confidence / 100
            : null;

      if (distance === null) {
        await registerFailure(userId);
        await logAttempt({ userId, distance: null, result: 'ERROR' });
        Alert.alert('Verification Failed', 'Missing distance from verification response.');
        return;
      }

      const faceResult = classifyDistance(distance);
      await logAttempt({ userId, distance, result: faceResult });

      if (faceResult === 'VERIFIED') {
        await clearFailures(userId);
        const person = verifyResult.data.person;
        setStatusText(`VERIFIED (distance ${distance.toFixed(4)})`);

        Alert.alert(
          '✅ Identity Verified!',
          `Welcome ${person.fullName}!\n\nID: ${person.licenseNumber}\nDistance: ${distance.toFixed(4)}\n\nAccess granted.`,
          [{ text: 'OK' }]
        );
      } else {
        const fails = await registerFailure(userId);
        const lockNotice =
          fails >= 3 ? '\n\nToo many failed attempts. Verification locked for 60 seconds.' : '';
        const message =
          faceResult === 'UNCERTAIN'
            ? `Face match is uncertain (distance ${distance.toFixed(4)}). Please retry in better lighting.`
            : `Face does not match records (distance ${distance.toFixed(4)}).`;
        setStatusText(`${faceResult} (distance ${distance.toFixed(4)})`);
        Alert.alert(
          faceResult === 'UNCERTAIN' ? '⚠️ Uncertain Match' : '❌ Verification Rejected',
          `${message}${lockNotice}`,
          [{ text: 'Try Again' }]
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setLicenseNumber('');
    setPhotoUri(null);
    setResult(null);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Verify Your Identity</Text>
        <Text style={styles.subtitle}>Enter your user ID and take a selfie</Text>

        {/* Instructions */}
        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsTitle}>📋 How it works:</Text>
          <Text style={styles.instructionsText}>1. Enter your user ID</Text>
          <Text style={styles.instructionsText}>2. Capture your photo</Text>
          <Text style={styles.instructionsText}>3. Face is compared against registered descriptor</Text>
          <Text style={styles.instructionsText}>4. Access is granted only for face match</Text>
        </View>

        {/* License Number Input */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>User ID *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your user ID (e.g., ABC123)"
            value={licenseNumber}
            onChangeText={setLicenseNumber}
            autoCapitalize="characters"
            editable={!loading}
          />
        </View>

        {/* Photo Section */}
        <View style={styles.photoSection}>
          <Text style={styles.label}>Your Photo *</Text>
          {photoUri ? (
            <View>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              <TouchableOpacity
                style={styles.retakeButton}
                onPress={handleCapturePhoto}
                disabled={loading}
              >
                <Text style={styles.retakeButtonText}>📷 Retake Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleCapturePhoto}
              disabled={loading}
            >
              <Text style={styles.captureButtonText}>📷 Capture Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.verifyButton, (loading || !photoUri || !licenseNumber) && styles.verifyButtonDisabled]}
          onPress={handleVerify}
          disabled={loading || !photoUri || !licenseNumber}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify My Identity</Text>
          )}
        </TouchableOpacity>

        {/* Reset Button */}
        {(photoUri || licenseNumber) && !loading && (
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        )}

        {statusText && <Text style={styles.statusText}>{statusText}</Text>}

        {/* Result Display */}
        {result && (
          <View
            style={[
              styles.resultContainer,
              result.success ? styles.resultSuccess : styles.resultFailure,
            ]}
          >
            <Text style={styles.resultTitle}>
              {result.success ? '✅ Verification Successful' : '❌ Verification Failed'}
            </Text>

            {result.success && result.data.person && (
              <View style={styles.resultDetails}>
                <Text style={styles.resultLabel}>Name:</Text>
                <Text style={styles.resultValue}>{result.data.person.fullName}</Text>

                <Text style={styles.resultLabel}>License Number:</Text>
                <Text style={styles.resultValue}>{result.data.person.licenseNumber}</Text>

                {result.data.person.email && (
                  <>
                    <Text style={styles.resultLabel}>Email:</Text>
                    <Text style={styles.resultValue}>{result.data.person.email}</Text>
                  </>
                )}

                <Text style={styles.resultLabel}>Confidence:</Text>
                <Text style={styles.resultValue}>{result.data.confidence}%</Text>

                <Text style={styles.resultLabel}>Status:</Text>
                <Text style={[styles.resultValue, styles.verifiedText]}>VERIFIED ✓</Text>
              </View>
            )}

            {!result.success && (
              <View style={styles.resultDetails}>
                <Text style={styles.errorMessage}>{result.error}</Text>
                {result.data?.confidence !== undefined && (
                  <Text style={styles.confidenceText}>
                    Confidence: {result.data.confidence}%
                  </Text>
                )}
                <Text style={styles.helpText}>
                  Please ensure:
                  {'\n'}• Correct license number
                  {'\n'}• Good lighting
                  {'\n'}• Face clearly visible
                  {'\n'}• You are registered in the system
                </Text>
              </View>
            )}
          </View>
        )}

        <Text style={styles.note}>
          Details are used for lookup only. Access requires face distance check.
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
  instructionsBox: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: '#1565C0',
    marginBottom: 4,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  photoSection: {
    marginBottom: 24,
  },
  captureButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  photoPreview: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginBottom: 12,
  },
  retakeButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  verifyButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  verifyButtonDisabled: {
    backgroundColor: '#ccc',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  resultContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  resultSuccess: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 2,
  },
  resultFailure: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 2,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  resultDetails: {
    gap: 8,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  resultValue: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  verifiedText: {
    color: '#28a745',
    fontWeight: 'bold',
    fontSize: 18,
  },
  errorMessage: {
    fontSize: 14,
    color: '#721c24',
    marginBottom: 8,
  },
  confidenceText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#856404',
    marginTop: 8,
    lineHeight: 18,
  },
  note: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statusText: {
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
});
