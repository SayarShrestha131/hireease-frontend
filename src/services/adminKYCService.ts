/**
 * Admin KYC Service
 * 
 * This module provides methods for admin users to manage KYC submissions with enhanced features.
 * Handles KYC submission retrieval, filtering, approval, rejection, and revocation operations.
 */

import apiClient from './apiClient';
import {
  KYCSubmission,
  KYCFilters,
  PaginatedKYCResponse,
  ApproveKYCRequest,
  RejectKYCRequest,
  KYCActionResponse,
} from '../types/kyc';
import { AxiosError } from 'axios';

/**
 * Enhanced KYC filters interface for admin operations
 */
export interface AdminKYCFilters extends KYCFilters {
  faceConfidenceMin?: number;
  faceConfidenceMax?: number;
  ocrConfidenceMin?: number;
  ocrConfidenceMax?: number;
  autoApproved?: boolean;
  hasOCRData?: boolean;
  hasFaceData?: boolean;
  sortBy?: 'submittedAt' | 'faceConfidence' | 'ocrConfidence' | 'reviewedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Admin KYC Service Class
 * Provides methods for admin KYC management with enhanced filtering and confidence score features
 */
class AdminKYCService {
  private readonly MAX_RETRIES = 2;
  private readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Get all KYC submissions with enhanced filtering and pagination
   * Supports filtering by confidence scores, auto-approval status, and more
   * 
   * @param filters - Enhanced filters including confidence score ranges
   * @returns Promise resolving to paginated KYC submissions with metadata
   * @throws Error with user-friendly message on failure
   */
  async getKYCSubmissions(filters: AdminKYCFilters = {}): Promise<PaginatedKYCResponse> {
    try {
      console.log('[Admin KYC Service] Fetching KYC submissions with filters...', filters);
      
      // Build query parameters
      const params = new URLSearchParams();
      
      // Basic filters
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
      
      // Enhanced filters for confidence scores
      if (filters.faceConfidenceMin !== undefined) {
        params.append('faceConfidenceMin', filters.faceConfidenceMin.toString());
      }
      
      if (filters.faceConfidenceMax !== undefined) {
        params.append('faceConfidenceMax', filters.faceConfidenceMax.toString());
      }
      
      if (filters.ocrConfidenceMin !== undefined) {
        params.append('ocrConfidenceMin', filters.ocrConfidenceMin.toString());
      }
      
      if (filters.ocrConfidenceMax !== undefined) {
        params.append('ocrConfidenceMax', filters.ocrConfidenceMax.toString());
      }
      
      // Boolean filters
      if (filters.autoApproved !== undefined) {
        params.append('autoApproved', filters.autoApproved.toString());
      }
      
      if (filters.hasOCRData !== undefined) {
        params.append('hasOCRData', filters.hasOCRData.toString());
      }
      
      if (filters.hasFaceData !== undefined) {
        params.append('hasFaceData', filters.hasFaceData.toString());
      }
      
      // Sorting options
      if (filters.sortBy) {
        params.append('sortBy', filters.sortBy);
      }
      
      if (filters.sortOrder) {
        params.append('sortOrder', filters.sortOrder);
      }
      
      const queryString = params.toString();
      const url = `/kyc/admin/submissions${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get<{ success: boolean; data: PaginatedKYCResponse }>(url);
      
      console.log('[Admin KYC Service] ✅ KYC submissions retrieved successfully');
      return response.data.data;
    } catch (error) {
      console.error('[Admin KYC Service] ❌ Get KYC submissions failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get specific KYC submission by ID with full details
   * Includes all confidence scores, OCR data, face detection results, and audit trail
   * 
   * @param id - KYC submission ID
   * @returns Promise resolving to the complete KYC submission details
   * @throws Error with user-friendly message on failure
   */
  async getKYCSubmissionById(id: string): Promise<KYCSubmission> {
    try {
      console.log('[Admin KYC Service] Fetching KYC submission details:', id);
      
      const response = await apiClient.get<{ success: boolean; data: { submission: KYCSubmission } }>(
        `/kyc/admin/submissions/${id}`
      );
      
      console.log('[Admin KYC Service] ✅ KYC submission details retrieved successfully');
      return response.data.data.submission;
    } catch (error) {
      console.error('[Admin KYC Service] ❌ Get KYC submission by ID failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Approve KYC submission with optional review note
   * Records admin ID, timestamp, and audit trail
   * 
   * @param id - KYC submission ID
   * @param reviewNote - Optional approval note for audit trail
   * @returns Promise resolving to the updated KYC submission
   * @throws Error with user-friendly message on failure
   */
  async approveKYC(id: string, reviewNote?: string): Promise<KYCSubmission> {
    return this.retryOperation(async () => {
      console.log('[Admin KYC Service] Approving KYC submission:', id);
      
      const requestData: ApproveKYCRequest = {};
      if (reviewNote && reviewNote.trim()) {
        requestData.note = reviewNote.trim();
      }
      
      const response = await apiClient.put<{ success: boolean; data: { submission: KYCSubmission } }>(
        `/kyc/admin/submissions/${id}/approve`,
        requestData
      );
      
      console.log('[Admin KYC Service] ✅ KYC submission approved successfully');
      return response.data.data.submission;
    }, 'approve KYC submission');
  }

  /**
   * Reject KYC submission with mandatory reason
   * Validates reason length and records full audit trail
   * 
   * @param id - KYC submission ID
   * @param reason - Rejection reason (required, minimum 10 characters)
   * @returns Promise resolving to the updated KYC submission
   * @throws Error with user-friendly message on failure
   */
  async rejectKYC(id: string, reason: string): Promise<KYCSubmission> {
    return this.retryOperation(async () => {
      console.log('[Admin KYC Service] Rejecting KYC submission:', id);
      
      // Client-side validation for rejection reason
      if (!reason || reason.trim().length < 10) {
        throw new Error('Rejection reason must be at least 10 characters long');
      }
      
      const requestData: RejectKYCRequest = {
        reason: reason.trim()
      };
      
      const response = await apiClient.put<{ success: boolean; data: { submission: KYCSubmission } }>(
        `/kyc/admin/submissions/${id}/reject`,
        requestData
      );
      
      console.log('[Admin KYC Service] ✅ KYC submission rejected successfully');
      return response.data.data.submission;
    }, 'reject KYC submission');
  }

  /**
   * Revoke previously approved KYC submission
   * Changes status from approved back to rejected with audit trail
   * 
   * @param id - KYC submission ID (must be currently approved)
   * @param reason - Revocation reason (required, minimum 10 characters)
   * @returns Promise resolving to the updated KYC submission
   * @throws Error with user-friendly message on failure
   */
  async revokeKYC(id: string, reason: string): Promise<KYCSubmission> {
    return this.retryOperation(async () => {
      console.log('[Admin KYC Service] Revoking approved KYC submission:', id);
      
      // Client-side validation for revocation reason
      if (!reason || reason.trim().length < 10) {
        throw new Error('Revocation reason must be at least 10 characters long');
      }
      
      const requestData: RejectKYCRequest = {
        reason: reason.trim()
      };
      
      const response = await apiClient.put<{ success: boolean; data: { submission: KYCSubmission } }>(
        `/kyc/admin/submissions/${id}/revoke`,
        requestData
      );
      
      console.log('[Admin KYC Service] ✅ Approved KYC submission revoked successfully');
      return response.data.data.submission;
    }, 'revoke KYC submission');
  }

  /**
   * Get KYC image URL for admin viewing
   * Constructs authenticated URL for accessing KYC images
   * 
   * @param filename - Image filename stored in the database
   * @returns Full URL to access the image (requires admin authentication)
   */
  getKYCImageUrl(filename: string): string {
    // Get base URL from apiClient config
    const baseURL = apiClient.defaults.baseURL || '';
    return `${baseURL}/kyc/admin/image/${filename}`;
  }

  /**
   * Get confidence score color coding for UI display
   * Returns color based on confidence thresholds for visual indicators
   * 
   * @param confidence - Confidence score (0-100)
   * @returns Color string for UI styling
   */
  getConfidenceColor(confidence: number): 'green' | 'yellow' | 'red' {
    if (confidence >= 85) {
      return 'green';  // High confidence
    } else if (confidence >= 60) {
      return 'yellow'; // Medium confidence
    } else {
      return 'red';    // Low confidence
    }
  }

  /**
   * Get confidence score label for UI display
   * Returns human-readable label based on confidence thresholds
   * 
   * @param confidence - Confidence score (0-100)
   * @returns Label string for UI display
   */
  getConfidenceLabel(confidence: number): 'High' | 'Medium' | 'Low' {
    if (confidence >= 85) {
      return 'High';
    } else if (confidence >= 60) {
      return 'Medium';
    } else {
      return 'Low';
    }
  }

  /**
   * Check if submission requires manual review
   * Based on confidence scores and auto-approval thresholds
   * 
   * @param submission - KYC submission object
   * @returns Boolean indicating if manual review is needed
   */
  requiresManualReview(submission: KYCSubmission): boolean {
    // Check face confidence
    const faceConfidence = submission.faceDetection?.identityConfidence || 0;
    if (faceConfidence < 60) {
      return true;
    }
    
    // Check OCR confidence
    const ocrConfidence = submission.ocrData?.overallConfidence || 0;
    if (ocrConfidence < 70) {
      return true;
    }
    
    // Check if face decision indicates manual review
    if (submission.faceDecision?.reviewedSignal === 'manual-review-needed') {
      return true;
    }
    
    // Check data verification match score
    const matchScore = submission.dataVerification?.matchScore || 0;
    if (matchScore < 80) {
      return true;
    }
    
    return false;
  }

  /**
   * Get submission priority for admin queue
   * Returns priority level based on confidence scores and submission age
   * 
   * @param submission - KYC submission object
   * @returns Priority level (high, medium, low)
   */
  getSubmissionPriority(submission: KYCSubmission): 'high' | 'medium' | 'low' {
    const submittedAt = new Date(submission.submittedAt);
    const daysSinceSubmission = (Date.now() - submittedAt.getTime()) / (1000 * 60 * 60 * 24);
    
    // High priority: old submissions or fraud indicators
    if (daysSinceSubmission > 2) {
      return 'high';
    }
    
    const faceConfidence = submission.faceDetection?.identityConfidence || 0;
    const ocrConfidence = submission.ocrData?.overallConfidence || 0;
    
    // High priority: very low confidence scores (potential fraud)
    if (faceConfidence < 30 || ocrConfidence < 30) {
      return 'high';
    }
    
    // Medium priority: moderate confidence scores
    if (faceConfidence < 70 || ocrConfidence < 70) {
      return 'medium';
    }
    
    // Low priority: high confidence scores
    return 'low';
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
          console.error(`[Admin KYC Service] ❌ ${operationName} failed after ${this.MAX_RETRIES + 1} attempts`);
          throw lastError;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = this.RETRY_DELAY * Math.pow(2, attempt);
        console.log(`[Admin KYC Service] ⚠️ ${operationName} failed, retrying in ${delay}ms (attempt ${attempt + 1}/${this.MAX_RETRIES + 1})`);
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
            if (errorMessage.toLowerCase().includes('pending')) {
              return new Error('Cannot modify submission - it is not in pending status.');
            }
            if (errorMessage.toLowerCase().includes('reason')) {
              return new Error('Rejection/revocation reason must be at least 10 characters long.');
            }
            return new Error(errorMessage);
          
          case 401:
            return new Error('Your session has expired. Please log in again.');
          
          case 403:
            return new Error('Access denied. Admin privileges required for this action.');
          
          case 404:
            return new Error('KYC submission not found. It may have been deleted or does not exist.');
          
          case 409:
            return new Error('Cannot perform this action - submission status conflict.');
          
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
const adminKYCService = new AdminKYCService();
export default adminKYCService;