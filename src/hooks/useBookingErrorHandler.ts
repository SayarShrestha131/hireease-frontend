/**
 * useBookingErrorHandler Hook
 * 
 * Custom hook for handling booking-related errors with appropriate UI feedback
 * Provides consistent error handling across all booking screens
 */

import { useState, useCallback } from 'react';
import { showError, showKYCRequired, showNetworkError } from '../utils/toast';

export type KYCStatus = 'not_submitted' | 'pending' | 'rejected' | 'approved';

interface BookingErrorState {
  error: string | null;
  showKYCModal: boolean;
  kycStatus: KYCStatus;
  showAvailabilityAlert: boolean;
  conflictingBookings: any[];
}

interface UseBookingErrorHandlerReturn {
  error: string | null;
  showKYCModal: boolean;
  kycStatus: KYCStatus;
  showAvailabilityAlert: boolean;
  conflictingBookings: any[];
  handleError: (error: any, onRetry?: () => void) => void;
  clearError: () => void;
  closeKYCModal: () => void;
  closeAvailabilityAlert: () => void;
}

/**
 * Hook for handling booking errors with appropriate UI feedback
 * 
 * @returns Error handling state and methods
 * 
 * @example
 * ```typescript
 * const {
 *   error,
 *   showKYCModal,
 *   handleError,
 *   clearError,
 *   closeKYCModal
 * } = useBookingErrorHandler();
 * 
 * try {
 *   await bookingService.createBooking(data);
 * } catch (err) {
 *   handleError(err, () => retryBooking());
 * }
 * ```
 */
export function useBookingErrorHandler(): UseBookingErrorHandlerReturn {
  const [state, setState] = useState<BookingErrorState>({
    error: null,
    showKYCModal: false,
    kycStatus: 'not_submitted',
    showAvailabilityAlert: false,
    conflictingBookings: [],
  });

  /**
   * Handle booking errors and show appropriate UI feedback
   */
  const handleError = useCallback((error: any, onRetry?: () => void) => {
    console.log('[Error Handler] Processing error:', error);

    const errorMessage = error?.message || 'An unexpected error occurred';

    // Check for KYC verification errors
    if (errorMessage.toLowerCase().includes('kyc')) {
      let kycStatus: KYCStatus = 'not_submitted';
      
      if (errorMessage.toLowerCase().includes('pending')) {
        kycStatus = 'pending';
      } else if (errorMessage.toLowerCase().includes('rejected')) {
        kycStatus = 'rejected';
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
        showKYCModal: true,
        kycStatus,
      }));
      return;
    }

    // Check for availability/conflict errors
    if (
      errorMessage.toLowerCase().includes('available') ||
      errorMessage.toLowerCase().includes('booked') ||
      errorMessage.toLowerCase().includes('conflict')
    ) {
      // Extract conflicting bookings if available
      const conflictingBookings = error?.response?.data?.conflictingBookings || [];
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        showAvailabilityAlert: true,
        conflictingBookings,
      }));
      return;
    }

    // Check for network errors
    if (
      errorMessage.toLowerCase().includes('network') ||
      errorMessage.toLowerCase().includes('connection') ||
      errorMessage.toLowerCase().includes('timeout')
    ) {
      if (onRetry) {
        showNetworkError(onRetry);
      } else {
        showError(errorMessage);
      }
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      return;
    }

    // Check for session/auth errors
    if (
      errorMessage.toLowerCase().includes('session') ||
      errorMessage.toLowerCase().includes('expired') ||
      errorMessage.toLowerCase().includes('unauthorized')
    ) {
      showError('Your session has expired. Please log in again.');
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      return;
    }

    // Check for validation errors
    if (
      errorMessage.toLowerCase().includes('invalid') ||
      errorMessage.toLowerCase().includes('validation')
    ) {
      // Show inline error for validation issues
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }));
      return;
    }

    // Generic error handling
    if (onRetry) {
      showError(errorMessage);
    } else {
      showError(errorMessage);
    }

    setState(prev => ({
      ...prev,
      error: errorMessage,
    }));
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  /**
   * Close KYC verification modal
   */
  const closeKYCModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      showKYCModal: false,
    }));
  }, []);

  /**
   * Close availability conflict alert
   */
  const closeAvailabilityAlert = useCallback(() => {
    setState(prev => ({
      ...prev,
      showAvailabilityAlert: false,
    }));
  }, []);

  return {
    error: state.error,
    showKYCModal: state.showKYCModal,
    kycStatus: state.kycStatus,
    showAvailabilityAlert: state.showAvailabilityAlert,
    conflictingBookings: state.conflictingBookings,
    handleError,
    clearError,
    closeKYCModal,
    closeAvailabilityAlert,
  };
}
