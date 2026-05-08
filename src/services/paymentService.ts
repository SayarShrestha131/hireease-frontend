/**
 * Payment Service
 * 
 * Handles all payment-related API calls for Khalti, Stripe, and PayPal integrations.
 */

import axios from 'axios';
import { getCurrentApiUrl } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
  PaymentHistoryFilters,
  PaymentHistoryResponse,
  GatewayHealthResponse,
  ReceiptResponse,
  RefundRequest,
  RefundResponse,
} from '../types/payment';

// Use the same token key as apiClient
const TOKEN_KEY = 'auth_token';

/**
 * Get authentication token from storage
 */
const getAuthToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    console.log('🔑 [PaymentService] Retrieved token from storage:', token ? 'EXISTS' : 'NULL');
    return token;
  } catch (error) {
    console.error('❌ [PaymentService] Error getting auth token:', error);
    return null;
  }
};

/**
 * Create axios instance with auth headers
 */
const createAuthenticatedRequest = async () => {
  const token = await getAuthToken();
  const baseURL = getCurrentApiUrl();
  
  console.log('🔐 [PaymentService] Creating authenticated request');
  console.log('📍 [PaymentService] Base URL:', baseURL);
  console.log('🎫 [PaymentService] Token present:', token ? 'YES' : 'NO');
  
  if (!token) {
    console.error('❌ [PaymentService] No auth token found!');
  }
  
  return axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    timeout: 15000,
  });
};

/**
 * Initiate payment for a booking
 */
const initiatePayment = async (
  request: InitiatePaymentRequest
): Promise<InitiatePaymentResponse> => {
  try {
    const api = await createAuthenticatedRequest();
    
    console.log('🔐 [PaymentService] Initiating payment with auth');
    console.log('📋 [PaymentService] Request:', JSON.stringify(request, null, 2));
    
    const response = await api.post<InitiatePaymentResponse>(
      '/payments/initiate',
      request
    );
    
    console.log('✅ [PaymentService] Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error: any) {
    console.error('❌ [PaymentService] Error initiating payment:', error);
    console.error('❌ [PaymentService] Error response:', error.response?.data);
    console.error('❌ [PaymentService] Error status:', error.response?.status);
    throw error;
  }
};

/**
 * Verify payment completion
 */
const verifyPayment = async (
  request: VerifyPaymentRequest
): Promise<VerifyPaymentResponse> => {
  const api = await createAuthenticatedRequest();
  const response = await api.post<VerifyPaymentResponse>(
    '/payments/verify',
    request
  );
  return response.data;
};

/**
 * Get payment history for authenticated user
 */
const getPaymentHistory = async (
  filters: PaymentHistoryFilters = {}
): Promise<PaymentHistoryResponse> => {
  const api = await createAuthenticatedRequest();
  const response = await api.get<PaymentHistoryResponse>('/payments/history', {
    params: filters,
  });
  return response.data;
};

/**
 * Get gateway health status
 */
const getGatewayHealth = async (): Promise<GatewayHealthResponse> => {
  const baseURL = getCurrentApiUrl();
  const response = await axios.get<GatewayHealthResponse>(
    `${baseURL}/payments/health`,
    { timeout: 5000 }
  );
  return response.data;
};

/**
 * Get payment health including mode (sandbox/production)
 */
const getPaymentHealth = async (): Promise<{ mode: string; gateways: any }> => {
  const baseURL = getCurrentApiUrl();
  const response = await axios.get(
    `${baseURL}/payments/health`,
    { timeout: 5000 }
  );
  return response.data.data;
};

/**
 * Get receipt for a booking
 */
const getReceipt = async (bookingId: string): Promise<ReceiptResponse> => {
  const api = await createAuthenticatedRequest();
  const response = await api.get<ReceiptResponse>(
    `/payments/receipt/${bookingId}`
  );
  return response.data;
};

/**
 * Request refund for a booking
 */
const requestRefund = async (request: RefundRequest): Promise<RefundResponse> => {
  const api = await createAuthenticatedRequest();
  const response = await api.post<RefundResponse>('/payments/refund', request);
  return response.data;
};

/**
 * Poll payment status
 */
const pollPaymentStatus = async (
  transactionId: string
): Promise<{ status: string; bookingId?: string; receiptUrl?: string }> => {
  const api = await createAuthenticatedRequest();
  const response = await api.get(`/payments/status/${transactionId}`);
  return response.data.data;
};

export default {
  initiatePayment,
  verifyPayment,
  getPaymentHistory,
  getGatewayHealth,
  getPaymentHealth,
  getReceipt,
  requestRefund,
  pollPaymentStatus,
};
