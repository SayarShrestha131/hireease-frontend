/**
 * SelfieCapture Component
 * 
 * Provides live camera preview for selfie capture with retake functionality.
 * Uses expo-camera for real-time face capture during KYC submission.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Camera, X, RotateCcw, Check } from 'lucide-react-native';

interface SelfieCaptureProps {
  onCapture: (imageData: { uri: string; type: string; name: string }) => void;
  currentImage?: { uri: string; type: string; name: string } | null;
  disabled?: boolean;
  validationError?: string | null;
}

export const SelfieCapture: React.FC<SelfieCaptureProps> = ({
  onCapture,
  currentImage,
  disabled = false,
  validationError = null,
}) => {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  /**
   * Open camera modal
   */
  const openCamera = async () => {
    if (!permission) {
      // Permission not loaded yet
      return;
    }

    if (!permission.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please grant camera access to capture your selfie for identity verification.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    setShowCamera(true);
    setCapturedPhoto(null);
  };

  /**
   * Close camera modal
   */
  const closeCamera = () => {
    setShowCamera(false);
    setCapturedPhoto(null);
  };

  /**
   * Capture photo from camera
   */
  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo) {
        setCapturedPhoto(photo.uri);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Retake photo
   */
  const retakePhoto = () => {
    setCapturedPhoto(null);
  };

  /**
   * Confirm and use captured photo
   */
  const confirmPhoto = () => {
    if (!capturedPhoto) return;

    const imageData = {
      uri: capturedPhoto,
      type: 'image/jpeg',
      name: `selfie_${Date.now()}.jpg`,
    };

    onCapture(imageData);
    closeCamera();
  };

  /**
   * Remove current selfie
   */
  const removeSelfie = () => {
    Alert.alert(
      'Remove Selfie',
      'Are you sure you want to remove this selfie?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            onCapture({ uri: '', type: '', name: '' });
          },
        },
      ]
    );
  };

  return (
    <>
      {/* Display current selfie or capture button */}
      {currentImage && currentImage.uri ? (
        <View className="relative">
          <Image
            source={{ uri: currentImage.uri }}
            className="w-full h-64 rounded-lg"
            resizeMode="cover"
          />
          <TouchableOpacity
            className="absolute top-2 right-2 bg-red-500 rounded-full p-2"
            onPress={removeSelfie}
            disabled={disabled}
          >
            <X size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            className="absolute bottom-2 right-2 bg-blue-500 rounded-full p-2"
            onPress={openCamera}
            disabled={disabled}
          >
            <RotateCcw size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          className="border-2 border-dashed rounded-lg p-8 items-center border-blue-300 bg-blue-50"
          onPress={openCamera}
          disabled={disabled}
        >
          <Camera size={40} color="#0096c7" />
          <Text className="text-blue-700 text-base mt-2 font-semibold">
            Tap to capture live selfie
          </Text>
          <Text className="text-blue-600 text-sm mt-1 text-center">
            Take a clear photo of your face for identity verification
          </Text>
        </TouchableOpacity>
      )}

      {/* Guidance text */}
      <View className="bg-yellow-50 rounded-lg p-3 mt-2">
        <Text className="text-yellow-800 text-xs">
          💡 Tips: Face the camera directly, ensure good lighting, remove glasses if possible
        </Text>
      </View>

      {/* Face validation error */}
      {validationError && (
        <View className="bg-red-50 rounded-lg p-3 mt-2 border border-red-200">
          <Text className="text-red-800 text-sm font-semibold mb-1">
            ⚠️ Face Validation Error
          </Text>
          <Text className="text-red-700 text-xs">
            {validationError}
          </Text>
          <Text className="text-red-600 text-xs mt-2">
            Please retake your selfie following the tips above.
          </Text>
        </View>
      )}

      {/* Camera Modal */}
      <Modal
        visible={showCamera}
        animationType="slide"
        onRequestClose={closeCamera}
      >
        <View className="flex-1 bg-black">
          {!capturedPhoto ? (
            <>
              {/* Live Camera View */}
              <CameraView
                ref={cameraRef}
                style={{ flex: 1 }}
                facing="front"
              >
                {/* Camera Overlay */}
                <View className="flex-1 justify-between">
                  {/* Top Bar */}
                  <View className="bg-black/50 p-4">
                    <TouchableOpacity onPress={closeCamera}>
                      <X size={32} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>

                  {/* Center Guide */}
                  <View className="items-center justify-center flex-1">
                    <View className="w-64 h-80 border-4 border-white/50 rounded-3xl" />
                    <Text className="text-white text-center mt-4 px-8">
                      Position your face within the frame
                    </Text>
                  </View>

                  {/* Bottom Controls */}
                  <View className="bg-black/50 p-6 items-center">
                    <TouchableOpacity
                      className="bg-white rounded-full p-4"
                      onPress={takePicture}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <ActivityIndicator color="#0096c7" size="large" />
                      ) : (
                        <Camera size={40} color="#0096c7" />
                      )}
                    </TouchableOpacity>
                    <Text className="text-white text-sm mt-2">
                      Tap to capture
                    </Text>
                  </View>
                </View>
              </CameraView>
            </>
          ) : (
            <>
              {/* Photo Preview */}
              <View className="flex-1">
                <Image
                  source={{ uri: capturedPhoto }}
                  className="flex-1"
                  resizeMode="contain"
                />

                {/* Preview Controls */}
                <View className="absolute bottom-0 left-0 right-0 bg-black/70 p-6">
                  <View className="flex-row justify-around items-center">
                    {/* Retake Button */}
                    <TouchableOpacity
                      className="items-center"
                      onPress={retakePhoto}
                    >
                      <View className="bg-gray-600 rounded-full p-4">
                        <RotateCcw size={32} color="#FFFFFF" />
                      </View>
                      <Text className="text-white text-sm mt-2">Retake</Text>
                    </TouchableOpacity>

                    {/* Confirm Button */}
                    <TouchableOpacity
                      className="items-center"
                      onPress={confirmPhoto}
                    >
                      <View className="bg-green-500 rounded-full p-4">
                        <Check size={32} color="#FFFFFF" />
                      </View>
                      <Text className="text-white text-sm mt-2">Use Photo</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
      </Modal>
    </>
  );
};
