/**
 * KYC Status Screen
 * 
 * Displays the current KYC verification status to users with appropriate UI for each state:
 * - Not Submitted: Shows submit button
 * - Pending: Shows under review message with estimated time
 * - Approved: Shows verified status with success indicator
 * - Rejected: Shows rejection reason with resubmit button
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  FileText, 
  AlertCircle,
  ChevronLeft,
  Timer,
} from 'lucide-react-native';
import kycService from '../services/kycService';
import { KYCSubmission } from '../types/kyc';
import { showError } from '../utils/toast';

interface KYCStatusScreenProps {
  onNavigateBack: () => void;
  onNavigateToSubmission: (previousSubmissionId?: string, previousData?: any) => void;
}

/**
 * KYCStatusScreen Component
 */
export const KYCStatusScreen: React.FC<KYCStatusScreenProps> = ({
  onNavigateBack,
  onNavigateToSubmission,
}) => {
  const [kycStatus, setKycStatus] = useState<KYCSubmission | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    totalMs: number;
  } | null>(null);
  const [canResubmit, setCanResubmit] = useState(false);

  /**
   * Fetch KYC status on mount
   */
  useEffect(() => {
    fetchKYCStatus();
  }, []);

  /**
   * Calculate remaining time for resubmission window - DISABLED for testing
   */
  useEffect(() => {
    // Always allow resubmission immediately (no 24-hour restriction)
    setCanResubmit(true);
    setRemainingTime(null);
  }, [kycStatus]);

  /**
   * Fetch current KYC status from API
   */
  const fetchKYCStatus = async () => {
    try {
      setError(null);
      const status = await kycService.getKYCStatus();
      setKycStatus(status);
    } catch (err) {
      console.error('Error fetching KYC status:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load KYC status';
      setError(errorMessage);
      
      // Show toast only if not refreshing (to avoid duplicate messages)
      if (!refreshing) {
        showError(errorMessage);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Handle pull-to-refresh
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchKYCStatus();
  }, []);

  /**
   * Navigate to submission screen for new submission
   */
  const handleSubmitKYC = () => {
    onNavigateToSubmission();
  };

  /**
   * Navigate to submission screen for resubmission
   */
  const handleResubmitKYC = () => {
    // Resubmission restriction disabled - always allow
    if (kycStatus && kycStatus.status === 'rejected') {
      // Pre-populate form with previous data (excluding images)
      const previousData = {
        licenseNumber: kycStatus.licenseNumber,
        fullName: kycStatus.fullName,
        dateOfBirth: new Date(kycStatus.dateOfBirth),
        licenseExpiryDate: new Date(kycStatus.licenseExpiryDate),
      };
      onNavigateToSubmission(kycStatus._id, previousData);
    } else {
      onNavigateToSubmission();
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0096c7" />
          <Text className="text-gray-600 mt-4 text-base">Loading KYC status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  /**
   * Render error state
   */
  if (error && kycStatus === undefined) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        {/* Header */}
        <View className="bg-white px-6 py-4 border-b border-gray-200">
          <TouchableOpacity onPress={onNavigateBack} className="mb-3">
            <View className="flex-row items-center">
              <ChevronLeft size={24} color="#0096c7" />
              <Text className="text-[#0096c7] text-base ml-1">Back</Text>
            </View>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-800">KYC Verification</Text>
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <AlertCircle size={64} color="#EF4444" />
          <Text className="text-xl font-bold text-gray-800 mt-4">Error Loading Status</Text>
          <Text className="text-gray-600 text-center mt-2">{error}</Text>
          <TouchableOpacity
            onPress={fetchKYCStatus}
            className="bg-[#0096c7] px-6 py-3 rounded-lg mt-6"
          >
            <Text className="text-white font-semibold text-base">Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /**
   * Render "Not Submitted" state
   */
  const renderNotSubmittedState = () => (
    <View className="flex-1 items-center justify-center px-6">
      <FileText size={80} color="#9CA3AF" />
      <Text className="text-2xl font-bold text-gray-800 mt-6">KYC Not Submitted</Text>
      <Text className="text-gray-600 text-center mt-3 text-base leading-6">
        Complete your KYC verification to access all platform features. The process is quick and secure.
      </Text>
      
      <TouchableOpacity
        onPress={handleSubmitKYC}
        className="bg-[#0096c7] px-8 py-4 rounded-lg mt-8 w-full"
      >
        <Text className="text-white font-semibold text-center text-base">Submit KYC</Text>
      </TouchableOpacity>

      {/* Info Box */}
      <View className="bg-blue-50 rounded-lg p-4 mt-6 w-full">
        <Text className="text-blue-800 text-sm font-semibold mb-2">What you'll need:</Text>
        <Text className="text-blue-700 text-sm">• Valid driver's license</Text>
        <Text className="text-blue-700 text-sm">• Clear photos of front and back</Text>
        <Text className="text-blue-700 text-sm">• Personal information</Text>
      </View>
    </View>
  );

  /**
   * Get confidence level color and label
   */
  const getConfidenceLevel = (score: number | undefined): { color: string; bgColor: string; label: string } => {
    if (score === undefined) return { color: '#6B7280', bgColor: '#F3F4F6', label: 'N/A' };
    if (score >= 85) return { color: '#10B981', bgColor: '#D1FAE5', label: 'High' };
    if (score >= 60) return { color: '#F59E0B', bgColor: '#FEF3C7', label: 'Medium' };
    return { color: '#EF4444', bgColor: '#FEE2E2', label: 'Low' };
  };

  /**
   * Get face match status display
   */
  const getFaceMatchStatus = (resultCode: string | undefined): { icon: string; color: string; label: string } => {
    switch (resultCode) {
      case 'VERIFIED':
        return { icon: '✓', color: '#10B981', label: 'Verified' };
      case 'UNCERTAIN':
        return { icon: '?', color: '#F59E0B', label: 'Uncertain' };
      case 'REJECTED':
        return { icon: '✗', color: '#EF4444', label: 'Rejected' };
      default:
        return { icon: '—', color: '#6B7280', label: 'Pending' };
    }
  };

  /**
   * Render "Under Review" (Pending) state
   */
  const renderPendingState = () => {
    const faceConfidence = kycStatus?.faceDetection?.identityConfidence;
    const ocrConfidence = kycStatus?.ocrData?.overallConfidence;
    const faceMatchStatus = getFaceMatchStatus(kycStatus?.faceDecision?.resultCode);
    const faceLevel = getConfidenceLevel(faceConfidence);
    const ocrLevel = getConfidenceLevel(ocrConfidence);

    return (
      <View className="flex-1 px-6 py-8">
        <View className="items-center mb-8">
          <View className="bg-yellow-100 rounded-full p-6 mb-4">
            <Clock size={64} color="#F59E0B" />
          </View>
          <Text className="text-2xl font-bold text-gray-800">Under Review</Text>
          <Text className="text-gray-600 text-center mt-2 text-base">
            Your KYC application is being reviewed by our team
          </Text>
        </View>

        {/* Status Card */}
        <View className="bg-white rounded-lg p-6 shadow-sm mb-4">
          <View className="flex-row items-center mb-4 pb-4 border-b border-gray-200">
            <View className="bg-yellow-100 rounded-full p-2 mr-3">
              <Clock size={20} color="#F59E0B" />
            </View>
            <View className="flex-1">
              <Text className="text-sm text-gray-600">Status</Text>
              <Text className="text-base font-semibold text-gray-800 capitalize">
                {kycStatus?.status}
              </Text>
            </View>
            {kycStatus?.isAutoApproved && (
              <View className="bg-green-100 px-3 py-1 rounded-full">
                <Text className="text-green-700 text-xs font-semibold">Auto-Approved</Text>
              </View>
            )}
          </View>

          <View className="mb-4">
            <Text className="text-sm text-gray-600 mb-1">Submitted On</Text>
            <Text className="text-base text-gray-800">
              {kycStatus?.submittedAt ? formatDate(kycStatus.submittedAt) : 'N/A'}
            </Text>
          </View>

          <View>
            <Text className="text-sm text-gray-600 mb-1">License Number</Text>
            <Text className="text-base text-gray-800">{kycStatus?.licenseNumber}</Text>
          </View>
        </View>

        {/* Verification Scores Card */}
        <View className="bg-white rounded-lg p-6 shadow-sm mb-4">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Verification Scores</Text>

          {/* Face Match Status */}
          <View className="mb-4 pb-4 border-b border-gray-200">
            <Text className="text-sm text-gray-600 mb-2">Face Match Status</Text>
            <View className="flex-row items-center">
              <View 
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: faceMatchStatus.color + '20' }}
              >
                <Text style={{ color: faceMatchStatus.color, fontSize: 16, fontWeight: 'bold' }}>
                  {faceMatchStatus.icon}
                </Text>
              </View>
              <Text className="text-base font-semibold" style={{ color: faceMatchStatus.color }}>
                {faceMatchStatus.label}
              </Text>
            </View>
          </View>

          {/* Face Confidence Score */}
          <View className="mb-4 pb-4 border-b border-gray-200">
            <Text className="text-sm text-gray-600 mb-2">Face Confidence</Text>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View 
                  className="px-3 py-1 rounded-full mr-3"
                  style={{ backgroundColor: faceLevel.bgColor }}
                >
                  <Text style={{ color: faceLevel.color, fontSize: 12, fontWeight: '600' }}>
                    {faceLevel.label}
                  </Text>
                </View>
                <Text className="text-2xl font-bold" style={{ color: faceLevel.color }}>
                  {faceConfidence !== undefined ? `${faceConfidence.toFixed(1)}%` : 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          {/* OCR Confidence Score */}
          <View>
            <Text className="text-sm text-gray-600 mb-2">OCR Confidence</Text>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View 
                  className="px-3 py-1 rounded-full mr-3"
                  style={{ backgroundColor: ocrLevel.bgColor }}
                >
                  <Text style={{ color: ocrLevel.color, fontSize: 12, fontWeight: '600' }}>
                    {ocrLevel.label}
                  </Text>
                </View>
                <Text className="text-2xl font-bold" style={{ color: ocrLevel.color }}>
                  {ocrConfidence !== undefined ? `${ocrConfidence.toFixed(1)}%` : 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Estimated Time Card */}
        <View className="bg-blue-50 rounded-lg p-5">
          <Text className="text-blue-800 font-semibold text-base mb-2">
            ⏱️ Estimated Verification Time
          </Text>
          <Text className="text-blue-700 text-base">
            Verification typically takes 24-48 hours. You'll be notified once your KYC is reviewed.
          </Text>
        </View>

        {/* Info Text */}
        <View className="mt-6">
          <Text className="text-gray-500 text-sm text-center">
            Pull down to refresh status
          </Text>
        </View>
      </View>
    );
  };

  /**
   * Render "Verified" (Approved) state
   */
  const renderApprovedState = () => {
    const faceConfidence = kycStatus?.faceDetection?.identityConfidence;
    const ocrConfidence = kycStatus?.ocrData?.overallConfidence;
    const faceMatchStatus = getFaceMatchStatus(kycStatus?.faceDecision?.resultCode);
    const faceLevel = getConfidenceLevel(faceConfidence);
    const ocrLevel = getConfidenceLevel(ocrConfidence);

    return (
      <View className="flex-1 px-6 py-8">
        <View className="items-center mb-8">
          <View className="bg-green-100 rounded-full p-6 mb-4">
            <CheckCircle size={64} color="#10B981" />
          </View>
          <Text className="text-2xl font-bold text-gray-800">Verified</Text>
          <Text className="text-gray-600 text-center mt-2 text-base">
            Your identity has been successfully verified
          </Text>
        </View>

        {/* Status Card */}
        <View className="bg-white rounded-lg p-6 shadow-sm mb-4">
          <View className="flex-row items-center mb-4 pb-4 border-b border-gray-200">
            <View className="bg-green-100 rounded-full p-2 mr-3">
              <CheckCircle size={20} color="#10B981" />
            </View>
            <View className="flex-1">
              <Text className="text-sm text-gray-600">Status</Text>
              <Text className="text-base font-semibold text-green-600 capitalize">
                {kycStatus?.status}
              </Text>
            </View>
            {kycStatus?.isAutoApproved && (
              <View className="bg-green-100 px-3 py-1 rounded-full">
                <Text className="text-green-700 text-xs font-semibold">Auto-Approved</Text>
              </View>
            )}
          </View>

          <View className="mb-4">
            <Text className="text-sm text-gray-600 mb-1">Verified On</Text>
            <Text className="text-base text-gray-800">
              {kycStatus?.reviewedAt ? formatDate(kycStatus.reviewedAt) : 'N/A'}
            </Text>
          </View>

          <View className="mb-4">
            <Text className="text-sm text-gray-600 mb-1">Submitted On</Text>
            <Text className="text-base text-gray-800">
              {kycStatus?.submittedAt ? formatDate(kycStatus.submittedAt) : 'N/A'}
            </Text>
          </View>

          <View>
            <Text className="text-sm text-gray-600 mb-1">License Number</Text>
            <Text className="text-base text-gray-800">{kycStatus?.licenseNumber}</Text>
          </View>

          {kycStatus?.reviewNote && (
            <View className="mt-4 pt-4 border-t border-gray-200">
              <Text className="text-sm text-gray-600 mb-1">Admin Note</Text>
              <Text className="text-base text-gray-800">{kycStatus.reviewNote}</Text>
            </View>
          )}
        </View>

        {/* Verification Scores Card */}
        <View className="bg-white rounded-lg p-6 shadow-sm mb-4">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Verification Scores</Text>

          {/* Face Match Status */}
          <View className="mb-4 pb-4 border-b border-gray-200">
            <Text className="text-sm text-gray-600 mb-2">Face Match Status</Text>
            <View className="flex-row items-center">
              <View 
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: faceMatchStatus.color + '20' }}
              >
                <Text style={{ color: faceMatchStatus.color, fontSize: 16, fontWeight: 'bold' }}>
                  {faceMatchStatus.icon}
                </Text>
              </View>
              <Text className="text-base font-semibold" style={{ color: faceMatchStatus.color }}>
                {faceMatchStatus.label}
              </Text>
            </View>
          </View>

          {/* Face Confidence Score */}
          <View className="mb-4 pb-4 border-b border-gray-200">
            <Text className="text-sm text-gray-600 mb-2">Face Confidence</Text>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View 
                  className="px-3 py-1 rounded-full mr-3"
                  style={{ backgroundColor: faceLevel.bgColor }}
                >
                  <Text style={{ color: faceLevel.color, fontSize: 12, fontWeight: '600' }}>
                    {faceLevel.label}
                  </Text>
                </View>
                <Text className="text-2xl font-bold" style={{ color: faceLevel.color }}>
                  {faceConfidence !== undefined ? `${faceConfidence.toFixed(1)}%` : 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          {/* OCR Confidence Score */}
          <View>
            <Text className="text-sm text-gray-600 mb-2">OCR Confidence</Text>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View 
                  className="px-3 py-1 rounded-full mr-3"
                  style={{ backgroundColor: ocrLevel.bgColor }}
                >
                  <Text style={{ color: ocrLevel.color, fontSize: 12, fontWeight: '600' }}>
                    {ocrLevel.label}
                  </Text>
                </View>
                <Text className="text-2xl font-bold" style={{ color: ocrLevel.color }}>
                  {ocrConfidence !== undefined ? `${ocrConfidence.toFixed(1)}%` : 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Success Message */}
        <View className="bg-green-50 rounded-lg p-5">
          <Text className="text-green-800 font-semibold text-base mb-2">
            ✅ You're all set!
          </Text>
          <Text className="text-green-700 text-base">
            You now have full access to all platform features. Thank you for completing your verification.
          </Text>
        </View>
      </View>
    );
  };

  /**
   * Render "Rejected" state
   */
  const renderRejectedState = () => {
    const faceConfidence = kycStatus?.faceDetection?.identityConfidence;
    const ocrConfidence = kycStatus?.ocrData?.overallConfidence;
    const faceMatchStatus = getFaceMatchStatus(kycStatus?.faceDecision?.resultCode);
    const faceLevel = getConfidenceLevel(faceConfidence);
    const ocrLevel = getConfidenceLevel(ocrConfidence);

    return (
      <View className="flex-1 px-6 py-8">
        <View className="items-center mb-8">
          <View className="bg-red-100 rounded-full p-6 mb-4">
            <XCircle size={64} color="#EF4444" />
          </View>
          <Text className="text-2xl font-bold text-gray-800">Rejected</Text>
          <Text className="text-gray-600 text-center mt-2 text-base">
            Your KYC application was not approved
          </Text>
        </View>

        {/* Status Card */}
        <View className="bg-white rounded-lg p-6 shadow-sm mb-4">
          <View className="flex-row items-center mb-4 pb-4 border-b border-gray-200">
            <View className="bg-red-100 rounded-full p-2 mr-3">
              <XCircle size={20} color="#EF4444" />
            </View>
            <View className="flex-1">
              <Text className="text-sm text-gray-600">Status</Text>
              <Text className="text-base font-semibold text-red-600 capitalize">
                {kycStatus?.status}
              </Text>
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-sm text-gray-600 mb-1">Reviewed On</Text>
            <Text className="text-base text-gray-800">
              {kycStatus?.reviewedAt ? formatDate(kycStatus.reviewedAt) : 'N/A'}
            </Text>
          </View>

          <View className="mb-4">
            <Text className="text-sm text-gray-600 mb-1">Submitted On</Text>
            <Text className="text-base text-gray-800">
              {kycStatus?.submittedAt ? formatDate(kycStatus.submittedAt) : 'N/A'}
            </Text>
          </View>

          <View>
            <Text className="text-sm text-gray-600 mb-1">License Number</Text>
            <Text className="text-base text-gray-800">{kycStatus?.licenseNumber}</Text>
          </View>
        </View>

        {/* Rejection Reason */}
        {kycStatus?.reviewNote && (
          <View className="bg-red-50 rounded-lg p-5 mb-4">
            <Text className="text-red-800 font-semibold text-base mb-2">
              Rejection Reason
            </Text>
            <Text className="text-red-700 text-base leading-6">
              {kycStatus.reviewNote}
            </Text>
          </View>
        )}

        {/* Verification Scores Card */}
        <View className="bg-white rounded-lg p-6 shadow-sm mb-4">
          <Text className="text-lg font-semibold text-gray-800 mb-4">Verification Scores</Text>

          {/* Face Match Status */}
          <View className="mb-4 pb-4 border-b border-gray-200">
            <Text className="text-sm text-gray-600 mb-2">Face Match Status</Text>
            <View className="flex-row items-center">
              <View 
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: faceMatchStatus.color + '20' }}
              >
                <Text style={{ color: faceMatchStatus.color, fontSize: 16, fontWeight: 'bold' }}>
                  {faceMatchStatus.icon}
                </Text>
              </View>
              <Text className="text-base font-semibold" style={{ color: faceMatchStatus.color }}>
                {faceMatchStatus.label}
              </Text>
            </View>
          </View>

          {/* Face Confidence Score */}
          <View className="mb-4 pb-4 border-b border-gray-200">
            <Text className="text-sm text-gray-600 mb-2">Face Confidence</Text>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View 
                  className="px-3 py-1 rounded-full mr-3"
                  style={{ backgroundColor: faceLevel.bgColor }}
                >
                  <Text style={{ color: faceLevel.color, fontSize: 12, fontWeight: '600' }}>
                    {faceLevel.label}
                  </Text>
                </View>
                <Text className="text-2xl font-bold" style={{ color: faceLevel.color }}>
                  {faceConfidence !== undefined ? `${faceConfidence.toFixed(1)}%` : 'N/A'}
                </Text>
              </View>
            </View>
          </View>

          {/* OCR Confidence Score */}
          <View>
            <Text className="text-sm text-gray-600 mb-2">OCR Confidence</Text>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View 
                  className="px-3 py-1 rounded-full mr-3"
                  style={{ backgroundColor: ocrLevel.bgColor }}
                >
                  <Text style={{ color: ocrLevel.color, fontSize: 12, fontWeight: '600' }}>
                    {ocrLevel.label}
                  </Text>
                </View>
                <Text className="text-2xl font-bold" style={{ color: ocrLevel.color }}>
                  {ocrConfidence !== undefined ? `${ocrConfidence.toFixed(1)}%` : 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Resubmission Timer - Show if within 24-hour window */}
        {!canResubmit && remainingTime && (
          <View className="bg-yellow-50 rounded-lg p-5 mb-4 border border-yellow-200">
            <View className="flex-row items-center mb-3">
              <Timer size={20} color="#F59E0B" />
              <Text className="text-yellow-800 font-semibold text-base ml-2">
                Resubmission Window
              </Text>
            </View>
            <Text className="text-yellow-700 text-sm mb-3">
              You must wait 24 hours after rejection before resubmitting. Please review the rejection reason and prepare corrected documents.
            </Text>
            <View className="bg-yellow-100 rounded-lg p-4">
              <Text className="text-yellow-900 text-center text-lg font-bold">
                {String(remainingTime.hours).padStart(2, '0')}:
                {String(remainingTime.minutes).padStart(2, '0')}:
                {String(remainingTime.seconds).padStart(2, '0')}
              </Text>
              <Text className="text-yellow-700 text-center text-xs mt-1">
                Time remaining until you can resubmit
              </Text>
            </View>
          </View>
        )}

        {/* Resubmit Button */}
        <TouchableOpacity
          onPress={handleResubmitKYC}
          disabled={!canResubmit}
          className={`px-8 py-4 rounded-lg w-full ${
            canResubmit ? 'bg-[#0096c7]' : 'bg-gray-300'
          }`}
        >
          <Text className={`font-semibold text-center text-base ${
            canResubmit ? 'text-white' : 'text-gray-500'
          }`}>
            {canResubmit ? 'Resubmit KYC' : 'Resubmit Locked'}
          </Text>
        </TouchableOpacity>

        {/* Info Text */}
        <View className="mt-4">
          <Text className="text-gray-500 text-sm text-center">
            {canResubmit 
              ? 'Please review the rejection reason and resubmit with corrected information'
              : `Resubmission will be available after the 24-hour waiting period`
            }
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <TouchableOpacity onPress={onNavigateBack} className="mb-3">
          <View className="flex-row items-center">
            <ChevronLeft size={24} color="#0096c7" />
            <Text className="text-[#0096c7] text-base ml-1">Back</Text>
          </View>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-800">KYC Verification</Text>
      </View>

      {/* Content with Pull-to-Refresh */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0096c7']}
            tintColor="#0096c7"
          />
        }
      >
        {/* Render appropriate state based on KYC status */}
        {kycStatus === null && renderNotSubmittedState()}
        {kycStatus?.status === 'pending' && renderPendingState()}
        {kycStatus?.status === 'approved' && renderApprovedState()}
        {kycStatus?.status === 'rejected' && renderRejectedState()}
      </ScrollView>
    </SafeAreaView>
  );
};
