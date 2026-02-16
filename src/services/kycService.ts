/**
 * KYC Service
 * 
 * This module provides methods for interacting with the KYC verification API endpoints.
 * Handles user KYC submissions, status checks, and admin review operations.
 */

import apiClient from './apiClient';
import {
  KYCFormData,
  KYCSubmission,
  KYCFilters,
  PaginatedKYCResponse,
  KYCSubmissionResponse,
  KYCActionResponse,
} from '../types/kyc';
import { AxiosError } from 'axios';

/**
 * KYC Service Class
 * Provides methods for KYC submission, status retrieval, and admin operations
 */
class KYCService {
  private readonly MAX_RETRIES = 2;
  private readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Submit KYC application with license details and images
   * Includes retry mechanism for failed uploads
   * 
   * @param data - KYC form data including license info and images
   * @returns Promise resolving to the created KYC submission
   * @throws Error with user-friendly message on failure
   */
  async submitKYC(data: KYCFormData): Promise<KYCSubmission> {
    return this.retryOperation(async () => {
      console.log('[KYC Service] Submitting KYC application...');
      
      // Create FormData for multipart upload
      const formData = this.createFormData(data);
      
      // Send POST request with multipart/form-data
      const response = await apiClient.post<{ success: boolean; data: { submission: KYCSubmission } }>(
        '/kyc/submit',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // 60 seconds for file upload
        }
      );
      
      console.log('[KYC Service] ✅ KYC submitted successfully');
      return response.data.data.submission;
    }, 'submit KYC');
  }

  /**
   * Get current user's KYC status
   * 
   * @returns Promise resolving to the latest KYC submission or null if none exists
   * @throws Error with user-friendly message on failure
   */
  async getKYCStatus(): Promise<KYCSubmission | null> {
    try {
      console.log('[KYC Service] Fetching KYC status...');
      
      const response = await apiClient.get<{ success: boolean; data: { submission: KYCSubmission | null } }>('/kyc/status');
      
      console.log('[KYC Service] ✅ KYC status retrieved');
      return response.data.data.submission;
    } catch (error) {
      console.error('[KYC Service] ❌ Get KYC status failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get user's KYC submission history
   * 
   * @returns Promise resolving to array of all user's KYC submissions
   * @throws Error with user-friendly message on failure
   */
  async getKYCHistory(): Promise<KYCSubmission[]> {
    try {
      console.log('[KYC Service] Fetching KYC history...');
      
      const response = await apiClient.get<{ success: boolean; data: { submissions: KYCSubmission[] } }>('/kyc/history');
      
      console.log('[KYC Service] ✅ KYC history retrieved');
      return response.data.data.submissions;
    } catch (error) {
      console.error('[KYC Service] ❌ Get KYC history failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get all KYC submissions with filtering and pagination (Admin only)
   * 
   * @param filters - Optional filters for status, search, and pagination
   * @returns Promise resolving to paginated KYC submissions
   * @throws Error with user-friendly message on failure
   */
  async getAllSubmissions(filters: KYCFilters = {}): Promise<PaginatedKYCResponse> {
    try {
      console.log('[KYC Service] Fetching all KYC submissions...', filters);
      
      // Build query parameters
      const params = new URLSearchParams();
      
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      
      if (filters.search) {
        params.append('search', filters.search);
      }
      
      if (filters.page) {
        params.append('page', filters.page.toString());
      }
      
      if (filters.limit) {
        params.append('limit', filters.limit.toString());
      }
      
      const queryString = params.toString();
      const url = `/kyc/admin/submissions${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get<{ success: boolean; data: PaginatedKYCResponse }>(url);
      
      console.log('[KYC Service] ✅ KYC submissions retrieved');
      return response.data.data;
    } catch (error) {
      console.error('[KYC Service] ❌ Get all submissions failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get specific KYC submission by ID (Admin only)
   * 
   * @param id - KYC submission ID
   * @returns Promise resolving to the KYC submission details
   * @throws Error with user-friendly message on failure
   */
  async getSubmissionById(id: string): Promise<KYCSubmission> {
    try {
      console.log('[KYC Service] Fetching KYC submission:', id);
      
      const response = await apiClient.get<{ success: boolean; data: { submission: KYCSubmission } }>(
        `/kyc/admin/submissions/${id}`
      );
      
      console.log('[KYC Service] ✅ KYC submission retrieved');
      return response.data.data.submission;
    } catch (error) {
      console.error('[KYC Service] ❌ Get submission by ID failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Approve KYC submission (Admin only)
   * 
   * @param id - KYC submission ID
   * @param note - Optional approval note
   * @returns Promise resolving to the updated KYC submission
   * @throws Error with user-friendly message on failure
   */
  async approveSubmission(id: string, note?: string): Promise<KYCSubmission> {
    try {
      console.log('[KYC Service] Approving KYC submission:', id);
      
      const response = await apiClient.put<{ success: boolean; data: { submission: KYCSubmission } }>(
        `/kyc/admin/submissions/${id}/approve`,
        { reviewNote: note }
      );
      
      console.log('[KYC Service] ✅ KYC submission approved');
      return response.data.data.submission;
    } catch (error) {
      console.error('[KYC Service] ❌ Approve submission failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Reject KYC submission (Admin only)
   * 
   * @param id - KYC submission ID
   * @param reason - Rejection reason (required, min 10 characters)
   * @returns Promise resolving to the updated KYC submission
   * @throws Error with user-friendly message on failure
   */
  async rejectSubmission(id: string, reason: string): Promise<KYCSubmission> {
    try {
      console.log('[KYC Service] Rejecting KYC submission:', id);
      
      // Client-side validation
      if (!reason || reason.trim().length < 10) {
        throw new Error('Rejection reason must be at least 10 characters');
      }
      
      const response = await apiClient.put<{ success: boolean; data: { submission: KYCSubmission } }>(
        `/kyc/admin/submissions/${id}/reject`,
        { reason }
      );
      
      console.log('[KYC Service] ✅ KYC submission rejected');
      return response.data.data.submission;
    } catch (error) {
      console.error('[KYC Service] ❌ Reject submission failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Revoke/Reject an approved KYC submission (Admin only)
   * 
   * @param id - KYC submission ID
   * @param reason - Revocation reason (required, min 10 characters)
   * @returns Promise resolving to the updated KYC submission
   * @throws Error with user-friendly message on failure
   */
  async revokeApprovedSubmission(id: string, reason: string): Promise<KYCSubmission> {
    try {
      console.log('[KYC Service] Revoking approved KYC submission:', id);
      
      // Client-side validation
      if (!reason || reason.trim().length < 10) {
        throw new Error('Revocation reason must be at least 10 characters');
      }
      
      const response = await apiClient.put<{ success: boolean; data: { submission: KYCSubmission } }>(
        `/kyc/admin/submissions/${id}/revoke`,
        { reason }
      );
      
      console.log('[KYC Service] ✅ Approved KYC submission revoked');
      return response.data.data.submission;
    } catch (error) {
      console.error('[KYC Service] ❌ Revoke submission failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Construct image URL for admin viewing
   * 
   * @param filename - Image filename stored in the database
   * @returns Full URL to access the image (requires admin authentication)
   */
  getImageUrl(filename: string): string {
    // Get base URL from apiClient config
    const baseURL = apiClient.defaults.baseURL || '';
    return `${baseURL}/kyc/admin/image/${filename}`;
  }

  /**
   * Create FormData object for multipart upload
   * 
   * @param data - KYC form data
   * @returns FormData object ready for upload
   * @private
   */
  private createFormData(data: KYCFormData): FormData {
    const formData = new FormData();
    
    // Add text fields
    formData.append('licenseNumber', data.licenseNumber);
    formData.append('fullName', data.fullName);
    formData.append('dateOfBirth', data.dateOfBirth.toISOString().split('T')[0]);
    formData.append('licenseExpiryDate', data.licenseExpiryDate.toISOString().split('T')[0]);
    
    // Add previous submission ID if resubmitting
    if (data.previousSubmissionId) {
      formData.append('previousSubmissionId', data.previousSubmissionId);
    }
    
    // Add license front image (REQUIRED)
    if (data.licenseFrontImage) {
      formData.append('licenseFrontImage', {
        uri: data.licenseFrontImage.uri,
        name: data.licenseFrontImage.name,
        type: data.licenseFrontImage.type,
      } as any);
    }
    
    // Add license back image (OPTIONAL)
    if (data.licenseBackImage) {
      formData.append('licenseBackImage', {
        uri: data.licenseBackImage.uri,
        name: data.licenseBackImage.name,
        type: data.licenseBackImage.type,
      } as any);
    }
    
    // Add selfie image (REQUIRED)
    if (data.selfieImage) {
      formData.append('selfieImage', {
        uri: data.selfieImage.uri,
        name: data.selfieImage.name,
        type: data.selfieImage.type,
      } as any);
    }
    
    return formData;
  }

  /**
   * Retry operation with exponential backoff
   * 
   * @param operation - Async operation to retry
   * @param operationName - Name of operation for logging
   * @returns Promise resolving to operation result
   * @private
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = this.handleError(error);
        
        // Don't retry on client errors (4xx) except for network errors
        if (error instanceof Error && 'response' in error) {
          const axiosError = error as AxiosError<any>;
          if (axiosError.response && axiosError.response.status < 500) {
            // Client error - don't retry
            throw lastError;
          }
        }
        
        // If this was the last attempt, throw the error
        if (attempt === this.MAX_RETRIES) {
          console.error(`[KYC Service] ❌ ${operationName} failed after ${this.MAX_RETRIES + 1} attempts`);
          throw lastError;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = this.RETRY_DELAY * Math.pow(2, attempt);
        console.log(`[KYC Service] ⚠️ ${operationName} failed, retrying in ${delay}ms (attempt ${attempt + 1}/${this.MAX_RETRIES + 1})`);
        await this.sleep(delay);
      }
    }
    
    // This should never be reached, but TypeScript needs it
    throw lastError || new Error('Operation failed');
  }

  /**
   * Sleep for specified milliseconds
   * 
   * @param ms - Milliseconds to sleep
   * @private
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Handle and transform errors into user-friendly messages
   * 
   * @param error - Error object from axios or other source
   * @returns Error object with user-friendly message
   * @private
   */
  private handleError(error: unknown): Error {
    if (error instanceof Error && 'response' in error) {
      const axiosError = error as AxiosError<any>;
      
      if (axiosError.response) {
        const { status, data } = axiosError.response;
        
        // Extract error message from various response formats
        const errorMessage = 
          data?.error?.message || 
          data?.error || 
          data?.message || 
          'An unexpected error occurred';
        
        // Handle specific error status codes
        switch (status) {
          case 400:
            // Bad request - validation errors
            if (errorMessage.toLowerCase().includes('expired')) {
              return new Error('Your license has expired. Please provide a valid license.');
            }
            if (errorMessage.toLowerCase().includes('pending')) {
              return new Error('You already have a pending KYC submission. Please wait for review.');
            }
            if (errorMessage.toLowerCase().includes('image') || errorMessage.toLowerCase().includes('file')) {
              return new Error('Invalid image file. Please upload clear photos of your license (JPEG, PNG, or PDF, max 5MB).');
            }
            return new Error(errorMessage);
          
          case 401:
            return new Error('Your session has expired. Please log in again.');
          
          case 403:
            return new Error('You do not have permission to perform this action.');
          
          case 404:
            return new Error('The requested information could not be found.');
          
          case 413:
            return new Error('Image file is too large. Please upload images smaller than 5MB.');
          
          case 429:
            return new Error('Too many requests. Please wait a moment and try again.');
          
          case 500:
            return new Error('Server error. Our team has been notified. Please try again later.');
          
          case 503:
            return new Error('Service temporarily unavailable. Please try again in a few moments.');
          
          default:
            return new Error(errorMessage);
        }
      } else if (axiosError.request) {
        // Network error - no response received
        if (axiosError.code === 'ECONNABORTED') {
          return new Error('Request timeout. Please check your internet connection and try again.');
        }
        return new Error('Network error. Please check your internet connection and try again.');
      }
    }
    
    // Generic error
    if (error instanceof Error) {
      return error;
    }
    
    return new Error('An unexpected error occurred. Please try again.');
  }
}

// Export singleton instance
export default new KYCService();
