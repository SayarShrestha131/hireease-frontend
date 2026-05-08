# Payment Gateway Integration - Frontend Documentation

## Overview

This document describes the frontend implementation of the payment gateway integration for Khalti, Stripe, and PayPal payment methods.

## Components

### 1. PaymentMethodSelector

**Location:** `src/components/PaymentMethodSelector.tsx`

**Purpose:** Displays available payment methods with icons and handles selection.

**Features:**
- Fetches gateway health status from backend
- Displays Khalti, Stripe, and PayPal options
- Disables unavailable gateways
- Shows loading state while fetching gateway status

**Usage:**
```tsx
import { PaymentMethodSelector } from '../components';

<PaymentMethodSelector
  selectedMethod={selectedMethod}
  onSelectMethod={setSelectedMethod}
  disabled={false}
/>
```

**Requirements:** 10.7, 18.2

---

### 2. KhaltiPaymentScreen

**Location:** `src/screens/KhaltiPaymentScreen.tsx`

**Purpose:** Handles Khalti payment flow with redirect and verification.

**Features:**
- Initiates Khalti payment request
- Redirects to Khalti payment URL
- Listens for deep link return
- Verifies payment with backend
- Displays payment status

**Usage:**
```tsx
import KhaltiPaymentScreen from '../screens/KhaltiPaymentScreen';

<KhaltiPaymentScreen
  route={{ params: { booking } }}
  onPaymentSuccess={(bookingId, receiptUrl) => {}}
  onPaymentFailed={(error) => {}}
  onCancel={() => {}}
/>
```

**Requirements:** 1.2, 1.4, 1.6, 1.7

---

### 3. StripePaymentScreen

**Location:** `src/screens/StripePaymentScreen.tsx`

**Purpose:** Handles Stripe card payment flow.

**Features:**
- Creates Stripe Payment Intent
- Receives client secret for payment confirmation
- Supports 3D Secure authentication (in production with Stripe SDK)
- Verifies payment completion

**Note:** This is a minimal implementation. For production, integrate `@stripe/stripe-react-native` for native card input and 3D Secure support.

**Usage:**
```tsx
import StripePaymentScreen from '../screens/StripePaymentScreen';

<StripePaymentScreen
  route={{ params: { booking } }}
  onPaymentSuccess={(bookingId, receiptUrl) => {}}
  onPaymentFailed={(error) => {}}
  onCancel={() => {}}
/>
```

**Requirements:** 2.2, 2.4, 2.8

---

### 4. PayPalPaymentScreen

**Location:** `src/screens/PayPalPaymentScreen.tsx`

**Purpose:** Handles PayPal payment flow with redirect and capture.

**Features:**
- Creates PayPal order
- Redirects to PayPal approval URL
- Listens for deep link return
- Captures order and verifies payment
- Displays payment status

**Usage:**
```tsx
import PayPalPaymentScreen from '../screens/PayPalPaymentScreen';

<PayPalPaymentScreen
  route={{ params: { booking } }}
  onPaymentSuccess={(bookingId, receiptUrl) => {}}
  onPaymentFailed={(error) => {}}
  onCancel={() => {}}
/>
```

**Requirements:** 3.2, 3.3, 3.4, 3.5

---

### 5. PaymentStatusScreen

**Location:** `src/screens/PaymentStatusScreen.tsx`

**Purpose:** Polls payment status and displays result.

**Features:**
- Polls payment status every 3 seconds
- Shows loading state during processing
- Displays success with receipt download
- Shows failure with retry option
- Timeout after 60 seconds

**Usage:**
```tsx
import PaymentStatusScreen from '../screens/PaymentStatusScreen';

<PaymentStatusScreen
  route={{ params: { transactionId, bookingId } }}
  onSuccess={(bookingId) => {}}
  onRetry={() => {}}
  onCancel={() => {}}
/>
```

**Requirements:** 5.3, 5.4, 5.5, 16.5

---

### 6. PaymentHistoryScreen

**Location:** `src/screens/PaymentHistoryScreen.tsx`

**Purpose:** Displays user's payment transaction history.

**Features:**
- Lists all payment transactions
- Filters by status and payment method
- Pagination (20 records per page)
- Summary statistics (total paid, total refunded)
- Receipt download for completed payments
- Pull-to-refresh

**Usage:**
```tsx
import PaymentHistoryScreen from '../screens/PaymentHistoryScreen';

<PaymentHistoryScreen onBack={() => navigation.goBack()} />
```

**Requirements:** 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7

---

### 7. PaymentErrorHandler

**Location:** `src/components/PaymentErrorHandler.tsx`

**Purpose:** Displays user-friendly payment error messages.

**Features:**
- Maps error codes to friendly messages
- Shows retry button for retryable errors
- Suggests alternative payment methods for gateway errors
- Displays support contact information
- Customizable action buttons

**Usage:**
```tsx
import { PaymentErrorHandler } from '../components';

<PaymentErrorHandler
  error="Payment failed"
  errorCode="INSUFFICIENT_FUNDS"
  currentPaymentMethod="khalti"
  onRetry={handleRetry}
  onChangePaymentMethod={handleChangeMethod}
  onContactSupport={handleContactSupport}
  onDismiss={handleDismiss}
/>
```

**Requirements:** 11.1, 11.2, 11.3, 11.4, 11.6, 18.2

---

## Services

### PaymentService

**Location:** `src/services/paymentService.ts`

**Purpose:** Handles all payment-related API calls.

**Methods:**
- `initiatePayment(request)` - Initiates payment for a booking
- `verifyPayment(request)` - Verifies payment completion
- `getPaymentHistory(filters)` - Retrieves payment history
- `getGatewayHealth()` - Checks gateway availability
- `getReceipt(bookingId)` - Downloads receipt
- `requestRefund(request)` - Requests refund
- `pollPaymentStatus(transactionId)` - Polls payment status

---

## Types

### Payment Types

**Location:** `src/types/payment.ts`

**Interfaces:**
- `PaymentMethod` - 'khalti' | 'stripe' | 'paypal'
- `PaymentStatus` - 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
- `PaymentTransaction` - Complete transaction record
- `InitiatePaymentRequest` - Payment initiation request
- `InitiatePaymentResponse` - Payment initiation response
- `VerifyPaymentRequest` - Payment verification request
- `VerifyPaymentResponse` - Payment verification response
- `PaymentHistoryFilters` - History filtering options
- `PaymentHistoryResponse` - History response with pagination
- `GatewayHealthResponse` - Gateway status response

---

## Integration Flow

### Complete Payment Flow

```
1. BookingConfirmationScreen
   ↓ (user confirms booking)
   
2. PaymentSelectionScreen (PaymentIntegrationExample)
   ↓ (user selects payment method)
   
3. Gateway-Specific Screen
   - KhaltiPaymentScreen (for Khalti)
   - StripePaymentScreen (for Stripe)
   - PayPalPaymentScreen (for PayPal)
   ↓ (payment processing)
   
4. PaymentStatusScreen (optional polling)
   ↓ (payment completed)
   
5. BookingSuccessScreen
   - Show booking confirmation
   - Provide receipt download
```

### Error Handling Flow

```
Payment Error
   ↓
PaymentErrorHandler Component
   ↓
User Actions:
   - Retry Payment (same method)
   - Change Payment Method
   - Contact Support
   - Dismiss
```

---

## Deep Linking Setup

For Khalti and PayPal redirect flows, configure deep linking in `app.json`:

```json
{
  "expo": {
    "scheme": "hireease",
    "ios": {
      "bundleIdentifier": "com.hireease.app"
    },
    "android": {
      "package": "com.hireease.app"
    }
  }
}
```

**Return URLs:**
- Khalti: `hireease://payment/khalti/return`
- PayPal: `hireease://payment/paypal/return`

---

## Production Considerations

### Stripe Integration

For production, replace the minimal Stripe implementation with `@stripe/stripe-react-native`:

```bash
npm install @stripe/stripe-react-native
```

Then integrate Stripe Elements for secure card input and native 3D Secure support.

### Security

- Never log sensitive payment data
- Use HTTPS for all API calls
- Validate all payment responses
- Implement proper error handling
- Use secure storage for tokens

### Testing

- Test all payment methods in sandbox mode
- Test error scenarios (declined cards, network errors)
- Test deep linking on both iOS and Android
- Test payment status polling timeout
- Test receipt download functionality

---

## Error Codes

Common error codes returned by the backend:

- `INSUFFICIENT_FUNDS` - Insufficient balance
- `INVALID_CARD` - Invalid card details
- `CARD_DECLINED` - Card declined by bank
- `EXPIRED_CARD` - Card has expired
- `NETWORK_ERROR` - Connection issue
- `TIMEOUT` - Request timeout
- `GATEWAY_ERROR` - Gateway error
- `GATEWAY_UNAVAILABLE` - Gateway unavailable
- `PAYMENT_ALREADY_PROCESSED` - Duplicate payment
- `INVALID_AMOUNT` - Amount validation failed
- `AUTHENTICATION_FAILED` - Payment authentication failed
- `RATE_LIMIT_EXCEEDED` - Too many attempts

---

## Support

For issues or questions:
- Email: support@hireease.com
- Phone: +977-1-234567

---

## Files Created

1. `src/types/payment.ts` - Payment type definitions
2. `src/services/paymentService.ts` - Payment API service
3. `src/components/PaymentMethodSelector.tsx` - Payment method selector
4. `src/components/PaymentErrorHandler.tsx` - Error handling component
5. `src/screens/KhaltiPaymentScreen.tsx` - Khalti payment screen
6. `src/screens/StripePaymentScreen.tsx` - Stripe payment screen
7. `src/screens/PayPalPaymentScreen.tsx` - PayPal payment screen
8. `src/screens/PaymentStatusScreen.tsx` - Payment status screen
9. `src/screens/PaymentHistoryScreen.tsx` - Payment history screen
10. `src/screens/PaymentIntegrationExample.tsx` - Integration example
11. `src/docs/PAYMENT_INTEGRATION.md` - This documentation
