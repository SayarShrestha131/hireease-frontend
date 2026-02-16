/**
 * Error Handler Utility
 * Provides user-friendly error messages and handling for API errors
 */

import { AxiosError } from 'axios';
import { showError, showKYCRequired, showNetworkError } from './toast';
import { logErrorMessage } from './logger';

export interface ErrorResponse {
  success: boolean;
  error: {
    message: string;
    statusCode: number;
    errors?: Array<{ field: string; message: string }>;
  };
  kycStatus?: {
    status: string;
    submittedAt?: string;
  };
}

/**
 * Extract user-friendly error message from API error
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && 'response' in error) {
    const axiosError = error as AxiosError<ErrorResponse>;
    
    if (axiosError.response) {
      const { status, data } = axiosError.response;
      
      // Extract error message from various response formats
      const errorMessage = 
        data?.error?.message || 
        data?.error || 
        (data as any)?.message || 
        'An unexpected error occurred';
      
      // Handle specific error status codes with user-friendly messages
      switch (status) {
        case 400:
          if (errorMessage.toLowerCase().includes('kyc')) {
            return 'Please complete your KYC verification before booking.';
          }
          if (errorMessage.toLowerCase().includes('date')) {
            return 'Invalid dates selected. Please check your pickup and dropoff dates.';
          }
          return errorMessage;
        
        case 401:
          return 'Your session has expired. Please log in again.';
        
        case 403:
          if (errorMessage.toLowerCase().includes('kyc')) {
            return 'KYC verification required. Please complete your profile verification.';
          }
          return 'You do not have permission to perform this action.';
        
        case 404:
          if (errorMessage.toLowerCase().includes('vehicle')) {
            return 'Vehicle not found. It may no longer be available.';
          }
          if (errorMessage.toLowerCase().includes('booking')) {
            return 'Booking not found.';
          }
          return 'The requested information could not be found.';
        
        case 409:
          if (errorMessage.toLowerCase().includes('available')) {
            return 'Vehicle is not available for the selected dates. Please choose different dates.';
          }
          return errorMessage;
        
        case 429:
          return 'Too many requests. Please wait a moment and try again.';
        
        case 500:
          return 'Server error. Please try again later.';
        
        case 503:
          return 'Service temporarily unavailable. Please try again in a few moments.';
        
        default:
          return errorMessage;
      }
    } else if (axiosError.request) {
      // Network error - no response received
      if (axiosError.code === 'ECONNABORTED') {
        return 'Request timeout. Please check your internet connection.';
      }
      return 'Network error. Please check your internet connection.';
    }
  }
  
  // Generic error
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Check if error is a KYC verification error
 */
export const isKYCError = (error: unknown): boolean => {
  if (error instanceof Error && 'response' in error) {
    const axiosError = error as AxiosError<ErrorResponse>;
    
    if (axiosError.response) {
      const { status, data } = axiosError.response;
      
      if (status === 403 && data?.error?.message) {
        return data.error.message.toLowerCase().includes('kyc');
      }
      
      if (data?.kycStatus) {
        return true;
      }
    }
  }
  
  return false;
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error && 'request' in error) {
    const axiosError = error as AxiosError;
    return !axiosError.response && !!axiosError.request;
  }
  
  return false;
};

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error: unknown): boolean => {
  if (error instanceof Error && 'response' in error) {
    const axiosError = error as AxiosError<ErrorResponse>;
    return axiosError.response?.status === 401;
  }
  
  return false;
};

/**
 * Handle API error with appropriate user feedback
 */
export const handleApiError = (
  error: unknown,
  context: string,
  onKYCRequired?: () => void,
  onRetry?: () => void
): void => {
  // Log the error
  logErrorMessage(`${context} failed`, error as Error);
  
  // Check for specific error types
  if (isKYCError(error)) {
    if (onKYCRequired) {
      showKYCRequired(onKYCRequired);
    } else {
      showError('KYC verification required. Please complete your profile verification.');
    }
    return;
  }
  
  if (isNetworkError(error)) {
    if (onRetry) {
      showNetworkError(onRetry);
    } else {
      showNetworkError();
    }
    return;
  }
  
  if (isAuthError(error)) {
    showError('Your session has expired. Please log in again.');
    return;
  }
  
  // Show generic error message
  const message = getErrorMessage(error);
  showError(message);
};

/**
 * Validate booking dates before API call
 */
export const validateBookingDates = (
  pickupDate: Date,
  dropoffDate: Date
): { valid: boolean; error?: string } => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  // Check if pickup date is in the past
  if (pickupDate < now) {
    return {
      valid: false,
      error: 'Pickup date cannot be in the past.',
    };
  }
  
  // Check if dropoff date is before pickup date
  if (dropoffDate <= pickupDate) {
    return {
      valid: false,
      error: 'Dropoff date must be after pickup date.',
    };
  }
  
  // Check if dates are too far in the future (e.g., more than 1 year)
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  
  if (pickupDate > oneYearFromNow) {
    return {
      valid: false,
      error: 'Pickup date cannot be more than 1 year in the future.',
    };
  }
  
  return { valid: true };
};

/**
 * Format validation errors from API
 */
export const formatValidationErrors = (
  errors?: Array<{ field: string; message: string }>
): string => {
  if (!errors || errors.length === 0) {
    return 'Validation failed. Please check your input.';
  }
  
  if (errors.length === 1) {
    return errors[0].message;
  }
  
  return errors.map(e => `• ${e.message}`).join('\n');
};

/**
 * Get KYC status from error response
 */
export const getKYCStatusFromError = (error: unknown): string | null => {
  if (error instanceof Error && 'response' in error) {
    const axiosError = error as AxiosError<ErrorResponse>;
    
    if (axiosError.response?.data?.kycStatus) {
      return axiosError.response.data.kycStatus.status;
    }
  }
  
  return null;
};

export default {
  getErrorMessage,
  isKYCError,
  isNetworkError,
  isAuthError,
  handleApiError,
  validateBookingDates,
  formatValidationErrors,
  getKYCStatusFromError,
};
