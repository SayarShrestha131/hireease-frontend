/**
 * Unit Tests for SelfieCapture Component
 * 
 * Tests the selfie capture component with live camera preview,
 * retake functionality, and face validation error display.
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { SelfieCapture } from '../SelfieCapture';
import { CameraView, useCameraPermissions } from 'expo-camera';

// Mock expo-camera
jest.mock('expo-camera', () => ({
  CameraView: 'CameraView',
  useCameraPermissions: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('SelfieCapture Component', () => {
  const mockOnCapture = jest.fn();
  const mockRequestPermission = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useCameraPermissions as jest.Mock).mockReturnValue([
      { granted: true },
      mockRequestPermission,
    ]);
  });

  describe('Initial Render', () => {
    it('should render capture button when no image is provided', () => {
      const { getByText } = render(
        <SelfieCapture onCapture={mockOnCapture} currentImage={null} />
      );

      expect(getByText('Tap to capture live selfie')).toBeTruthy();
      expect(getByText('Take a clear photo of your face for identity verification')).toBeTruthy();
    });

    it('should render guidance tips', () => {
      const { getByText } = render(
        <SelfieCapture onCapture={mockOnCapture} currentImage={null} />
      );

      expect(getByText(/Tips: Face the camera directly/)).toBeTruthy();
    });

    it('should render current image when provided', () => {
      const mockImage = {
        uri: 'file://test-selfie.jpg',
        type: 'image/jpeg',
        name: 'selfie_123.jpg',
      };

      const { queryByText } = render(
        <SelfieCapture onCapture={mockOnCapture} currentImage={mockImage} />
      );

      // Should not show capture button when image exists
      expect(queryByText('Tap to capture live selfie')).toBeNull();
    });
  });

  describe('Camera Permissions', () => {
    it('should request permission when not granted', async () => {
      (useCameraPermissions as jest.Mock).mockReturnValue([
        { granted: false },
        mockRequestPermission,
      ]);

      mockRequestPermission.mockResolvedValue({ granted: true });

      const { getByText } = render(
        <SelfieCapture onCapture={mockOnCapture} currentImage={null} />
      );

      const captureButton = getByText('Tap to capture live selfie');
      fireEvent.press(captureButton);

      await waitFor(() => {
        expect(mockRequestPermission).toHaveBeenCalled();
      });
    });

    it('should show alert when permission is denied', async () => {
      (useCameraPermissions as jest.Mock).mockReturnValue([
        { granted: false },
        mockRequestPermission,
      ]);

      mockRequestPermission.mockResolvedValue({ granted: false });

      const { getByText } = render(
        <SelfieCapture onCapture={mockOnCapture} currentImage={null} />
      );

      const captureButton = getByText('Tap to capture live selfie');
      fireEvent.press(captureButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Camera Permission Required',
          'Please grant camera access to capture your selfie for identity verification.',
          [{ text: 'OK' }]
        );
      });
    });
  });

  describe('Validation Error Display', () => {
    it('should display validation error when provided', () => {
      const errorMessage = 'Face not detected in the image. Please ensure your face is clearly visible.';

      const { getByText } = render(
        <SelfieCapture
          onCapture={mockOnCapture}
          currentImage={null}
          validationError={errorMessage}
        />
      );

      expect(getByText('⚠️ Face Validation Error')).toBeTruthy();
      expect(getByText(errorMessage)).toBeTruthy();
      expect(getByText('Please retake your selfie following the tips above.')).toBeTruthy();
    });

    it('should not display validation error when null', () => {
      const { queryByText } = render(
        <SelfieCapture
          onCapture={mockOnCapture}
          currentImage={null}
          validationError={null}
        />
      );

      expect(queryByText('⚠️ Face Validation Error')).toBeNull();
    });
  });

  describe('Disabled State', () => {
    it('should disable capture button when disabled prop is true', () => {
      const { getByText } = render(
        <SelfieCapture onCapture={mockOnCapture} currentImage={null} disabled={true} />
      );

      const captureButton = getByText('Tap to capture live selfie').parent;
      expect(captureButton?.props.disabled).toBe(true);
    });
  });

  describe('Image Removal', () => {
    it('should show confirmation alert when removing image', () => {
      const mockImage = {
        uri: 'file://test-selfie.jpg',
        type: 'image/jpeg',
        name: 'selfie_123.jpg',
      };

      const { UNSAFE_getByType } = render(
        <SelfieCapture onCapture={mockOnCapture} currentImage={mockImage} />
      );

      // Find the remove button (X icon button)
      const removeButtons = UNSAFE_getByType('TouchableOpacity');
      
      // The first TouchableOpacity should be the remove button
      if (removeButtons) {
        fireEvent.press(removeButtons);

        expect(Alert.alert).toHaveBeenCalledWith(
          'Remove Selfie',
          'Are you sure you want to remove this selfie?',
          expect.arrayContaining([
            expect.objectContaining({ text: 'Cancel' }),
            expect.objectContaining({ text: 'Remove' }),
          ])
        );
      }
    });
  });
});
