/**
 * KYCStatusScreen Tests
 * 
 * Tests for the KYC status screen, focusing on resubmission window handling
 */

import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { KYCStatusScreen } from '../KYCStatusScreen';
import kycService from '../../services/kycService';
import { KYCSubmission } from '../../types/kyc';

// Mock dependencies
jest.mock('../../services/kycService');
jest.mock('../../utils/toast', () => ({
  showError: jest.fn(),
  showSuccess: jest.fn(),
}));

const mockKycService = kycService as jest.Mocked<typeof kycService>;

describe('KYCStatusScreen - Resubmission Window', () => {
  const mockOnNavigateBack = jest.fn();
  const mockOnNavigateToSubmission = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Rejected Status with Active Resubmission Window', () => {
    it('should display countdown timer when within 24-hour window', async () => {
      // Create a rejection timestamp 1 hour ago
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const mockRejectedSubmission: KYCSubmission = {
        _id: '123',
        userId: 'user123',
        status: 'rejected',
        licenseNumber: 'DL123456',
        fullName: 'Test User',
        dateOfBirth: '1990-01-01',
        licenseExpiryDate: '2025-12-31',
        licenseFrontImage: 'front.jpg',
        selfieImage: 'selfie.jpg',
        submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        reviewedAt: oneHourAgo.toISOString(),
        reviewNote: 'Document quality is poor',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockKycService.getKYCStatus.mockResolvedValue(mockRejectedSubmission);

      const { getByText, queryByText } = render(
        <KYCStatusScreen
          onNavigateBack={mockOnNavigateBack}
          onNavigateToSubmission={mockOnNavigateToSubmission}
        />
      );

      // Wait for data to load
      await waitFor(() => {
        expect(getByText('Rejected')).toBeTruthy();
      });

      // Should show resubmission window message
      expect(getByText(/Resubmission Window/i)).toBeTruthy();
      expect(getByText(/You must wait 24 hours/i)).toBeTruthy();

      // Should show countdown timer (23 hours remaining)
      expect(getByText(/23:/)).toBeTruthy();

      // Button should be disabled
      expect(getByText('Resubmit Locked')).toBeTruthy();
    });

    it('should update countdown timer every second', async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const mockRejectedSubmission: KYCSubmission = {
        _id: '123',
        userId: 'user123',
        status: 'rejected',
        licenseNumber: 'DL123456',
        fullName: 'Test User',
        dateOfBirth: '1990-01-01',
        licenseExpiryDate: '2025-12-31',
        licenseFrontImage: 'front.jpg',
        selfieImage: 'selfie.jpg',
        submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        reviewedAt: oneHourAgo.toISOString(),
        reviewNote: 'Document quality is poor',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockKycService.getKYCStatus.mockResolvedValue(mockRejectedSubmission);

      const { getByText } = render(
        <KYCStatusScreen
          onNavigateBack={mockOnNavigateBack}
          onNavigateToSubmission={mockOnNavigateToSubmission}
        />
      );

      await waitFor(() => {
        expect(getByText('Rejected')).toBeTruthy();
      });

      // Advance timer by 1 second
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Timer should still be visible (countdown continues)
      await waitFor(() => {
        expect(getByText(/Time remaining until you can resubmit/i)).toBeTruthy();
      });
    });
  });

  describe('Rejected Status with Expired Resubmission Window', () => {
    it('should enable resubmit button when 24 hours have passed', async () => {
      // Create a rejection timestamp 25 hours ago (past the window)
      const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
      
      const mockRejectedSubmission: KYCSubmission = {
        _id: '123',
        userId: 'user123',
        status: 'rejected',
        licenseNumber: 'DL123456',
        fullName: 'Test User',
        dateOfBirth: '1990-01-01',
        licenseExpiryDate: '2025-12-31',
        licenseFrontImage: 'front.jpg',
        selfieImage: 'selfie.jpg',
        submittedAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
        reviewedAt: twentyFiveHoursAgo.toISOString(),
        reviewNote: 'Document quality is poor',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockKycService.getKYCStatus.mockResolvedValue(mockRejectedSubmission);

      const { getByText, queryByText } = render(
        <KYCStatusScreen
          onNavigateBack={mockOnNavigateBack}
          onNavigateToSubmission={mockOnNavigateToSubmission}
        />
      );

      await waitFor(() => {
        expect(getByText('Rejected')).toBeTruthy();
      });

      // Should NOT show resubmission window timer
      expect(queryByText(/Resubmission Window/i)).toBeNull();

      // Button should be enabled
      expect(getByText('Resubmit KYC')).toBeTruthy();
      expect(queryByText('Resubmit Locked')).toBeNull();
    });

    it('should not display countdown timer when window has expired', async () => {
      const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
      
      const mockRejectedSubmission: KYCSubmission = {
        _id: '123',
        userId: 'user123',
        status: 'rejected',
        licenseNumber: 'DL123456',
        fullName: 'Test User',
        dateOfBirth: '1990-01-01',
        licenseExpiryDate: '2025-12-31',
        licenseFrontImage: 'front.jpg',
        selfieImage: 'selfie.jpg',
        submittedAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
        reviewedAt: twentyFiveHoursAgo.toISOString(),
        reviewNote: 'Document quality is poor',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockKycService.getKYCStatus.mockResolvedValue(mockRejectedSubmission);

      const { queryByText } = render(
        <KYCStatusScreen
          onNavigateBack={mockOnNavigateBack}
          onNavigateToSubmission={mockOnNavigateToSubmission}
        />
      );

      await waitFor(() => {
        expect(queryByText(/Time remaining until you can resubmit/i)).toBeNull();
      });
    });
  });

  describe('Rejection Reason Display', () => {
    it('should display admin rejection reason', async () => {
      const mockRejectedSubmission: KYCSubmission = {
        _id: '123',
        userId: 'user123',
        status: 'rejected',
        licenseNumber: 'DL123456',
        fullName: 'Test User',
        dateOfBirth: '1990-01-01',
        licenseExpiryDate: '2025-12-31',
        licenseFrontImage: 'front.jpg',
        selfieImage: 'selfie.jpg',
        submittedAt: new Date().toISOString(),
        reviewedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
        reviewNote: 'License image is blurry and unreadable. Please upload a clear photo.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockKycService.getKYCStatus.mockResolvedValue(mockRejectedSubmission);

      const { getByText } = render(
        <KYCStatusScreen
          onNavigateBack={mockOnNavigateBack}
          onNavigateToSubmission={mockOnNavigateToSubmission}
        />
      );

      await waitFor(() => {
        expect(getByText('Rejection Reason')).toBeTruthy();
        expect(getByText('License image is blurry and unreadable. Please upload a clear photo.')).toBeTruthy();
      });
    });
  });

  describe('Timer Cleanup', () => {
    it('should clean up interval on unmount', async () => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const mockRejectedSubmission: KYCSubmission = {
        _id: '123',
        userId: 'user123',
        status: 'rejected',
        licenseNumber: 'DL123456',
        fullName: 'Test User',
        dateOfBirth: '1990-01-01',
        licenseExpiryDate: '2025-12-31',
        licenseFrontImage: 'front.jpg',
        selfieImage: 'selfie.jpg',
        submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        reviewedAt: oneHourAgo.toISOString(),
        reviewNote: 'Document quality is poor',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockKycService.getKYCStatus.mockResolvedValue(mockRejectedSubmission);

      const { unmount } = render(
        <KYCStatusScreen
          onNavigateBack={mockOnNavigateBack}
          onNavigateToSubmission={mockOnNavigateToSubmission}
        />
      );

      await waitFor(() => {
        expect(mockKycService.getKYCStatus).toHaveBeenCalled();
      });

      // Unmount should not throw errors
      expect(() => unmount()).not.toThrow();
    });
  });
});
