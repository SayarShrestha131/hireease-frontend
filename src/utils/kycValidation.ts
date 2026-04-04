import { KYCFormData, KYCFormErrors } from '../types/kyc';

// Nepal license number: typically alphanumeric, 5-20 chars
const LICENSE_NUMBER_REGEX = /^[A-Za-z0-9\-]{5,20}$/;
// Nepal citizenship number: digits with optional dashes
const CITIZENSHIP_NUMBER_REGEX = /^[0-9\-]{5,20}$/;
// Phone: 10 digits, optionally starting with +977
const PHONE_REGEX = /^(\+977)?[0-9]{10}$/;
// Date: YYYY-MM-DD
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function validateKYCForm(data: Partial<KYCFormData>): KYCFormErrors {
  const errors: KYCFormErrors = {};

  // License number
  if (!data.licenseNumber?.trim()) {
    errors.licenseNumber = 'License number is required';
  } else if (!LICENSE_NUMBER_REGEX.test(data.licenseNumber.trim())) {
    errors.licenseNumber = 'License number must be 5-20 alphanumeric characters';
  }

  // Full name
  if (!data.fullName?.trim()) {
    errors.fullName = 'Full name is required';
  } else if (data.fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters';
  }

  // Date of birth
  if (!data.dateOfBirth) {
    errors.dateOfBirth = 'Date of birth is required';
  } else {
    const dob = data.dateOfBirth instanceof Date ? data.dateOfBirth : new Date(data.dateOfBirth as any);
    if (isNaN(dob.getTime())) {
      errors.dateOfBirth = 'Invalid date of birth';
    } else if (dob >= new Date()) {
      errors.dateOfBirth = 'Date of birth must be in the past';
    }
  }

  // License expiry date
  if (!data.licenseExpiryDate) {
    errors.licenseExpiryDate = 'License expiry date is required';
  } else {
    const expiry = data.licenseExpiryDate instanceof Date
      ? data.licenseExpiryDate
      : new Date(data.licenseExpiryDate as any);
    if (isNaN(expiry.getTime())) {
      errors.licenseExpiryDate = 'Invalid expiry date';
    } else if (expiry <= new Date()) {
      errors.licenseExpiryDate = 'License has expired. Please provide a valid license.';
    }
  }

  // Contact number
  if (!data.contactNumber?.trim()) {
    errors.contactNumber = 'Contact number is required';
  } else if (!PHONE_REGEX.test(data.contactNumber.replace(/\s/g, ''))) {
    errors.contactNumber = 'Enter a valid 10-digit phone number';
  }

  // Address
  if (!data.address?.trim()) {
    errors.address = 'Address is required';
  }

  // Issued by
  if (!data.issuedBy?.trim()) {
    errors.issuedBy = 'Issuing authority is required';
  }

  // License office
  if (!data.licenseOffice?.trim()) {
    errors.licenseOffice = 'License office is required';
  }

  // Front image
  if (!data.licenseFrontImage) {
    errors.licenseFrontImage = 'License front image is required';
  }

  // Selfie image
  if (!data.selfieImage) {
    errors.selfieImage = 'Selfie image is required';
  }

  return errors;
}

export function hasValidationErrors(errors: KYCFormErrors): boolean {
  return Object.values(errors).some(v => !!v);
}

export function formatDateForDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
