/**
 * Validation utility functions for form inputs
 */

/**
 * Validates email format using regex pattern
 * @param email - The email address to validate
 * @returns true if email format is valid, false otherwise
 */
export const validateEmail = (email: string): boolean => {
  if (!email || email.trim() === '') {
    return false;
  }

  // RFC 5322 compliant email regex pattern (simplified version)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validates password meets minimum length requirement
 * @param password - The password to validate
 * @returns true if password is at least 6 characters long, false otherwise
 */
export const validatePassword = (password: string): boolean => {
  if (!password) {
    return false;
  }

  return password.length >= 6;
};
