/**
 * KYC Verification System Types
 * 
 * Type definitions for KYC submission, status tracking, and admin review functionality
 */

/**
 * KYC submission status enum
 */
export type KYCStatus = 'pending' | 'approved' | 'rejected';

/**
 * OCR extracted data from license images
 */
export interface OCRData {
  frontImage: {
    licenseNumber?: string;
    fullName?: string;
    dateOfBirth?: string;
    expiryDate?: string;
    address?: string;
    rawText: string;
    confidence: number;
  };
  backImage: {
    address?: string;
    additionalInfo?: string;
    rawText: string;
    confidence: number;
  };
  extractedAt: string;
}

/**
 * Face detection result from selfie validation
 */
export interface FaceDetection {
  hasFace: boolean;
  faceCount?: number;
  confidence: number;
  isRealFace?: boolean;
  message: string;
  verifiedAt: string;
}

/**
 * Main KYC submission interface representing a complete KYC record
 */
export interface KYCSubmission {
  _id: string;
  userId: string;
  status: KYCStatus;
  
  // License Information
  licenseNumber: string;
  fullName: string;
  dateOfBirth: string; // ISO date string
  licenseExpiryDate: string; // ISO date string
  
  // Document Images (filenames)
  licenseFrontImage: string;
  licenseBackImage?: string; // Now optional
  selfieImage: string; // Now required
  
  // OCR Extracted Data
  ocrData?: OCRData;
  
  // Face Detection Result
  faceDetection?: FaceDetection;
  
  // Virtual image URLs (added by backend)
  licenseFrontImageUrl?: string;
  licenseBackImageUrl?: string;
  
  // Review Information
  reviewedBy?: string; // Admin user ID
  reviewedAt?: string; // ISO date string
  reviewNote?: string; // Approval note or rejection reason
  
  // Submission History
  submittedAt: string; // ISO date string
  previousSubmissionId?: string; // Link to previous rejected submission
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Populated user details (when included by backend)
  user?: {
    _id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  };
  
  // Previous submission details (when included by backend)
  previousSubmission?: KYCSubmission;
}

/**
 * Form data interface for KYC submission
 * Used when creating a new KYC application
 */
export interface KYCFormData {
  licenseNumber: string;
  fullName: string;
  dateOfBirth: Date;
  licenseExpiryDate: Date;
  licenseFrontImage: {
    uri: string;
    type: string;
    name: string;
  } | null;
  licenseBackImage?: {
    uri: string;
    type: string;
    name: string;
  } | null; // Now optional
  selfieImage: {
    uri: string;
    type: string;
    name: string;
  } | null; // Now required
  previousSubmissionId?: string; // For resubmissions
}

/**
 * Filters interface for admin KYC submission list
 * Used to filter and search submissions in the admin panel
 */
export interface KYCFilters {
  status?: 'all' | 'pending' | 'approved' | 'rejected';
  search?: string; // Search by name or license number
  page?: number;
  limit?: number;
}

/**
 * Paginated response interface for admin KYC submission list
 * Returned by the admin submissions endpoint
 */
export interface PaginatedKYCResponse {
  submissions: KYCSubmission[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  pendingCount: number;
}

/**
 * KYC submission response after successful submission
 */
export interface KYCSubmissionResponse {
  success: boolean;
  message: string;
  submission: KYCSubmission;
}

/**
 * Admin action request interfaces
 */
export interface ApproveKYCRequest {
  note?: string; // Optional approval note
}

export interface RejectKYCRequest {
  reason: string; // Required rejection reason (min 10 characters)
}

/**
 * Admin action response interface
 */
export interface KYCActionResponse {
  success: boolean;
  message: string;
  submission: KYCSubmission;
}

/**
 * Form validation errors interface
 */
export interface KYCFormErrors {
  licenseNumber?: string;
  fullName?: string;
  dateOfBirth?: string;
  licenseExpiryDate?: string;
  licenseFrontImage?: string;
  licenseBackImage?: string;
  selfieImage?: string; // Added selfie validation
  general?: string;
}
