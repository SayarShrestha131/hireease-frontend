# Error Handling Guide for Booking System

This guide explains how to use the error handling components and utilities in the vehicle booking system.

## Components

### 1. ErrorDisplay

Reusable error display component with retry functionality.

```typescript
import { ErrorDisplay } from '../components';

// Basic usage
<ErrorDisplay 
  error={error}
  onDismiss={() => setError(null)}
/>

// With retry functionality
<ErrorDisplay 
  error={error}
  onRetry={handleRetry}
  onDismiss={() => setError(null)}
  showRetry={true}
  retryText="Try Again"
/>
```

### 2. KYCVerificationModal

Modal that prompts users to complete KYC verification.

```typescript
import { KYCVerificationModal } from '../components';

<KYCVerificationModal
  visible={showKYCModal}
  onClose={() => setShowKYCModal(false)}
  onNavigateToKYC={() => {
    setShowKYCModal(false);
    navigation.navigate('KYCSubmission');
  }}
  kycStatus="not_submitted" // or 'pending', 'rejected', 'approved'
/>
```

### 3. AvailabilityConflictAlert

Alert for vehicle availability conflicts with date suggestions.

```typescript
import { AvailabilityConflictAlert } from '../components';

<AvailabilityConflictAlert
  visible={showAvailabilityAlert}
  onClose={() => setShowAvailabilityAlert(false)}
  onModifyDates={() => {
    setShowAvailabilityAlert(false);
    // Reset form or focus on date pickers
  }}
  conflictingBookings={conflictingBookings}
  suggestedDates={[
    { pickupDate: new Date(), dropoffDate: new Date() }
  ]}
/>
```

## Hooks

### useBookingErrorHandler

Custom hook for handling booking-related errors with appropriate UI feedback.

```typescript
import { useBookingErrorHandler } from '../hooks/useBookingErrorHandler';

const MyBookingScreen = () => {
  const {
    error,
    showKYCModal,
    kycStatus,
    showAvailabilityAlert,
    conflictingBookings,
    handleError,
    clearError,
    closeKYCModal,
    closeAvailabilityAlert,
  } = useBookingErrorHandler();

  const createBooking = async () => {
    try {
      const booking = await bookingService.createBooking(data);
      // Success handling
    } catch (err) {
      handleError(err, () => createBooking()); // Pass retry function
    }
  };

  return (
    <View>
      <ErrorDisplay 
        error={error}
        onRetry={createBooking}
        onDismiss={clearError}
      />
      
      <KYCVerificationModal
        visible={showKYCModal}
        onClose={closeKYCModal}
        onNavigateToKYC={navigateToKYC}
        kycStatus={kycStatus}
      />
      
      <AvailabilityConflictAlert
        visible={showAvailabilityAlert}
        onClose={closeAvailabilityAlert}
        onModifyDates={handleModifyDates}
        conflictingBookings={conflictingBookings}
      />
    </View>
  );
};
```

## Utilities

### Toast Notifications

Enhanced toast utilities for common booking scenarios.

```typescript
import {
  showSuccess,
  showError,
  showKYCRequired,
  showNetworkError,
  showBookingSuccess,
  showPaymentSuccess,
  showCancellationConfirmation,
  showRetryConfirmation,
} from '../utils/toast';

// Success messages
showSuccess('Booking created successfully!');
showBookingSuccess('BK-20250104-0001', () => navigateToBooking());
showPaymentSuccess();

// Error messages
showError('Failed to create booking');
showNetworkError(() => retryOperation());

// KYC required
showKYCRequired(() => navigateToKYC());

// Confirmations
showCancellationConfirmation(
  () => cancelBooking(),
  () => console.log('Cancelled')
);

showRetryConfirmation(
  'Failed to load bookings',
  () => loadBookings(),
  () => console.log('Cancelled')
);
```

### Retry Utility

Automatic retry mechanism for failed API calls.

```typescript
import { retryOperation, withRetry, getRetryMessage } from '../utils/retry';

// Retry a single operation
try {
  const data = await retryOperation(
    () => bookingService.createBooking(data),
    {
      maxRetries: 2,
      initialDelay: 1000,
      onRetry: (attempt, error) => {
        console.log(getRetryMessage(attempt, 2));
      }
    }
  );
} catch (error) {
  // All retries failed
}

// Create a retry wrapper
const createBookingWithRetry = withRetry(
  (data) => bookingService.createBooking(data),
  { maxRetries: 2 }
);

const booking = await createBookingWithRetry(bookingData);
```

## Complete Integration Example

Here's a complete example of integrating error handling into a booking screen:

```typescript
import React, { useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useBookingErrorHandler } from '../hooks/useBookingErrorHandler';
import { ErrorDisplay, KYCVerificationModal, AvailabilityConflictAlert } from '../components';
import { showSuccess, showNetworkError } from '../utils/toast';
import { retryOperation } from '../utils/retry';
import bookingService from '../services/bookingService';

const BookingScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const {
    error,
    showKYCModal,
    kycStatus,
    showAvailabilityAlert,
    conflictingBookings,
    handleError,
    clearError,
    closeKYCModal,
    closeAvailabilityAlert,
  } = useBookingErrorHandler();

  const createBooking = async () => {
    setLoading(true);
    clearError();

    try {
      // Use retry mechanism for network resilience
      const booking = await retryOperation(
        () => bookingService.createBooking(bookingData),
        {
          maxRetries: 2,
          onRetry: (attempt) => {
            console.log(`Retry attempt ${attempt}`);
          }
        }
      );

      showSuccess('Booking created successfully!');
      navigation.navigate('BookingSuccess', { booking });
    } catch (err) {
      // Handle error with appropriate UI feedback
      handleError(err, () => createBooking());
    } finally {
      setLoading(false);
    }
  };

  const navigateToKYC = () => {
    navigation.navigate('KYCSubmission');
  };

  const handleModifyDates = () => {
    // Reset form or focus on date pickers
    console.log('Modify dates');
  };

  return (
    <View className="flex-1 p-4">
      {/* Error Display */}
      <ErrorDisplay 
        error={error}
        onRetry={createBooking}
        onDismiss={clearError}
      />

      {/* Booking Form */}
      {/* ... form fields ... */}

      {/* Submit Button */}
      <TouchableOpacity
        onPress={createBooking}
        disabled={loading}
        className="bg-blue-600 py-3 rounded-lg"
      >
        <Text className="text-white text-center font-semibold">
          {loading ? 'Creating Booking...' : 'Create Booking'}
        </Text>
      </TouchableOpacity>

      {/* KYC Modal */}
      <KYCVerificationModal
        visible={showKYCModal}
        onClose={closeKYCModal}
        onNavigateToKYC={navigateToKYC}
        kycStatus={kycStatus}
      />

      {/* Availability Alert */}
      <AvailabilityConflictAlert
        visible={showAvailabilityAlert}
        onClose={closeAvailabilityAlert}
        onModifyDates={handleModifyDates}
        conflictingBookings={conflictingBookings}
      />
    </View>
  );
};

export default BookingScreen;
```

## Error Types and Handling

### KYC Verification Errors
- **Error Message**: Contains "kyc"
- **UI Response**: Show KYCVerificationModal
- **User Action**: Navigate to KYC submission

### Availability Errors
- **Error Message**: Contains "available", "booked", or "conflict"
- **UI Response**: Show AvailabilityConflictAlert
- **User Action**: Modify dates or choose another vehicle

### Network Errors
- **Error Message**: Contains "network", "connection", or "timeout"
- **UI Response**: Show retry option
- **User Action**: Retry operation

### Validation Errors
- **Error Message**: Contains "invalid" or "validation"
- **UI Response**: Show inline error messages
- **User Action**: Fix form inputs

### Session Errors
- **Error Message**: Contains "session", "expired", or "unauthorized"
- **UI Response**: Show error toast
- **User Action**: Log in again

## Best Practices

1. **Always provide retry functionality** for network-related operations
2. **Use the error handler hook** for consistent error handling across screens
3. **Show specific modals** for KYC and availability errors
4. **Clear errors** when user takes action or navigates away
5. **Log errors** for debugging while showing user-friendly messages
6. **Use retry utility** for API calls that may fail due to network issues
7. **Provide clear action buttons** in error displays
8. **Test error scenarios** to ensure proper UI feedback

## Testing Error Scenarios

To test error handling:

1. **KYC Error**: Try booking without KYC verification
2. **Availability Error**: Try booking dates that conflict with existing bookings
3. **Network Error**: Disable network and attempt operations
4. **Validation Error**: Submit invalid form data
5. **Session Error**: Use expired token

Each scenario should show appropriate UI feedback and recovery options.
