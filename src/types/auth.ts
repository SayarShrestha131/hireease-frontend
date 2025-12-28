/**
 * Authentication Type Definitions
 * 
 * This file contains TypeScript interfaces for authentication-related data structures
 * that match the backend API response format.
 */

/**
 * Contact Information interface
 */
export interface ContactInfo {
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
}

/**
 * Emergency Contact interface
 */
export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

/**
 * Notification Preferences interface
 */
export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  bookingUpdates: boolean;
  promotions: boolean;
  reminders: boolean;
}

/**
 * Document interface
 */
export interface UserDocument {
  type: string;
  url: string;
  uploadedAt: string;
  verified: boolean;
}

/**
 * Booking interface
 */
export interface Booking {
  _id: string;
  vehicleId: string;
  vehicleName: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  pickupLocation: string;
  dropoffLocation: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * User interface representing the authenticated user data
 * Matches the backend User model structure (password excluded)
 */
export interface User {
  _id: string;
  email: string;
  role: 'user' | 'admin';
  username?: string;
  dateOfBirth?: string;
  contactInfo?: ContactInfo;
  emergencyContacts?: EmergencyContact[];
  notificationPreferences?: NotificationPreferences;
  documents?: UserDocument[];
  isEmailVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Successful authentication response from the backend API
 * Returned by both /api/auth/register and /api/auth/login endpoints
 */
export interface AuthResponse {
  success: true;
  data: {
    user: User;
    token: string;
  };
}

/**
 * Validation error detail for a specific field
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Error response from the backend API
 * Returned when authentication or validation fails
 */
export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    statusCode: number;
    errors?: ValidationError[];
  };
}

/**
 * Authentication Context Type
 * Defines the shape of the authentication context provided to components
 */
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}
