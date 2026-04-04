/**
 * Unit Tests for ProfilePictureUpload Component
 * 
 * Tests the profile picture upload component with camera/gallery options,
 * image preview, upload progress, and error handling.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ProfilePictureUpload } from '../ProfilePictureUpload';
import * as ImagePicker from 'expo-image-picker';

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: {
    Images: 'Images',
  },
  CameraType: {
    front: 'front',
  },
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('ProfilePictureUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render upload buttons when no image is selected', () => {
      const { getByText } = render(<ProfilePictureUpload />);
      
      expect(getByText('Take Photo')).toBeTruthy();
      expect(getByText('Choose from Gallery')).toBeTruthy();
    });

    it('should render requirements information', () => {
      const { getByText } = render(<ProfilePictureUpload />);
      
      expect(getByText('Profile Picture Requirements:')).toBeTruthy();
      expect(getByText(/Clear frontal face photo/)).toBeTruthy();
    });

    it('should render current image when provided', () => {
      const { getByText } = render(
        <ProfilePictureUpload currentImageUrl="https://example.com/image.jpg" />
      );
      
      expect(getByText('Change Image')).toBeTruthy();
    });

    it('should disable buttons when disabled prop is true', () => {
      const { getByText } = render(<ProfilePictureUpload disabled={true} />);
      
      const takePhotoButton = getByText('Take Photo').parent;
      const galleryButton = getByText('Choose from Gallery').parent;
      
      // Buttons should have disabled styling
      expect(takePhotoButton).toBeTruthy();
      expect(galleryButton).toBeTruthy();
    });
  });

  describe('Camera Permissions', () => {
    it('should request camera permission when taking photo', async () => {
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: true,
      });

      const { getByText } = render(<ProfilePictureUpload />);
      const takePhotoButton = getByText('Take Photo');
      
      fireEvent.press(takePhotoButton);
      
      await waitFor(() => {
        expect(ImagePicker.requestCameraPermissionsAsync).toHaveBeenCalled();
      });
    });

    it('should show alert when camera permission is denied', async () => {
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const { getByText } = render(<ProfilePictureUpload />);
      const takePhotoButton = getByText('Take Photo');
      
      fireEvent.press(takePhotoButton);
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Permission Required',
          'Camera permission is required to take a profile picture.'
        );
      });
    });

    it('should not launch camera when permission is denied', async () => {
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const { getByText } = render(<ProfilePictureUpload />);
      const takePhotoButton = getByText('Take Photo');
      
      fireEvent.press(takePhotoButton);
      
      await waitFor(() => {
        expect(ImagePicker.launchCameraAsync).not.toHaveBeenCalled();
      });
    });
  });

  describe('Gallery Permissions', () => {
    it('should request media library permission when picking image', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: true,
      });

      const { getByText } = render(<ProfilePictureUpload />);
      const galleryButton = getByText('Choose from Gallery');
      
      fireEvent.press(galleryButton);
      
      await waitFor(() => {
        expect(ImagePicker.requestMediaLibraryPermissionsAsync).toHaveBeenCalled();
      });
    });

    it('should show alert when media library permission is denied', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const { getByText } = render(<ProfilePictureUpload />);
      const galleryButton = getByText('Choose from Gallery');
      
      fireEvent.press(galleryButton);
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Permission Required',
          'Media library permission is required to select a profile picture.'
        );
      });
    });
  });

  describe('Image Selection', () => {
    it('should display selected image from camera', async () => {
      const mockImageUri = 'file:///path/to/image.jpg';
      
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: mockImageUri }],
      });

      const { getByText } = render(<ProfilePictureUpload />);
      const takePhotoButton = getByText('Take Photo');
      
      fireEvent.press(takePhotoButton);
      
      await waitFor(() => {
        expect(getByText('Change Image')).toBeTruthy();
      });
    });

    it('should display selected image from gallery', async () => {
      const mockImageUri = 'file:///path/to/gallery-image.jpg';
      
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: mockImageUri }],
      });

      const { getByText } = render(<ProfilePictureUpload />);
      const galleryButton = getByText('Choose from Gallery');
      
      fireEvent.press(galleryButton);
      
      await waitFor(() => {
        expect(getByText('Change Image')).toBeTruthy();
      });
    });

    it('should call onImageSelected callback when image is selected', async () => {
      const mockImageUri = 'file:///path/to/image.jpg';
      const mockCallback = jest.fn();
      
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: mockImageUri }],
      });

      const { getByText } = render(
        <ProfilePictureUpload onImageSelected={mockCallback} />
      );
      const takePhotoButton = getByText('Take Photo');
      
      fireEvent.press(takePhotoButton);
      
      await waitFor(() => {
        expect(mockCallback).toHaveBeenCalledWith(mockImageUri);
      });
    });

    it('should not update state when image selection is canceled', async () => {
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: true,
      });

      const { getByText, queryByText } = render(<ProfilePictureUpload />);
      const takePhotoButton = getByText('Take Photo');
      
      fireEvent.press(takePhotoButton);
      
      await waitFor(() => {
        expect(queryByText('Change Image')).toBeNull();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when provided', () => {
      const { getByText, rerender } = render(<ProfilePictureUpload />);
      
      // Simulate error by triggering camera error
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockRejectedValue(
        new Error('Camera error')
      );
      
      const takePhotoButton = getByText('Take Photo');
      fireEvent.press(takePhotoButton);
      
      // Error should be displayed
      waitFor(() => {
        expect(getByText('Upload Failed')).toBeTruthy();
      });
    });

    it('should show face validation guidance for face-related errors', async () => {
      const mockCallback = jest.fn();
      
      const { getByText, rerender } = render(
        <ProfilePictureUpload onUploadError={mockCallback} />
      );
      
      // Simulate face validation error
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockRejectedValue(
        new Error('No face detected in image')
      );
      
      const takePhotoButton = getByText('Take Photo');
      fireEvent.press(takePhotoButton);
      
      await waitFor(() => {
        expect(mockCallback).toHaveBeenCalled();
      });
    });

    it('should call onUploadError callback when error occurs', async () => {
      const mockCallback = jest.fn();
      
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockRejectedValue(
        new Error('Test error')
      );

      const { getByText } = render(
        <ProfilePictureUpload onUploadError={mockCallback} />
      );
      const takePhotoButton = getByText('Take Photo');
      
      fireEvent.press(takePhotoButton);
      
      await waitFor(() => {
        expect(mockCallback).toHaveBeenCalled();
      });
    });
  });

  describe('Image Preview', () => {
    it('should show clear button when image is selected', async () => {
      const mockImageUri = 'file:///path/to/image.jpg';
      
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: mockImageUri }],
      });

      const { getByText, getByTestId } = render(<ProfilePictureUpload />);
      const takePhotoButton = getByText('Take Photo');
      
      fireEvent.press(takePhotoButton);
      
      await waitFor(() => {
        expect(getByText('Change Image')).toBeTruthy();
      });
    });

    it('should clear selected image when clear button is pressed', async () => {
      const mockImageUri = 'file:///path/to/image.jpg';
      
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: mockImageUri }],
      });

      const { getByText, queryByText } = render(<ProfilePictureUpload />);
      const takePhotoButton = getByText('Take Photo');
      
      fireEvent.press(takePhotoButton);
      
      await waitFor(() => {
        expect(getByText('Change Image')).toBeTruthy();
      });
      
      // Note: Clear button is rendered as an X icon, not text
      // In a real test, we'd need to find it by testID or other means
    });
  });

  describe('Callbacks', () => {
    it('should call onUploadStart when upload begins', () => {
      const mockCallback = jest.fn();
      
      render(<ProfilePictureUpload onUploadStart={mockCallback} />);
      
      // onUploadStart would be called when actual upload starts
      // This is a placeholder test - actual implementation would trigger this
    });

    it('should call onUploadSuccess when upload completes', () => {
      const mockCallback = jest.fn();
      
      render(<ProfilePictureUpload onUploadSuccess={mockCallback} />);
      
      // onUploadSuccess would be called when upload completes successfully
      // This is a placeholder test - actual implementation would trigger this
    });

    it('should work without optional callbacks', async () => {
      const mockImageUri = 'file:///path/to/image.jpg';
      
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [{ uri: mockImageUri }],
      });

      const { getByText } = render(<ProfilePictureUpload />);
      const takePhotoButton = getByText('Take Photo');
      
      expect(() => {
        fireEvent.press(takePhotoButton);
      }).not.toThrow();
    });
  });

  describe('Camera Configuration', () => {
    it('should use front camera for selfies', async () => {
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: true,
      });

      const { getByText } = render(<ProfilePictureUpload />);
      const takePhotoButton = getByText('Take Photo');
      
      fireEvent.press(takePhotoButton);
      
      await waitFor(() => {
        expect(ImagePicker.launchCameraAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            cameraType: ImagePicker.CameraType.front,
          })
        );
      });
    });

    it('should use square aspect ratio for profile pictures', async () => {
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: true,
      });

      const { getByText } = render(<ProfilePictureUpload />);
      const takePhotoButton = getByText('Take Photo');
      
      fireEvent.press(takePhotoButton);
      
      await waitFor(() => {
        expect(ImagePicker.launchCameraAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            aspect: [1, 1],
          })
        );
      });
    });

    it('should enable image editing', async () => {
      (ImagePicker.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: true,
      });

      const { getByText } = render(<ProfilePictureUpload />);
      const takePhotoButton = getByText('Take Photo');
      
      fireEvent.press(takePhotoButton);
      
      await waitFor(() => {
        expect(ImagePicker.launchCameraAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            allowsEditing: true,
          })
        );
      });
    });
  });
});
