/**
 * Profile Service
 * 
 * This module provides methods for interacting with user profile API endpoints.
 * Handles profile picture upload, retrieval, and deletion operations.
 */

import apiClient from './apiClient';
import { AxiosError } from 'axios';

/**
 * Profile picture upload data interface
 */
export interface ProfilePictureData {
  uri: string;
  name: string;
  type: string;
}

/**
 * Profile picture upload response interface
 */
export interface ProfilePictureResponse {
  success: boolean;
  message: string;
  data: {
    filename: string;
    url: string;
  };
}

/**
 * Profile Service Class
 * Provides methods for profile picture management
 */
class ProfileService {
  private readonly MAX_RETRIES = 2;
  private readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Upload profile picture with face validation
   * @param imageData Profile picture image data
   * @returns Promise<ProfilePictureResponse>
   */
  async uploadProfilePicture(imageData: ProfilePictureData): Promise<ProfilePictureResponse> {
    return this.retryOperation(async () => {
      console.log('[Profile Service] Uploading profile picture...');
      
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('profilePicture', {
        uri: imageData.uri,
        name: imageData.name,
        type: imageData.type,
      } as any);
      
      // Send POST request with multipart/form-data
      const response = await apiClient.post<ProfilePictureResponse>(
        '/profile/picture',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30 seconds for file upload
        }
      );
      
      console.log('[Profile Service] ✅ Profile picture uploaded successfully');
      return response.data;
    }, 'upload profile picture');
  }

  /**
   * Get current profile picture URL
   * @returns Promise<string | null>
   */
  async getProfilePicture(): Promise<string | null> {
    try {
      console.log('[Profile Service] Fetching profile picture...');
      
      const response = await apiClient.get<{
        success: boolean;
        data: {
          profilePicture: string | null;
          url: string | null;
        };
      }>('/profile/picture');
      
      console.log('[Profile Service] ✅ Profile picture retrieved');
      return response.data.data.url;
    } catch (error) {
      console.error('[Profile Service] ❌ Get profile picture failed:', error);
      
      // If 404, user has no profile picture
      if (this.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      
      throw this.handleError(error);
    }
  }

  /**
   * Delete current profile picture
   * @returns Promise<void>
   */
  async deleteProfilePicture(): Promise<void> {
    try {
      console.log('[Profile Service] Deleting profile picture...');
      
      await apiClient.delete('/profile/picture');
      
      console.log('[Profile Service] ✅ Profile picture deleted successfully');
    } catch (error) {
      console.error('[Profile Service] ❌ Delete profile picture failed:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get profile picture URL for display
   * @param filename Profile picture filename
   * @returns Profile picture URL
   */
  getProfilePictureUrl(filename: string): string {
    // Get base URL from apiClient config
    const baseURL = apiClient.defaults.baseURL || '';
    return `${baseURL}/profile/picture/${filename}`;
  }

  /**
   * Check if profile picture exists
   * @returns Promise<boolean>
   */
  async hasProfilePicture(): Promise<boolean> {
    try {
      const url = await this.getProfilePicture();
      return url !== null;
    } catch (error) {
      console.error('[Profile Service] ❌ Check profile picture failed:', error);
      return false;
    }
  }

  /**
   * Upload profile picture with progress tracking
   * @param imageData Profile picture image data
   * @param onProgress Progress callback function
   * @returns Promise<ProfilePictureResponse>
   */
  async uploadProfilePictureWithProgress(
    imageData: ProfilePictureData,
    onProgress?: (progress: number) => void
  ): Promise<ProfilePictureResponse> {
    return this.retryOperation(async () => {
      console.log('[Profile Service] Uploading profile picture with progress tracking...');
      
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('profilePicture', {
        uri: imageData.uri,
        name: imageData.name,
        type: imageData.type,
      } as any);
      
      // Send POST request with progress tracking
      const response = await apiClient.post<ProfilePictureResponse>(
        '/profile/picture',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30 seconds for file upload
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              onProgress(progress);
            }
          },
        }
      );
      
      console.log('[Profile Service] ✅ Profile picture uploaded successfully with progress');
      return response.data;
    }, 'upload profile picture with progress');
  }

  /**
   * Retry operation with exponential backoff
   * @param operation Operation to retry
   * @param operationName Name of the operation for logging
   * @returns Promise<T>
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES + 1; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = this.handleError(error);
        
        if (attempt <= this.MAX_RETRIES) {
          const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1);
          console.log(`[Profile Service] ⚠️ ${operationName} failed (attempt ${attempt}), retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }
    
    console.error(`[Profile Service] ❌ ${operationName} failed after ${this.MAX_RETRIES + 1} attempts`);
    throw lastError!;
  }

  /**
   * Sleep for specified milliseconds
   * @param ms Milliseconds to sleep
   * @returns Promise<void>
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Handle and normalize errors
   * @param error Unknown error object
   * @returns Normalized Error object
   */
  private handleError(error: unknown): Error {
    if (this.isAxiosError(error)) {
      const message = error.response?.data?.message || error.response?.data?.error || error.message;
      const statusCode = error.response?.status;
      
      console.error(`[Profile Service] API Error (${statusCode}):`, message);
      
      // Create a more descriptive error message
      let errorMessage = message;
      if (statusCode === 400) {
        errorMessage = `Invalid request: ${message}`;
      } else if (statusCode === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (statusCode === 403) {
        errorMessage = 'Access denied. You do not have permission to perform this action.';
      } else if (statusCode === 404) {
        errorMessage = 'Profile picture not found.';
      } else if (statusCode === 413) {
        errorMessage = 'File too large. Please choose a smaller image (max 5MB).';
      } else if (statusCode === 429) {
        errorMessage = 'Too many requests. Please wait before trying again.';
      } else if (statusCode && statusCode >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      return new Error(errorMessage);
    }
    
    if (error instanceof Error) {
      return error;
    }
    
    return new Error('An unexpected error occurred');
  }

  /**
   * Type guard to check if error is an AxiosError
   * @param error Unknown error object
   * @returns boolean
   */
  private isAxiosError(error: unknown): error is AxiosError<any> {
    return error !== null && typeof error === 'object' && 'isAxiosError' in error;
  }
}

// Export singleton instance
const profileService = new ProfileService();
export default profileService;