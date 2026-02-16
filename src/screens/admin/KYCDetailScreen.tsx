/**
 * KYC Detail Screen (Admin)
 * 
 * Displays full KYC submission details for admin review with approve/reject actions.
 * Features:
 * - User information display (name, email, contact details)
 * - License details display (number, full name, DOB, expiry date)
 * - Submission date and current status
 * - Front and back license images with tap-to-zoom functionality
 * - Approve button with optional note input field
 * - Reject button with required reason input field (min 10 chars)
 * - Validation for rejection reason length
 * - Loading states during approve/reject actions
 * - Success message and navigation back to list on completion
 * - Submission history display if this is a resubmission
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  User,
  Mail,
  Phone,
  CreditCard,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  ZoomIn,
  X,
  AlertCircle,
  FileText,
} from 'lucide-react-native';
import kycService from '../../services/kycService';
import { KYCSubmission } from '../../types/kyc';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { showSuccess, showError } from '../../utils/toast';

interface KYCDetailScreenProps {
  submissionId: string;
  onNavigateBack: () => void;
}

/**
 * KYCDetailScreen Component
 */
export const KYCDetailScreen: React.FC<KYCDetailScreenProps> = ({
  submissionId,
  onNavigateBack,
}) => {
  // State
  const [submission, setSubmission] = useState<KYCSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Action modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [revocationReason, setRevocationReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');
  const [revocationError, setRevocationError] = useState('');
  
  // Image viewer state
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  /**
   * Fetch submission details on mount
   */
  useEffect(() => {
    fetchSubmissionDetails();
  }, [submissionId]);

  /**
   * Fetch KYC submission details from API
   */
  const fetchSubmissionDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await kycService.getSubmissionById(submissionId);
      setSubmission(data);
    } catch (err) {
      console.error('Error fetching KYC submission:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load submission details';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle image press - open full screen viewer
   */
  const handleImagePress = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setImageViewerVisible(true);
  };

  /**
   * Close image viewer
   */
  const closeImageViewer = () => {
    setImageViewerVisible(false);
    setSelectedImage(null);
  };

  /**
   * Open approve modal
   */
  const openApproveModal = () => {
    setApprovalNote('');
    setShowApproveModal(true);
  };

  /**
   * Open reject modal
   */
  const openRejectModal = () => {
    setRejectionReason('');
    setRejectionError('');
    setShowRejectModal(true);
  };

  /**
   * Open revoke modal
   */
  const openRevokeModal = () => {
    setRevocationReason('');
    setRevocationError('');
    setShowRevokeModal(true);
  };

  /**
   * Handle approve submission
   */
  const handleApprove = async () => {
    try {
      setActionLoading(true);

      await kycService.approveSubmission(submissionId, approvalNote || undefined);
      
      setShowApproveModal(false);
      
      showSuccess(
        'KYC submission has been approved successfully',
        () => onNavigateBack()
      );
    } catch (err) {
      console.error('Error approving submission:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to approve submission';
      showError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Handle reject submission
   */
  const handleReject = async () => {
    // Validate rejection reason
    if (!rejectionReason.trim()) {
      setRejectionError('Rejection reason is required');
      return;
    }

    if (rejectionReason.trim().length < 10) {
      setRejectionError('Rejection reason must be at least 10 characters');
      return;
    }

    try {
      setActionLoading(true);
      setRejectionError('');

      await kycService.rejectSubmission(submissionId, rejectionReason.trim());
      
      setShowRejectModal(false);
      
      showSuccess(
        'KYC submission has been rejected',
        () => onNavigateBack()
      );
    } catch (err) {
      console.error('Error rejecting submission:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to reject submission';
      showError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Handle revoke approved submission
   */
  const handleRevoke = async () => {
    // Validate revocation reason
    if (!revocationReason.trim()) {
      setRevocationError('Revocation reason is required');
      return;
    }

    if (revocationReason.trim().length < 10) {
      setRevocationError('Revocation reason must be at least 10 characters');
      return;
    }

    try {
      setActionLoading(true);
      setRevocationError('');

      await kycService.revokeApprovedSubmission(submissionId, revocationReason.trim());
      
      setShowRevokeModal(false);
      
      showSuccess(
        'Approved KYC has been revoked successfully',
        () => onNavigateBack()
      );
    } catch (err) {
      console.error('Error revoking submission:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to revoke submission';
      showError(errorMessage);
    } finally {
      setActionLoading(false);
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
   * Get status badge styling
   */
  const getStatusStyle = (status: string): { bg: string; text: string; icon: any } => {
    switch (status) {
      case 'pending':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          icon: <Clock size={20} color="#F59E0B" />,
        };
      case 'approved':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          icon: <CheckCircle size={20} color="#10B981" />,
        };
      case 'rejected':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          icon: <XCircle size={20} color="#EF4444" />,
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          icon: <FileText size={20} color="#6B7280" />,
        };
    }
  };

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <View className="bg-white px-6 py-4 border-b border-gray-200">
          <TouchableOpacity onPress={onNavigateBack}>
            <View className="flex-row items-center">
              <ChevronLeft size={24} color="#0096c7" />
              <Text className="text-[#0096c7] text-base ml-1">Back</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0096c7" />
          <Text className="text-gray-600 mt-4 text-base">Loading submission details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  /**
   * Render error state
   */
  if (error || !submission) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        <View className="bg-white px-6 py-4 border-b border-gray-200">
          <TouchableOpacity onPress={onNavigateBack}>
            <View className="flex-row items-center">
              <ChevronLeft size={24} color="#0096c7" />
              <Text className="text-[#0096c7] text-base ml-1">Back</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View className="flex-1 items-center justify-center px-6">
          <AlertCircle size={64} color="#EF4444" />
          <Text className="text-xl font-bold text-gray-800 mt-4">Error Loading Submission</Text>
          <Text className="text-gray-600 text-center mt-2">
            {error || 'Submission not found'}
          </Text>
          <TouchableOpacity
            onPress={fetchSubmissionDetails}
            className="bg-[#0096c7] px-6 py-3 rounded-lg mt-6"
          >
            <Text className="text-white font-semibold text-base">Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusStyle = getStatusStyle(submission.status);
  const userName = submission.user
    ? `${submission.user.firstName || ''} ${submission.user.lastName || ''}`.trim() || submission.fullName
    : submission.fullName;
  const userEmail = submission.user?.email || 'N/A';
  const userPhone = submission.user?.phoneNumber || 'N/A';

  // Get image URLs
  const frontImageUrl = kycService.getImageUrl(submission.licenseFrontImage);
  const backImageUrl = kycService.getImageUrl(submission.licenseBackImage);

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
        
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-gray-800">KYC Details</Text>
          
          {/* Status Badge */}
          <View className={`flex-row items-center px-3 py-2 rounded-full ${statusStyle.bg}`}>
            {statusStyle.icon}
            <Text className={`ml-2 text-sm font-semibold capitalize ${statusStyle.text}`}>
              {submission.status}
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* User Information Section */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-bold text-gray-800 mb-4">User Information</Text>
          
          <View className="space-y-3">
            <View className="flex-row items-center">
              <User size={20} color="#6B7280" />
              <View className="ml-3 flex-1">
                <Text className="text-xs text-gray-600 mb-1">Full Name</Text>
                <Text className="text-base font-medium text-gray-800">{userName}</Text>
              </View>
            </View>
            
            <View className="flex-row items-center">
              <Mail size={20} color="#6B7280" />
              <View className="ml-3 flex-1">
                <Text className="text-xs text-gray-600 mb-1">Email</Text>
                <Text className="text-base font-medium text-gray-800">{userEmail}</Text>
              </View>
            </View>
            
            <View className="flex-row items-center">
              <Phone size={20} color="#6B7280" />
              <View className="ml-3 flex-1">
                <Text className="text-xs text-gray-600 mb-1">Phone Number</Text>
                <Text className="text-base font-medium text-gray-800">{userPhone}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* License Details Section */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-bold text-gray-800 mb-4">License Details</Text>
          
          <View className="space-y-3">
            <View className="flex-row items-center">
              <CreditCard size={20} color="#6B7280" />
              <View className="ml-3 flex-1">
                <Text className="text-xs text-gray-600 mb-1">License Number</Text>
                <Text className="text-base font-medium text-gray-800">{submission.licenseNumber}</Text>
              </View>
            </View>
            
            <View className="flex-row items-center">
              <User size={20} color="#6B7280" />
              <View className="ml-3 flex-1">
                <Text className="text-xs text-gray-600 mb-1">Name on License</Text>
                <Text className="text-base font-medium text-gray-800">{submission.fullName}</Text>
              </View>
            </View>
            
            <View className="flex-row items-center">
              <Calendar size={20} color="#6B7280" />
              <View className="ml-3 flex-1">
                <Text className="text-xs text-gray-600 mb-1">Date of Birth</Text>
                <Text className="text-base font-medium text-gray-800">
                  {formatDate(submission.dateOfBirth)}
                </Text>
              </View>
            </View>
            
            <View className="flex-row items-center">
              <Calendar size={20} color="#6B7280" />
              <View className="ml-3 flex-1">
                <Text className="text-xs text-gray-600 mb-1">License Expiry Date</Text>
                <Text className="text-base font-medium text-gray-800">
                  {formatDate(submission.licenseExpiryDate)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Submission Information Section */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-bold text-gray-800 mb-4">Submission Information</Text>
          
          <View className="space-y-3">
            <View className="flex-row items-center">
              <Clock size={20} color="#6B7280" />
              <View className="ml-3 flex-1">
                <Text className="text-xs text-gray-600 mb-1">Submitted On</Text>
                <Text className="text-base font-medium text-gray-800">
                  {formatDate(submission.submittedAt)}
                </Text>
              </View>
            </View>
            
            {submission.reviewedAt && (
              <View className="flex-row items-center">
                <Clock size={20} color="#6B7280" />
                <View className="ml-3 flex-1">
                  <Text className="text-xs text-gray-600 mb-1">Reviewed On</Text>
                  <Text className="text-base font-medium text-gray-800">
                    {formatDate(submission.reviewedAt)}
                  </Text>
                </View>
              </View>
            )}
            
            {submission.reviewNote && (
              <View className="flex-row items-start">
                <FileText size={20} color="#6B7280" className="mt-1" />
                <View className="ml-3 flex-1">
                  <Text className="text-xs text-gray-600 mb-1">
                    {submission.status === 'rejected' ? 'Rejection Reason' : 'Review Note'}
                  </Text>
                  <Text className="text-base font-medium text-gray-800">
                    {submission.reviewNote}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* License Images Section */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <Text className="text-lg font-bold text-gray-800 mb-4">License Images</Text>
          
          <View className="space-y-4">
            {/* Front Image */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Front of License</Text>
              <TouchableOpacity
                onPress={() => handleImagePress(frontImageUrl)}
                className="relative bg-gray-100 rounded-lg overflow-hidden"
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: frontImageUrl }}
                  className="w-full h-48"
                  resizeMode="contain"
                />
                <View className="absolute top-2 right-2 bg-black/50 rounded-full p-2">
                  <ZoomIn size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>
            
            {/* Back Image */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">Back of License</Text>
              <TouchableOpacity
                onPress={() => handleImagePress(backImageUrl)}
                className="relative bg-gray-100 rounded-lg overflow-hidden"
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: backImageUrl }}
                  className="w-full h-48"
                  resizeMode="contain"
                />
                <View className="absolute top-2 right-2 bg-black/50 rounded-full p-2">
                  <ZoomIn size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Submission History Section */}
        {submission.previousSubmission && (
          <View className="bg-white rounded-lg p-4 mb-4 shadow-sm">
            <Text className="text-lg font-bold text-gray-800 mb-4">Submission History</Text>
            
            <View className="bg-gray-50 rounded-lg p-3">
              <Text className="text-sm font-medium text-gray-700 mb-2">Previous Submission</Text>
              <View className="space-y-2">
                <View className="flex-row justify-between">
                  <Text className="text-xs text-gray-600">Status</Text>
                  <Text className="text-xs font-medium text-red-600 capitalize">
                    {submission.previousSubmission.status}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-gray-600">Submitted</Text>
                  <Text className="text-xs font-medium text-gray-800">
                    {formatDate(submission.previousSubmission.submittedAt)}
                  </Text>
                </View>
                {submission.previousSubmission.reviewNote && (
                  <View className="mt-2">
                    <Text className="text-xs text-gray-600 mb-1">Rejection Reason</Text>
                    <Text className="text-xs text-gray-800">
                      {submission.previousSubmission.reviewNote}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons - Only show for pending submissions */}
        {submission.status === 'pending' && (
          <View className="flex-row space-x-3 mb-6">
            <TouchableOpacity
              onPress={openRejectModal}
              className="flex-1 bg-red-500 py-4 rounded-lg flex-row items-center justify-center"
              activeOpacity={0.8}
            >
              <XCircle size={20} color="#FFFFFF" />
              <Text className="text-white font-bold text-base ml-2">Reject</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={openApproveModal}
              className="flex-1 bg-green-500 py-4 rounded-lg flex-row items-center justify-center"
              activeOpacity={0.8}
            >
              <CheckCircle size={20} color="#FFFFFF" />
              <Text className="text-white font-bold text-base ml-2">Approve</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Revoke Button - Only show for approved submissions */}
        {submission.status === 'approved' && (
          <View className="mb-6">
            <TouchableOpacity
              onPress={openRevokeModal}
              className="bg-red-500 py-4 rounded-lg flex-row items-center justify-center"
              activeOpacity={0.8}
            >
              <XCircle size={20} color="#FFFFFF" />
              <Text className="text-white font-bold text-base ml-2">Revoke Approval</Text>
            </TouchableOpacity>
            <Text className="text-gray-600 text-sm text-center mt-2">
              Revoke this approved KYC and require user to resubmit
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Image Viewer Modal */}
      <Modal
        visible={imageViewerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageViewer}
      >
        <View className="flex-1 bg-black">
          <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
            {/* Close Button */}
            <View className="absolute top-4 right-4 z-10">
              <TouchableOpacity
                onPress={closeImageViewer}
                className="bg-black/50 rounded-full p-2"
              >
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            {/* Full Screen Image */}
            <View className="flex-1 items-center justify-center">
              {selectedImage && (
                <Image
                  source={{ uri: selectedImage }}
                  className="w-full h-full"
                  resizeMode="contain"
                />
              )}
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Approve Modal */}
      <Modal
        visible={showApproveModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowApproveModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-gray-800 mb-4">Approve KYC Submission</Text>
            
            <Text className="text-gray-600 mb-4">
              Are you sure you want to approve this KYC submission? You can optionally add a note.
            </Text>
            
            <TextInput
              className="bg-gray-100 rounded-lg px-4 py-3 text-base text-gray-800 mb-4"
              placeholder="Optional approval note..."
              placeholderTextColor="#9CA3AF"
              value={approvalNote}
              onChangeText={setApprovalNote}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => setShowApproveModal(false)}
                className="flex-1 bg-gray-200 py-3 rounded-lg"
                disabled={actionLoading}
              >
                <Text className="text-gray-800 font-semibold text-base text-center">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleApprove}
                className="flex-1 bg-green-500 py-3 rounded-lg"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-semibold text-base text-center">Approve</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reject Modal */}
      <Modal
        visible={showRejectModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-gray-800 mb-4">Reject KYC Submission</Text>
            
            <Text className="text-gray-600 mb-4">
              Please provide a detailed reason for rejection (minimum 10 characters). This will be shown to the user.
            </Text>
            
            <TextInput
              className="bg-gray-100 rounded-lg px-4 py-3 text-base text-gray-800 mb-2"
              placeholder="Rejection reason (required)..."
              placeholderTextColor="#9CA3AF"
              value={rejectionReason}
              onChangeText={(text) => {
                setRejectionReason(text);
                setRejectionError('');
              }}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            {rejectionError ? (
              <Text className="text-red-500 text-sm mb-4">{rejectionError}</Text>
            ) : null}
            
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => setShowRejectModal(false)}
                className="flex-1 bg-gray-200 py-3 rounded-lg"
                disabled={actionLoading}
              >
                <Text className="text-gray-800 font-semibold text-base text-center">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleReject}
                className="flex-1 bg-red-500 py-3 rounded-lg"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-semibold text-base text-center">Reject</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Revoke Modal */}
      <Modal
        visible={showRevokeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRevokeModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-gray-800 mb-4">Revoke Approved KYC</Text>
            
            <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <View className="flex-row items-start">
                <AlertCircle size={20} color="#F59E0B" />
                <Text className="text-yellow-800 text-sm ml-2 flex-1">
                  This will revoke the approved KYC and change its status to rejected. The user will need to resubmit their documents.
                </Text>
              </View>
            </View>
            
            <Text className="text-gray-600 mb-4">
              Please provide a detailed reason for revocation (minimum 10 characters). This will be shown to the user.
            </Text>
            
            <TextInput
              className="bg-gray-100 rounded-lg px-4 py-3 text-base text-gray-800 mb-2"
              placeholder="Revocation reason (required)..."
              placeholderTextColor="#9CA3AF"
              value={revocationReason}
              onChangeText={(text) => {
                setRevocationReason(text);
                setRevocationError('');
              }}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            
            {revocationError ? (
              <Text className="text-red-500 text-sm mb-4">{revocationError}</Text>
            ) : null}
            
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => setShowRevokeModal(false)}
                className="flex-1 bg-gray-200 py-3 rounded-lg"
                disabled={actionLoading}
              >
                <Text className="text-gray-800 font-semibold text-base text-center">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleRevoke}
                className="flex-1 bg-red-500 py-3 rounded-lg"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-semibold text-base text-center">Revoke</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Loading Overlay for Actions */}
      <LoadingOverlay 
        visible={actionLoading} 
        message={showApproveModal ? "Approving submission..." : showRevokeModal ? "Revoking approval..." : "Rejecting submission..."} 
      />
    </SafeAreaView>
  );
};
