/**
 * Face Verification Screen
 * Allows users to verify their identity using face matching
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { verifyUserFace, compareTwoFaces, pickImageFromGallery, captureImageFromCamera } from '../services/faceVerificationService';

interface Props {
  token: string; // Pass from auth context
  onVerificationSuccess?: () => void;
}

export const FaceVerificationScreen: React.FC<Props> = ({ token, onVerificationSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [mode, setMode] = useState<'verify' | 'compare'>('verify');
  const [image1Uri, setImage1Uri] = useState<string | null>(null);
  const [image2Uri, setImage2Uri] = useState<string | null>(null);

  const handleVerifyIdentity = async () => {
    setLoading(true);
    setResult(null);

    try {
      const verificationResult = await verifyUserFace(token);

      if (verificationResult) {
        setResult(verificationResult);

        if (verificationResult.verified) {
          Alert.alert(
            'Verification Successful',
            `${verificationResult.message}\nConfidence: ${verificationResult.confidence}%`,
            [
              {
                text: 'OK',
                onPress: () => onVerificationSuccess?.(),
              },
            ]
          );
        } else {
          Alert.alert(
            'Verification Failed',
            `${verificationResult.message}\nConfidence: ${verificationResult.confidence}%`
          );
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Face verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCompareImages = async () => {
    if (!image1Uri || !image2Uri) {
      Alert.alert('Error', 'Please select both images to compare');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const comparisonResult = await compareTwoFaces(token, image1Uri, image2Uri);
      setResult(comparisonResult);

      Alert.alert(
        comparisonResult.isMatch ? 'Match Found' : 'No Match',
        `${comparisonResult.message}\nSimilarity: ${comparisonResult.similarity}%`
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Face comparison failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage1 = async () => {
    try {
      const uri = await pickImageFromGallery();
      if (uri) setImage1Uri(uri);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handlePickImage2 = async () => {
    try {
      const uri = await pickImageFromGallery();
      if (uri) setImage2Uri(uri);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleCaptureImage1 = async () => {
    try {
      const uri = await captureImageFromCamera();
      if (uri) setImage1Uri(uri);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleCaptureImage2 = async () => {
    try {
      const uri = await captureImageFromCamera();
      if (uri) setImage2Uri(uri);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Face Verification</Text>

      {/* Mode Selection */}
      <View style={styles.modeContainer}>
        <TouchableOpacity
          style={[styles.modeButton, mode === 'verify' && styles.modeButtonActive]}
          onPress={() => setMode('verify')}
        >
          <Text style={[styles.modeButtonText, mode === 'verify' && styles.modeButtonTextActive]}>
            Verify Identity
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeButton, mode === 'compare' && styles.modeButtonActive]}
          onPress={() => setMode('compare')}
        >
          <Text style={[styles.modeButtonText, mode === 'compare' && styles.modeButtonTextActive]}>
            Compare Images
          </Text>
        </TouchableOpacity>
      </View>

      {/* Verify Identity Mode */}
      {mode === 'verify' && (
        <View style={styles.content}>
          <Text style={styles.description}>
            Take a selfie to verify your identity. We'll compare it with your saved profile picture.
          </Text>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleVerifyIdentity}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Capture & Verify</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Compare Images Mode */}
      {mode === 'compare' && (
        <View style={styles.content}>
          <Text style={styles.description}>
            Select or capture two images to compare faces.
          </Text>

          {/* Image 1 */}
          <View style={styles.imageSection}>
            <Text style={styles.imageLabel}>Image 1:</Text>
            {image1Uri && <Image source={{ uri: image1Uri }} style={styles.imagePreview} />}
            <View style={styles.imageButtons}>
              <TouchableOpacity style={styles.smallButton} onPress={handlePickImage1}>
                <Text style={styles.smallButtonText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallButton} onPress={handleCaptureImage1}>
                <Text style={styles.smallButtonText}>Camera</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Image 2 */}
          <View style={styles.imageSection}>
            <Text style={styles.imageLabel}>Image 2:</Text>
            {image2Uri && <Image source={{ uri: image2Uri }} style={styles.imagePreview} />}
            <View style={styles.imageButtons}>
              <TouchableOpacity style={styles.smallButton} onPress={handlePickImage2}>
                <Text style={styles.smallButtonText}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallButton} onPress={handleCaptureImage2}>
                <Text style={styles.smallButtonText}>Camera</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleCompareImages}
            disabled={loading || !image1Uri || !image2Uri}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Compare Faces</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Result Display */}
      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Result:</Text>
          <Text style={[styles.resultStatus, result.verified || result.isMatch ? styles.resultSuccess : styles.resultFailure]}>
            {result.verified || result.isMatch ? '✅ Verified' : '❌ Not Verified'}
          </Text>
          <Text style={styles.resultText}>Confidence: {result.confidence}%</Text>
          <Text style={styles.resultText}>{result.message}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
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
  },
  modeButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageSection: {
    marginBottom: 20,
  },
  imageLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  smallButton: {
    flex: 1,
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
  },
  smallButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  resultContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultStatus: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resultSuccess: {
    color: '#4CAF50',
  },
  resultFailure: {
    color: '#F44336',
  },
  resultText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});
