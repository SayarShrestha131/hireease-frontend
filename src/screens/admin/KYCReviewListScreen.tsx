/**
 * KYC Review List Screen (Admin)
 * 
 * Displays a list of KYC submissions for admin review with filtering, search, and pagination.
 * Features:
 * - Filter tabs for All, Pending, Approved, Rejected statuses
 * - Search bar with debounced input for name/license number filtering
 * - Submission cards with user details and status badges
 * - Pull-to-refresh functionality
 * - Pagination/infinite scroll for large lists
 * - Navigation to detail screen on card press
 * - Empty state when no submissions match filters
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search,
  ChevronLeft,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  AlertCircle,
} from 'lucide-react-native';
import kycService from '../../services/kycService';
import { KYCSubmission, KYCStatus } from '../../types/kyc';
import { showError } from '../../utils/toast';

interface KYCReviewListScreenProps {
  onNavigateBack: () => void;
  onNavigateToDetail: (submissionId: string) => void;
}

/**
 * KYCReviewListScreen Component
 */
export const KYCReviewListScreen: React.FC<KYCReviewListScreenProps> = ({
  onNavigateBack,
  onNavigateToDetail,
}) => {
  // State
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  // Refs
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  /**
   * Debounce search input
   */
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery]);

  /**
   * Fetch submissions when filter or search changes
   */
  useEffect(() => {
    setPage(1);
    setSubmissions([]);
    setHasMore(true);
    fetchSubmissions(1, true);
  }, [filter, debouncedSearch]);

  /**
   * Fetch KYC submissions from API
   */
  const fetchSubmissions = async (pageNum: number = 1, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const response = await kycService.getAllSubmissions({
        status: filter,
        search: debouncedSearch || undefined,
        page: pageNum,
        limit: 20,
      });

      if (reset) {
        setSubmissions(response.submissions);
      } else {
        setSubmissions(prev => [...prev, ...response.submissions]);
      }

      setTotalCount(response.total);
      setPendingCount(response.pendingCount);
      setHasMore(pageNum < response.totalPages);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching KYC submissions:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load submissions';
      setError(errorMessage);
      
      // Show toast only if not refreshing (to avoid duplicate messages)
      if (!refreshing) {
        showError(errorMessage);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  /**
   * Handle pull-to-refresh
   */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchSubmissions(1, true);
  }, [filter, debouncedSearch]);

  /**
   * Handle load more (pagination)
   */
  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      fetchSubmissions(page + 1, false);
    }
  };

  /**
   * Handle filter change
   */
  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
  };

  /**
   * Handle search input change
   */
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  /**
   * Handle submission card press
   */
  const handleSubmissionPress = (submissionId: string) => {
    onNavigateToDetail(submissionId);
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Get status badge color
   */
  const getStatusColor = (status: KYCStatus): { bg: string; text: string; icon: any } => {
    switch (status) {
      case 'pending':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          icon: <Clock size={16} color="#F59E0B" />,
        };
      case 'approved':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          icon: <CheckCircle size={16} color="#10B981" />,
        };
      case 'rejected':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          icon: <XCircle size={16} color="#EF4444" />,
        };
    }
  };

  /**
   * Render submission card
   */
  const renderSubmissionCard = ({ item }: { item: KYCSubmission }) => {
    const statusStyle = getStatusColor(item.status);
    const userName = item.user
      ? `${item.user.firstName || ''} ${item.user.lastName || ''}`.trim() || item.fullName
      : item.fullName;
    const userEmail = item.user?.email || 'N/A';

    return (
      <TouchableOpacity
        onPress={() => handleSubmissionPress(item._id)}
        className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-200"
        activeOpacity={0.7}
      >
        {/* User Info */}
        <View className="flex-row items-start justify-between mb-3">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-800 mb-1">{userName}</Text>
            <Text className="text-sm text-gray-600">{userEmail}</Text>
          </View>
          
          {/* Status Badge */}
          <View className={`flex-row items-center px-3 py-1 rounded-full ${statusStyle.bg}`}>
            {statusStyle.icon}
            <Text className={`ml-1 text-xs font-semibold capitalize ${statusStyle.text}`}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* License Info */}
        <View className="border-t border-gray-200 pt-3">
          <View className="flex-row justify-between mb-2">
            <Text className="text-sm text-gray-600">License Number</Text>
            <Text className="text-sm font-medium text-gray-800">{item.licenseNumber}</Text>
          </View>
          
          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-600">Submitted</Text>
            <Text className="text-sm font-medium text-gray-800">
              {formatDate(item.submittedAt)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => {
    if (loading) return null;

    const isFiltered = filter !== 'all' || debouncedSearch !== '';
    
    return (
      <View className="flex-1 items-center justify-center px-6 py-12">
        <FileText size={64} color="#9CA3AF" />
        <Text className="text-xl font-bold text-gray-800 mt-4">
          {isFiltered ? 'No Submissions Found' : 'No Submissions Yet'}
        </Text>
        <Text className="text-gray-600 text-center mt-2">
          {isFiltered
            ? 'Try adjusting your filters or search query'
            : 'KYC submissions will appear here once users submit their applications'}
        </Text>
      </View>
    );
  };

  /**
   * Render footer (loading more indicator)
   */
  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color="#0096c7" />
      </View>
    );
  };

  /**
   * Render error state
   */
  if (error && submissions.length === 0 && !loading) {
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
          <Text className="text-2xl font-bold text-gray-800">KYC Review</Text>
        </View>

        <View className="flex-1 items-center justify-center px-6">
          <AlertCircle size={64} color="#EF4444" />
          <Text className="text-xl font-bold text-gray-800 mt-4">Error Loading Submissions</Text>
          <Text className="text-gray-600 text-center mt-2">{error}</Text>
          <TouchableOpacity
            onPress={() => fetchSubmissions(1, true)}
            className="bg-[#0096c7] px-6 py-3 rounded-lg mt-6"
          >
            <Text className="text-white font-semibold text-base">Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text className="text-2xl font-bold text-gray-800">KYC Review</Text>
          
          {/* Pending Count Badge */}
          {pendingCount > 0 && (
            <View className="bg-yellow-500 rounded-full px-3 py-1">
              <Text className="text-white font-bold text-sm">{pendingCount} Pending</Text>
            </View>
          )}
        </View>
      </View>

      {/* Search Bar */}
      <View className="bg-white px-6 py-3 border-b border-gray-200">
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
          <Search size={20} color="#6B7280" />
          <TextInput
            className="flex-1 ml-2 text-base text-gray-800"
            placeholder="Search by name or license number..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View className="bg-white px-6 py-3 border-b border-gray-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row space-x-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((filterOption) => (
              <TouchableOpacity
                key={filterOption}
                onPress={() => handleFilterChange(filterOption)}
                className={`px-4 py-2 rounded-full ${
                  filter === filterOption
                    ? 'bg-[#0096c7]'
                    : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`font-semibold capitalize ${
                    filter === filterOption
                      ? 'text-white'
                      : 'text-gray-700'
                  }`}
                >
                  {filterOption}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Submissions List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0096c7" />
          <Text className="text-gray-600 mt-4 text-base">Loading submissions...</Text>
        </View>
      ) : (
        <FlatList
          data={submissions}
          renderItem={renderSubmissionCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#0096c7']}
              tintColor="#0096c7"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
        />
      )}
    </SafeAreaView>
  );
};
