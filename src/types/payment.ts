/**
 * Payment System Type Definitions
 * 
 * This file contains TypeScript interfaces for payment-related data structures
 * that match the backend payment gateway integration API.
 */

/**
 * Payment method options available in the system
 */
export type PaymentMethod = 'esewa';

/**
 * Payment gateway status
 */
export type GatewayStatus = 'available' | 'unavailable' | 'disabled';

/**
 * Payment transaction status
 */
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

/**
 * Payment transaction type
 */
export type TransactionType = 'payment' | 'refund';

/**
 * Payment initiation request
 */
export interface InitiatePaymentRequest {
  bookingId: string;
  paymentMethod: PaymentMethod;
  returnUrl: string;
}

/**
 * Payment initiation response
 */
export interface InitiatePaymentResponse {
  success: boolean;
  data: {
    transactionId: string;
    paymentUrl?: string;      // For Khalti and PayPal redirect
    clientSecret?: string;    // For Stripe client-side confirmation
    expiresAt: string;
  };
}

/**
 * Payment verification request
 */
export interface VerifyPaymentRequest {
  transactionId: string;
  gatewayData: Record<string, any>;
}

/**
 * Payment verification response
 */
export interface VerifyPaymentResponse {
  success: boolean;
  data: {
    paymentStatus: PaymentStatus;
    bookingId: string;
    receiptUrl?: string;
  };
}

/**
 * Payment transaction record
 */
export interface PaymentTransaction {
  _id: string;
  bookingId: string;
  userId: string;
  transactionId: string;
  transactionType: TransactionType;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  gateway: PaymentMethod;
  status: PaymentStatus;
  gatewayTransactionId?: string;
  receiptNumber?: string;
  receiptPath?: string;
  errorCode?: string;
  errorMessage?: string;
  initiatedAt: string;
  completedAt?: string;
  failedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payment history filters
 */
export interface PaymentHistoryFilters {
  page?: number;
  limit?: number;
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  startDate?: string;
  endDate?: string;
}

/**
 * Payment history response
 */
export interface PaymentHistoryResponse {
  success: boolean;
  data: {
    transactions: PaymentTransaction[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
    summary: {
      totalPaid: number;
      totalRefunded: number;
    };
  };
}

/**
 * Gateway health check response
 */
export interface GatewayHealthResponse {
  success: boolean;
  data: {
    khalti: GatewayStatus;
    stripe: GatewayStatus;
    paypal: GatewayStatus;
    mode: 'sandbox' | 'production';
  };
}

/**
 * Receipt response
 */
export interface ReceiptResponse {
  success: boolean;
  data: {
    receiptUrl: string;
    receiptNumber: string;
  };
}

/**
 * Refund request
 */
export interface RefundRequest {
  bookingId: string;
  reason: string;
  amount?: number;
}

/**
 * Refund response
 */
export interface RefundResponse {
  success: boolean;
  data: {
    refundId: string;
    refundStatus: 'processing' | 'completed' | 'failed';
    refundAmount: number;
  };
}

/**
 * Payment error response
 */
export interface PaymentErrorResponse {
  success: false;
  error: string;
  details?: {
    field: string;
    message: string;
  }[];
}
