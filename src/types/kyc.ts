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
 * KYC eligibility check response
 */
export interface KYCEligibility {
  hasProfilePicture: boolean;
  hasPendingSubmission: boolean;
}

/**
 * Face detection result from image processing
 * Alias for FaceDetection interface for backward compatibility
 */
export type FaceDetectionResult = FaceDetection;

/**
 * OCR field confidence scores (0-100 range)
 */
export interface OCRFieldConfidence {
  licenseNumber?: number;
  fullName?: number;
  fatherName?: number;
  dateOfBirth?: number;
  expiryDate?: number;
  issueDate?: number;
  issuingAuthority?: number;
  address?: number;
  citizenshipNumber?: number;
  licenseType?: number;
  contactNumber?: number;
}

/**
 * OCR extracted data from license images
 */
export interface OCRData {
  frontImage: {
    licenseNumber?: string;
    fullName?: string;
    fatherName?: string;
    dateOfBirth?: string;
    expiryDate?: string;
    issueDate?: string;
    issuingAuthority?: string;
    address?: string;
    citizenshipNumber?: string;
    licenseType?: string;
    rawText: string;
    confidence: number;
  };
  backImage?: {
    address?: string;
    additionalInfo?: string;
    rawText: string;
    confidence: number;
  };
  extractedAt: string;
  overallConfidence?: number;
  fieldConfidence?: OCRFieldConfidence;
  qualityCheck: {
    isGoodQuality: boolean;
    issues: string[];
    recommendation?: string;
  };
}

/**
 * Data verification result (comparison between user input and OCR)
 */
export interface DataVerification {
  licenseNumberMatch: boolean;
  nameMatch: boolean;
  dobMatch: boolean;
  expiryDateMatch: boolean;
  matchScore: number;
  checkedAt: string;
}

/**
 * Face detection result from selfie validation
 */
export interface FaceDetection {
  hasFace: boolean;
  faceCount?: number;
  confidence: number;
  isRealFace?: boolean;
  isIdentityMatch?: boolean;
  identityConfidence?: number;
  identityMessage?: string;
  message: string;
  verifiedAt: string;
}

export interface FaceDecision {
  resultCode: 'VERIFIED' | 'UNCERTAIN' | 'REJECTED';
  matched: boolean;
  confidence: number;
  reason: string;
  reviewedSignal: 'auto-face-match' | 'manual-review-needed';
  verifiedAt: string;
}

/**
 * KYC eligibility check full response (including error cases)
 */
export interface KYCEligibilityResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: KYCEligibility;
  requiresProfilePicture?: boolean;
  hasPendingSubmission?: boolean;
  submissionId?: string;
  guidance?: string[];
  estimatedReviewTime?: string;
  nextSteps?: {
    action: string;
    url: string;
    method: string;
  };
}

/**
 * Main KYC submission interface representing a complete KYC record
 */
export interface KYCSubmission {
  _id: string;
  userId: string;
  status: KYCStatus;
  isAutoApproved?: boolean;

  // License Information (User Provided)
  licenseNumber: string;
  fullName: string;
  fatherName?: string;
  dateOfBirth: string;
  licenseExpiryDate: string;
  licenseIssueDate?: string;
  issuedBy?: string; // Government of Nepal
  licenseOffice?: string; // Transport office
  fullAddress?: string;
  contactNumber?: string;
  citizenshipNumber?: string;
  licenseType?: string;

  // Document Images (filenames)
  licenseFrontImage: string;
  licenseBackImage?: string;
  selfieImage: string;

  // OCR Extracted Data (for admin reference only)
  ocrData?: OCRData;

  // Data Verification Results
  dataVerification?: DataVerification;

  // Face Detection Result
  faceDetection?: FaceDetection;
  faceDecision?: FaceDecision;

  // Virtual image URLs (added by backend)
  licenseFrontImageUrl?: string;
  licenseBackImageUrl?: string;

  // Review Information
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;

  // Submission History
  submittedAt: string;
  previousSubmissionId?: string;

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
 */
export interface KYCFormData {
  licenseNumber: string;
  fullName: string;
  fatherName?: string;
  dateOfBirth: Date;
  licenseExpiryDate: Date;
  licenseIssueDate?: Date;
  issuedBy: string;
  licenseOffice: string;
  address: string;
  contactNumber: string;
  licenseFrontImage: {
    uri: string;
    type: string;
    name: string;
  } | null;
  licenseBackImage?: {
    uri: string;
    type: string;
    name: string;
  } | null;
  selfieImage: {
    uri: string;
    type: string;
    name: string;
  } | null;
  previousSubmissionId?: string;
}

/**
 * Filters interface for admin KYC submission list
 */
export interface KYCFilters {
  status?: 'all' | 'pending' | 'approved' | 'rejected';
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Paginated response interface for admin KYC submission list
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
  note?: string;
}

export interface RejectKYCRequest {
  reason: string;
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
  fatherName?: string;
  dateOfBirth?: string;
  licenseExpiryDate?: string;
  licenseIssueDate?: string;
  issuedBy?: string;
  licenseOffice?: string;
  address?: string;
  contactNumber?: string;
  licenseFrontImage?: string;
  licenseBackImage?: string;
  selfieImage?: string;
  general?: string;
}

/**
 * Confidence level thresholds for UI display
 */
export interface ConfidenceThresholds {
  low: number;    // Below this is red (poor confidence)
  medium: number; // Between low and medium is yellow (uncertain)
  high: number;   // Above medium is green (good confidence)
}

/**
 * Default confidence thresholds based on design document
 */
export const DEFAULT_CONFIDENCE_THRESHOLDS: ConfidenceThresholds = {
  low: 60,
  medium: 85,
  high: 95
};

/**
 * Confidence level enum for UI components
 */
export type ConfidenceLevel = 'low' | 'medium' | 'high';

/**
 * Helper function to determine confidence level
 */
export const getConfidenceLevel = (
  score: number, 
  thresholds: ConfidenceThresholds = DEFAULT_CONFIDENCE_THRESHOLDS
): ConfidenceLevel => {
  if (score < thresholds.low) return 'low';
  if (score < thresholds.medium) return 'medium';
  return 'high';
};
