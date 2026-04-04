/**
 * KYC Service Unit Tests
 * 
 * Tests for KYC eligibility check functionality
 * Requirements: 1.1, 1.2, 5.4, 5.5
 */

import kycService from '../kycService';
import apiClient from '../apiClient';

// Mock apiClient
jest.mock('../apiClient');
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('KYCService - checkKYCEligibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return eligibility status when user has profile picture and no pending submission', async () => {
    // Arrange
    const mockResponse = {
      data: {
        success: true,
        data: {
          hasProfilePicture: true,
          hasPendingSubmission: false,
        },
      },
    };
    mockApiClient.get = jest.fn().mockResolvedValue(mockResponse);

    // Act
    const result = await kycService.checkKYCEligibility();

    // Assert
    expect(mockApiClient.get).toHaveBeenCalledWith('/kyc/eligibility');
    expect(result).toEqual({
      hasProfilePicture: true,
      hasPendingSubmission: false,
    });
  });

  it('should return ineligible when user has no profile picture', async () => {
    // Arrange
    const mockResponse = {
      data: {
        success: true,
        data: {
          hasProfilePicture: false,
          hasPendingSubmission: false,
        },
      },
    };
    mockApiClient.get = jest.fn().mockResolvedValue(mockResponse);

    // Act
    const result = await kycService.checkKYCEligibility();

    // Assert
    expect(result.hasProfilePicture).toBe(false);
  });

  it('should return ineligible when user has pending submission', async () => {
    // Arrange
    const mockResponse = {
      data: {
        success: true,
        data: {
          hasProfilePicture: true,
          hasPendingSubmission: true,
        },
      },
    };
    mockApiClient.get = jest.fn().mockResolvedValue(mockResponse);

    // Act
    const result = await kycService.checkKYCEligibility();

    // Assert
    expect(result.hasPendingSubmission).toBe(true);
  });

  it('should handle API errors gracefully', async () => {
    // Arrange
    const mockError = {
      response: {
        status: 500,
        data: {
          error: 'Internal server error',
        },
      },
    };
    mockApiClient.get = jest.fn().mockRejectedValue(mockError);

    // Act & Assert
    await expect(kycService.checkKYCEligibility()).rejects.toThrow();
  });

  it('should handle network errors gracefully', async () => {
    // Arrange
    const mockError = {
      request: {},
      code: 'ECONNABORTED',
    };
    mockApiClient.get = jest.fn().mockRejectedValue(mockError);

    // Act & Assert
    await expect(kycService.checkKYCEligibility()).rejects.toThrow(
      'Request timeout. Please check your internet connection and try again.'
    );
  });
});
