/**
 * Toast Notification Utility
 * 
 * Provides a simple toast notification system using React Native's Alert API
 * for success, error, info, and warning messages.
 */

import { Alert, Platform } from 'react-native';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  title?: string;
  message: string;
  duration?: number;
  onPress?: () => void;
}

/**
 * Show a toast notification
 * 
 * @param type - Type of toast (success, error, info, warning)
 * @param options - Toast configuration options
 */
export const showToast = (type: ToastType, options: ToastOptions): void => {
  const { title, message, onPress } = options;
  
  // Determine default title based on type
  const defaultTitle = {
    success: '✅ Success',
    error: '❌ Error',
    info: 'ℹ️ Info',
    warning: '⚠️ Warning',
  }[type];
  
  const toastTitle = title || defaultTitle;
  
  // Show alert
  Alert.alert(
    toastTitle,
    message,
    [
      {
        text: 'OK',
        onPress: onPress,
      },
    ],
    { cancelable: true }
  );
};

/**
 * Show a success toast
 */
export const showSuccess = (message: string, onPress?: () => void): void => {
  showToast('success', { message, onPress });
};

/**
 * Show an error toast
 */
export const showError = (message: string, onPress?: () => void): void => {
  showToast('error', { message, onPress });
};

/**
 * Show an info toast
 */
export const showInfo = (message: string, onPress?: () => void): void => {
  showToast('info', { message, onPress });
};

/**
 * Show a warning toast
 */
export const showWarning = (message: string, onPress?: () => void): void => {
  showToast('warning', { message, onPress });
};

/**
 * Show a confirmation dialog
 * 
 * @param title - Dialog title
 * @param message - Dialog message
 * @param onConfirm - Callback when user confirms
 * @param onCancel - Callback when user cancels
 */
export const showConfirmation = (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
): void => {
  Alert.alert(
    title,
    message,
    [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: 'Confirm',
        onPress: onConfirm,
      },
    ],
    { cancelable: true }
  );
};

/**
 * Show a retry confirmation dialog
 * 
 * @param message - Error message to display
 * @param onRetry - Callback when user chooses to retry
 * @param onCancel - Callback when user cancels
 */
export const showRetryConfirmation = (
  message: string,
  onRetry: () => void,
  onCancel?: () => void
): void => {
  Alert.alert(
    '⚠️ Operation Failed',
    message,
    [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: 'Retry',
        onPress: onRetry,
      },
    ],
    { cancelable: true }
  );
};

/**
 * Show a network error toast with retry option
 * 
 * @param onRetry - Callback when user chooses to retry
 */
export const showNetworkError = (onRetry?: () => void): void => {
  const message = 'Network connection failed. Please check your internet connection and try again.';
  
  if (onRetry) {
    showRetryConfirmation(message, onRetry);
  } else {
    showError(message);
  }
};

/**
 * Show a KYC verification required toast
 * 
 * @param onNavigateToKYC - Callback to navigate to KYC screen
 */
export const showKYCRequired = (onNavigateToKYC?: () => void): void => {
  const message = 'KYC verification is required to book vehicles. Would you like to complete it now?';
  
  if (onNavigateToKYC) {
    Alert.alert(
      'ℹ️ KYC Verification Required',
      message,
      [
        {
          text: 'Maybe Later',
          style: 'cancel',
        },
        {
          text: 'Complete KYC',
          onPress: onNavigateToKYC,
        },
      ],
      { cancelable: true }
    );
  } else {
    showInfo('KYC verification is required to book vehicles. Please complete KYC verification from your profile.');
  }
};

/**
 * Show a booking success toast
 * 
 * @param bookingId - Booking ID to display
 * @param onViewBooking - Optional callback to view booking details
 */
export const showBookingSuccess = (bookingId: string, onViewBooking?: () => void): void => {
  const message = `Your booking (${bookingId}) has been created successfully!`;
  
  if (onViewBooking) {
    Alert.alert(
      '✅ Booking Created',
      message,
      [
        {
          text: 'OK',
          style: 'cancel',
        },
        {
          text: 'View Booking',
          onPress: onViewBooking,
        },
      ],
      { cancelable: true }
    );
  } else {
    showSuccess(message);
  }
};

/**
 * Show a payment success toast
 */
export const showPaymentSuccess = (): void => {
  showSuccess('Payment confirmed successfully! Your booking is now active.');
};

/**
 * Show a cancellation confirmation dialog
 * 
 * @param onConfirm - Callback when user confirms cancellation
 * @param onCancel - Callback when user cancels
 */
export const showCancellationConfirmation = (
  onConfirm: () => void,
  onCancel?: () => void
): void => {
  Alert.alert(
    '⚠️ Cancel Booking',
    'Are you sure you want to cancel this booking? This action cannot be undone.',
    [
      {
        text: 'No, Keep Booking',
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: onConfirm,
      },
    ],
    { cancelable: true }
  );
};
