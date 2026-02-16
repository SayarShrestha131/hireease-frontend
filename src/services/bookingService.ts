/**
 * Booking Service
 * 
 * This module provides methods for interacting with the vehicle booking API endpoints.
 * Handles booking creation, price calculation, payment confirmation, and booking management.
 */

import apiClient from './apiClient';
import {
  CalculatePriceRequest,
  CalculatePriceResponse,
  CreateBookingRequest,
  CreateBookingResponse,
  ConfirmPaymentRequest,
  ConfirmPaymentResponse,
  GetUserBookingsResponse,
  GetBookingDetailsResponse,
  CancelBookingResponse,
  BookingFilters,
  Booking,
  PriceBreakdown,
} from '../types/booking';
import { logBookingOperation, logKYCCheck } from '../utils/logger';
import { getErrorMessage } from '../utils/errorHandler';

/**
 * Booking Service Class
 * Provides methods for booking operations including price calculation, creation, and management
 */
class BookingService {
  /**
   * Calculate rental price with discounts and add-ons
   * 
   * @param data - Price calculation request data
   * @returns Promise resolving to detailed price breakdown
   * @throws Error with user-friendly message on failure
   */
  async calculatePrice(data: CalculatePriceRequest): Promise<PriceBreakdown> {
    try {
      logBookingOperation('Calculate Price', undefined, {
        vehicleId: data.vehicleId,
        pickupDate: data.pickupDate,
        dropoffDate: data.dropoffDate,
      });
      
      const response = await apiClient.post<CalculatePriceResponse>(
        '/bookings/calculate-price',
        data
      );
      
      logBookingOperation('Price Calculated', undefined, {
        totalPrice: response.data.data.priceBreakdown.totalPrice,
      });
      
      return response.data.data.priceBreakdown;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Create a new booking for a vehicle
   * 
   * @param data - Booking creation request data
   * @returns Promise resolving to the created booking
   * @throws Error with user-friendly message on failure
   */
  async createBooking(data: CreateBookingRequest): Promise<Booking> {
    try {
      logBookingOperation('Create Booking', undefined, {
        vehicleId: data.vehicleId,
        pickupDate: data.pickupDate,
        dropoffDate: data.dropoffDate,
      });
      
      const response = await apiClient.post<CreateBookingResponse>(
        '/bookings/create',
        data
      );
      
      const booking = response.data.data.booking;
      logBookingOperation('Booking Created', booking.bookingId, {
        status: booking.status,
        totalPrice: booking.priceBreakdown.totalPrice,
      });
      
      return booking;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Confirm payment for a pending booking
   * 
   * @param bookingId - ID of the booking to confirm payment for
   * @param data - Payment confirmation request data
   * @returns Promise resolving to the updated booking
   * @throws Error with user-friendly message on failure
   */
  async confirmPayment(bookingId: string, data: ConfirmPaymentRequest): Promise<Booking> {
    try {
      logBookingOperation('Confirm Payment', bookingId, {
        paymentMethod: data.paymentMethod,
      });
      
      const response = await apiClient.post<ConfirmPaymentResponse>(
        `/bookings/${bookingId}/confirm-payment`,
        data
      );
      
      logBookingOperation('Payment Confirmed', bookingId, {
        status: response.data.data.booking.status,
        paymentStatus: response.data.data.booking.paymentStatus,
      });
      
      return response.data.data.booking;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get current user's bookings with optional filtering
   * 
   * @param filters - Optional filters for status and pagination
   * @returns Promise resolving to paginated bookings list
   * @throws Error with user-friendly message on failure
   */
  async getUserBookings(filters: BookingFilters = {}): Promise<GetUserBookingsResponse['data']> {
    try {
      logBookingOperation('Get User Bookings', undefined, filters);
      
      // Build query parameters
      const params = new URLSearchParams();
      
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      
      if (filters.page) {
        params.append('page', filters.page.toString());
      }
      
      if (filters.limit) {
        params.append('limit', filters.limit.toString());
      }
      
      const queryString = params.toString();
      const url = `/bookings/my-bookings${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get<GetUserBookingsResponse>(url);
      
      logBookingOperation('User Bookings Retrieved', undefined, {
        count: response.data.data.bookings.length,
        total: response.data.data.pagination.total,
      });
      
      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get specific booking details by ID
   * 
   * @param bookingId - Booking ID to retrieve
   * @returns Promise resolving to the booking details with populated vehicle info
   * @throws Error with user-friendly message on failure
   */
  async getBookingById(bookingId: string): Promise<Booking> {
    try {
      logBookingOperation('Get Booking Details', bookingId);
      
      const response = await apiClient.get<GetBookingDetailsResponse>(
        `/bookings/${bookingId}`
      );
      
      logBookingOperation('Booking Details Retrieved', bookingId, {
        status: response.data.data.booking.status,
      });
      
      return response.data.data.booking;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Cancel a booking
   * 
   * @param bookingId - ID of the booking to cancel
   * @returns Promise resolving to the updated booking
   * @throws Error with user-friendly message on failure
   */
  async cancelBooking(bookingId: string): Promise<Booking> {
    try {
      logBookingOperation('Cancel Booking', bookingId);
      
      const response = await apiClient.put<CancelBookingResponse>(
        `/bookings/${bookingId}/cancel`
      );
      
      logBookingOperation('Booking Cancelled', bookingId, {
        status: response.data.data.booking.status,
        paymentStatus: response.data.data.booking.paymentStatus,
      });
      
      return response.data.data.booking;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Check vehicle availability for given dates (client-side pre-check)
   * This performs a lightweight check before the full booking creation
   * 
   * @param vehicleId - ID of the vehicle to check
   * @param pickupDate - Pickup date in ISO format
   * @param dropoffDate - Dropoff date in ISO format
   * @returns Promise resolving to availability status
   * @throws Error with user-friendly message on failure
   */
  async checkAvailability(
    vehicleId: string,
    pickupDate: string,
    dropoffDate: string
  ): Promise<{ available: boolean; message?: string }> {
    try {
      logBookingOperation('Check Availability', undefined, {
        vehicleId,
        pickupDate,
        dropoffDate,
      });
      
      // Use the calculate price endpoint as a pre-check
      // If it succeeds, the vehicle is available for those dates
      await this.calculatePrice({
        vehicleId,
        pickupDate,
        dropoffDate,
        addOns: {}, // No add-ons needed for availability check
      });
      
      return { available: true };
    } catch (error) {
      // Check if error is related to availability
      const errorMessage = getErrorMessage(error);
      if (errorMessage.toLowerCase().includes('available') || 
          errorMessage.toLowerCase().includes('booked')) {
        return { 
          available: false, 
          message: 'Vehicle is not available for the selected dates' 
        };
      }
      
      // For other errors, we can't determine availability
      // Return true to allow the user to proceed (backend will validate)
      return { available: true };
    }
  }

  /**
   * Remove the old handleError method as we're using the centralized error handler
   */
}

// Export singleton instance
export default new BookingService();
