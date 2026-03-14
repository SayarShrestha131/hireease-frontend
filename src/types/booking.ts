/**
 * Vehicle Booking System Type Definitions
 * 
 * This file contains TypeScript interfaces for booking-related data structures
 * that match the backend API response format and support the complete booking lifecycle.
 */

/**
 * Booking status enum representing the lifecycle of a booking
 * Flow: pending → confirmed → active → completed
 *       pending → cancelled
 */
export type BookingStatus = 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';

/**
 * Payment status enum representing the payment lifecycle
 * Flow: pending → completed
 *       pending → failed
 *       completed → refunded (on cancellation)
 */
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

/**
 * Payment method options available in the system
 */
export type PaymentMethod = 'eSewa' | 'Khalti' | 'Card' | 'Direct';

/**
 * Add-ons interface for optional rental enhancements
 * Each add-on has a daily rate that is multiplied by rental duration
 */
export interface AddOns {
  helmet?: boolean;  // Rs. 50/day
  gps?: boolean;     // Rs. 100/day
  insurance?: boolean; // Rs. 200/day
}

/**
 * Detailed price breakdown showing all cost components
 * All amounts are in Rupees (Rs.)
 */
export interface PriceBreakdown {
  basePrice: number;           // Vehicle price per day × duration
  duration: number;            // Number of rental days
  durationDiscount: number;    // Discount based on rental length (10%, 15%, or 20%)
  addOnsTotal: number;         // Sum of all selected add-on costs
  tax: number;                 // 13% VAT on subtotal
  serviceFee: number;          // 5% platform service fee
  totalPrice: number;          // Final amount to be paid
}

/**
 * Main Booking interface representing a complete booking record
 * Matches the backend Booking model structure
 */
export interface Booking {
  _id: string;
  bookingId: string;           // Unique identifier (BK-YYYYMMDD-XXXX)
  userId: string;              // Reference to User
  vehicleId: string;           // Reference to Vehicle
  
  // Booking Status
  status: BookingStatus;
  
  // Rental Period
  pickupDate: string;          // ISO date string
  pickupTime: string;          // HH:MM format
  dropoffDate: string;         // ISO date string
  dropoffTime: string;         // HH:MM format
  
  // Add-ons and Pricing
  addOns: AddOns;
  priceBreakdown: PriceBreakdown;
  
  // Payment Information
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paidAt?: string;             // ISO date string
  paymentId?: string;          // Payment gateway transaction ID
  
  // Cancellation Information
  cancelledAt?: string;        // ISO date string
  cancellationReason?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Populated vehicle details (when included by backend)
  vehicle?: {
    _id: string;
    name: string;
    brand: string;
    vehicleModel: string;
    type: string;
    images: string[];
    pricePerDay: number;
    specifications?: {
      engine?: string;
      power?: string;
      mileage?: string;
      color?: string;
    };
  };
}

/**
 * Form data interface for booking creation
 * Used when creating a new booking from the booking form
 */
export interface BookingFormData {
  vehicleId: string;
  pickupDate: Date;
  pickupTime: string;
  dropoffDate: Date;
  dropoffTime: string;
  addOns: AddOns;
}

/**
 * API Request Types
 */

/**
 * Request body for calculating booking price
 * POST /api/bookings/calculate-price
 */
export interface CalculatePriceRequest {
  vehicleId: string;
  pickupDate: string;          // ISO 8601 date string
  dropoffDate: string;         // ISO 8601 date string
  addOns: AddOns;
}

/**
 * Request body for creating a new booking
 * POST /api/bookings/create
 */
export interface CreateBookingRequest {
  vehicleId: string;
  pickupDate: string;          // ISO 8601 date string
  pickupTime: string;          // HH:MM format
  dropoffDate: string;         // ISO 8601 date string
  dropoffTime: string;         // HH:MM format
  addOns: AddOns;
}

/**
 * Request body for confirming payment
 * POST /api/bookings/:id/confirm-payment
 */
export interface ConfirmPaymentRequest {
  paymentMethod: PaymentMethod;
  paymentId?: string;          // Optional payment gateway transaction ID
}

/**
 * API Response Types
 */

/**
 * Response from calculate price endpoint
 * POST /api/bookings/calculate-price
 */
export interface CalculatePriceResponse {
  success: boolean;
  data: {
    priceBreakdown: PriceBreakdown;
  };
}

/**
 * Response from create booking endpoint
 * POST /api/bookings/create
 */
export interface CreateBookingResponse {
  success: boolean;
  message: string;
  data: {
    booking: Booking;
  };
}

/**
 * Response from confirm payment endpoint
 * POST /api/bookings/:id/confirm-payment
 */
export interface ConfirmPaymentResponse {
  success: boolean;
  message: string;
  data: {
    booking: Booking;
  };
}

/**
 * Response from get user bookings endpoint
 * GET /api/bookings/my-bookings
 */
export interface GetUserBookingsResponse {
  success: boolean;
  data: {
    bookings: Booking[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

/**
 * Response from get booking details endpoint
 * GET /api/bookings/:id
 */
export interface GetBookingDetailsResponse {
  success: boolean;
  data: {
    booking: Booking;
  };
}

/**
 * Response from cancel booking endpoint
 * PUT /api/bookings/:id/cancel
 */
export interface CancelBookingResponse {
  success: boolean;
  message: string;
  data: {
    booking: Booking;
  };
}

/**
 * Filters interface for booking list
 * Used to filter bookings by status and pagination
 */
export interface BookingFilters {
  status?: 'all' | BookingStatus;
  page?: number;
  limit?: number;
}

/**
 * Error response types for booking operations
 */

/**
 * KYC verification error response
 * Returned when user hasn't completed KYC verification
 */
export interface KYCVerificationError {
  success: false;
  error: string;
  kycStatus: 'not_submitted' | 'pending' | 'rejected';
}

/**
 * Availability conflict error response
 * Returned when vehicle is not available for selected dates
 */
export interface AvailabilityError {
  success: false;
  error: string;
  conflictingBookings?: Booking[];
}

/**
 * Generic booking error response
 */
export interface BookingErrorResponse {
  success: false;
  error: string;
  details?: {
    field: string;
    message: string;
  }[];
}

/**
 * Form validation errors interface
 */
export interface BookingFormErrors {
  pickupDate?: string;
  pickupTime?: string;
  dropoffDate?: string;
  dropoffTime?: string;
  dateRange?: string;
  addOns?: string;
  general?: string;
}

/**
 * Booking summary interface for display purposes
 * Used in confirmation and success screens
 */
export interface BookingSummary {
  bookingId: string;
  vehicleName: string;
  vehicleImage: string;
  pickupDate: string;
  pickupTime: string;
  dropoffDate: string;
  dropoffTime: string;
  duration: number;
  selectedAddOns: string[];    // Array of add-on names
  totalPrice: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
}
