/**
 * Authentication Type Definitions
 * 
 * This file contains TypeScript interfaces for authentication-related data structures
 * that match the backend API response format.
 */

/**
 * User interface representing the authenticated user data
 * Matches the backend User model structure (password excluded)
 */
export interface User {
  _id: string;
  email: string;
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
}
