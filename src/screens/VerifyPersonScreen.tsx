/**
 * Verify Person Screen
 * Verify person by license number and captured photo
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
import { capturePhoto, verifyPerson, identifyPerson } from '../services/personRecognitionService';

interface Props {
  onNavigateBack?: () => void;
}

export const VerifyPersonScreen: React.FC<Props> = ({ onNavigateBack }) => {
  const [licenseNumber, setLicenseNumber] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [mode, setMode] = useState<'verify' | 'identify'>('verify');

  const handleCapturePhoto = async () => {
    try {
      const uri = await capturePhoto();
      if (uri) {
        setPhotoUri(uri);
        setResult(null); // Clear previous result
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to capture photo');
    }
  };

  const handleVerify = async () => {
    if (mode === 'verify' && !licenseNumber.trim()) {
      Alert.alert('Error', 'Please enter license number');
      return;
    }

    if (!photoUri) {
      Alert.alert('Error', 'Please capture a photo first');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      let verifyResult;

      if (mode === 'verify') {
        // Verify by license number
        verifyResult = await verifyPerson(licenseNumber.trim().toUpperCase(), photoUri);
      } else {
        // Identify unknown person
        verifyResult = await identifyPerson(photoUri);
      }

      setResult(verifyResult);

      if (verifyResult.success) {
        const person = verifyResult.data.person;
        const confidence = verifyResult.data.confidence;

        Alert.alert(
          '✅ Verified!',
          `Name: ${person.fullName}\nLicense: ${person.licenseNumber}\nConfidence: ${confidence}%\n\n${verifyResult.message}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          '❌ Verification Failed',
          verifyResult.error || 'Person not verified',
          [{ text: 'OK' }]
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
        {onNavigateBack && (
          <TouchableOpacity style={styles.backButton} onPress={onNavigateBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
        
        <Text style={styles.title}>Face Verification</Text>
        <Text style={styles.subtitle}>Verify person using face recognition</Text>

        {/* Mode Selection */}
        <View style={styles.modeContainer}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'verify' && styles.modeButtonActive]}
            onPress={() => {
              setMode('verify');
              setResult(null);
            }}
          >
            <Text style={[styles.modeButtonText, mode === 'verify' && styles.modeButtonTextActive]}>
              Verify by License
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeButton, mode === 'identify' && styles.modeButtonActive]}
            onPress={() => {
              setMode('identify');
              setResult(null);
            }}
          >
            <Text style={[styles.modeButtonText, mode === 'identify' && styles.modeButtonTextActive]}>
              Identify Person
            </Text>
          </TouchableOpacity>
        </View>

        {/* License Number Input (only for verify mode) */}
        {mode === 'verify' && (
          <View style={styles.inputSection}>
            <Text style={styles.label}>License Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter license number (e.g., ABC123)"
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              autoCapitalize="characters"
            />
          </View>
        )}

        {/* Photo Section */}
        <View style={styles.photoSection}>
          <Text style={styles.label}>
            {mode === 'verify' ? 'Capture Photo to Verify' : 'Capture Photo to Identify'}
          </Text>
          {photoUri ? (
            <View>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
              <TouchableOpacity style={styles.retakeButton} onPress={handleCapturePhoto}>
                <Text style={styles.retakeButtonText}>📷 Retake Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.captureButton} onPress={handleCapturePhoto}>
              <Text style={styles.captureButtonText}>📷 Capture Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.verifyButton, loading && styles.verifyButtonDisabled]}
          onPress={handleVerify}
          disabled={loading || !photoUri}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyButtonText}>
              {mode === 'verify' ? 'Verify Person' : 'Identify Person'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Reset Button */}
        {(photoUri || licenseNumber) && (
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        )}

        {/* Result Display */}
        {result && (
          <View style={[styles.resultContainer, result.success ? styles.resultSuccess : styles.resultFailure]}>
            <Text style={styles.resultTitle}>
              {result.success ? '✅ Verification Result' : '❌ Verification Failed'}
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

                {result.data.person.phone && (
                  <>
                    <Text style={styles.resultLabel}>Phone:</Text>
                    <Text style={styles.resultValue}>{result.data.person.phone}</Text>
                  </>
                )}

                <Text style={styles.resultLabel}>Confidence:</Text>
                <Text style={styles.resultValue}>{result.data.confidence}%</Text>

                <Text style={styles.resultLabel}>Verifications:</Text>
                <Text style={styles.resultValue}>{result.data.person.verificationCount || 0}</Text>
              </View>
            )}

            {!result.success && (
              <View style={styles.resultDetails}>
                <Text style={styles.errorMessage}>{result.error}</Text>
                {result.data?.confidence !== undefined && (
                  <Text style={styles.confidenceText}>Confidence: {result.data.confidence}%</Text>
                )}
              </View>
            )}
          </View>
        )}

        <Text style={styles.note}>
          {mode === 'verify'
            ? 'Enter license number and capture photo to verify identity'
            : 'Capture photo to identify person from database'}
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
  modeContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  modeButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#007AFF',
  },
  modeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: '#fff',
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
    borderWidth: 1,
  },
  resultFailure: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
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
  errorMessage: {
    fontSize: 14,
    color: '#721c24',
  },
  confidenceText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  note: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
