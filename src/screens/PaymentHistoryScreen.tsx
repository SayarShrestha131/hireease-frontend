/**
 * Payment History Screen
 * 
 * Displays list of user's payment transactions with filtering,
 * pagination, summary statistics, and receipt download.
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { Download, Filter, ChevronLeft, ChevronRight } from 'lucide-react-native';
import paymentService from '../services/paymentService';
import { PaymentTransaction, PaymentStatus, PaymentMethod } from '../types/payment';

interface PaymentHistoryScreenProps {
  onBack: () => void;
}

const PaymentHistoryScreen: React.FC<PaymentHistoryScreenProps> = ({ onBack }) => {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Summary
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalRefunded, setTotalRefunded] = useState(0);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | undefined>();
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadPaymentHistory();
  }, [page, statusFilter, methodFilter]);

  const loadPaymentHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await paymentService.getPaymentHistory({
        page,
        limit: 20,
        status: statusFilter,
        paymentMethod: methodFilter,
      });
      
      setTransactions(response.data.transactions);
      setTotalPages(response.data.pagination.totalPages);
      setTotal(response.data.pagination.total);
      setTotalPaid(response.data.summary.totalPaid);
      setTotalRefunded(response.data.summary.totalRefunded);
    } catch (err: any) {
      console.error('Failed to load payment history:', err);
      setError(err.response?.data?.error || 'Failed to load payment history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    loadPaymentHistory();
  };

  const handleDownloadReceipt = async (bookingId: string) => {
    try {
      const response = await paymentService.getReceipt(bookingId);
      if (response.data.receiptUrl) {
        await Linking.openURL(response.data.receiptUrl);
      }
    } catch (err) {
      console.error('Failed to download receipt:', err);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: PaymentStatus): string => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'refunded':
        return 'text-orange-600 bg-orange-100';
      case 'processing':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getMethodLabel = (method: PaymentMethod): string => {
    switch (method) {
      case 'khalti':
        return 'Khalti';
      case 'stripe':
        return 'Card';
      case 'paypal':
        return 'PayPal';
      default:
        return method;
    }
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-white">
        <View className="px-6 py-4 border-b border-gray-200">
          <TouchableOpacity onPress={onBack}>
            <Text className="text-[#0096c7] text-base">← Back</Text>
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900 mt-2">Payment History</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0096c7" />
          <Text className="text-gray-600 mt-3">Loading payment history...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-200">
        <TouchableOpacity onPress={onBack} className="mb-3">
          <Text className="text-[#0096c7] text-base">← Back</Text>
        </TouchableOpacity>
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold text-gray-900">Payment History</Text>
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
            <Filter size={24} color="#0096c7" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary */}
      <View className="px-6 py-4 bg-blue-50">
        <View className="flex-row justify-between">
          <View className="flex-1">
            <Text className="text-sm text-gray-600 mb-1">Total Paid</Text>
            <Text className="text-xl font-bold text-green-600">
              Rs. {totalPaid.toFixed(2)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm text-gray-600 mb-1">Total Refunded</Text>
            <Text className="text-xl font-bold text-orange-600">
              Rs. {totalRefunded.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Filters */}
      {showFilters && (
        <View className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <Text className="text-sm font-semibold text-gray-700 mb-2">Filter by Status</Text>
          <View className="flex-row flex-wrap mb-3">
            <TouchableOpacity
              className={`px-3 py-1 rounded-full mr-2 mb-2 ${
                !statusFilter ? 'bg-[#0096c7]' : 'bg-gray-200'
              }`}
              onPress={() => setStatusFilter(undefined)}
            >
              <Text className={!statusFilter ? 'text-white' : 'text-gray-700'}>All</Text>
            </TouchableOpacity>
            {(['completed', 'failed', 'refunded'] as PaymentStatus[]).map((status) => (
              <TouchableOpacity
                key={status}
                className={`px-3 py-1 rounded-full mr-2 mb-2 ${
                  statusFilter === status ? 'bg-[#0096c7]' : 'bg-gray-200'
                }`}
                onPress={() => setStatusFilter(status)}
              >
                <Text className={statusFilter === status ? 'text-white' : 'text-gray-700'}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-sm font-semibold text-gray-700 mb-2">Filter by Method</Text>
          <View className="flex-row flex-wrap">
            <TouchableOpacity
              className={`px-3 py-1 rounded-full mr-2 mb-2 ${
                !methodFilter ? 'bg-[#0096c7]' : 'bg-gray-200'
              }`}
              onPress={() => setMethodFilter(undefined)}
            >
              <Text className={!methodFilter ? 'text-white' : 'text-gray-700'}>All</Text>
            </TouchableOpacity>
            {(['khalti', 'stripe', 'paypal'] as PaymentMethod[]).map((method) => (
              <TouchableOpacity
                key={method}
                className={`px-3 py-1 rounded-full mr-2 mb-2 ${
                  methodFilter === method ? 'bg-[#0096c7]' : 'bg-gray-200'
                }`}
                onPress={() => setMethodFilter(method)}
              >
                <Text className={methodFilter === method ? 'text-white' : 'text-gray-700'}>
                  {getMethodLabel(method)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Error */}
      {error && (
        <View className="px-6 py-4">
          <View className="bg-red-50 border border-red-200 rounded-lg p-4">
            <Text className="text-red-800">{error}</Text>
          </View>
        </View>
      )}

      {/* Transactions List */}
      <View className="px-6 py-4">
        {transactions.length === 0 ? (
          <View className="items-center py-8">
            <Text className="text-gray-600">No transactions found</Text>
          </View>
        ) : (
          transactions.map((transaction) => (
            <View
              key={transaction._id}
              className="bg-white border border-gray-200 rounded-lg p-4 mb-3"
            >
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">
                    Rs. {transaction.amount.toFixed(2)}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {formatDate(transaction.createdAt)}
                  </Text>
                </View>
                <View
                  className={`px-2 py-1 rounded ${getStatusColor(transaction.status)}`}
                >
                  <Text className="text-xs font-semibold">
                    {transaction.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-sm text-gray-600">
                    {getMethodLabel(transaction.paymentMethod)}
                  </Text>
                  {transaction.receiptNumber && (
                    <Text className="text-xs text-gray-500 mt-1">
                      Receipt: {transaction.receiptNumber}
                    </Text>
                  )}
                </View>

                {transaction.status === 'completed' && transaction.receiptPath && (
                  <TouchableOpacity
                    className="flex-row items-center"
                    onPress={() => handleDownloadReceipt(transaction.bookingId)}
                  >
                    <Download size={16} color="#0096c7" />
                    <Text className="text-[#0096c7] text-sm ml-1">Receipt</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      {/* Pagination */}
      {totalPages > 1 && (
        <View className="px-6 py-4 flex-row justify-between items-center">
          <TouchableOpacity
            className={`flex-row items-center px-4 py-2 rounded ${
              page === 1 ? 'bg-gray-200' : 'bg-[#0096c7]'
            }`}
            onPress={() => setPage(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeft size={20} color={page === 1 ? '#9CA3AF' : '#FFFFFF'} />
            <Text className={page === 1 ? 'text-gray-400' : 'text-white'}>Previous</Text>
          </TouchableOpacity>

          <Text className="text-gray-600">
            Page {page} of {totalPages}
          </Text>

          <TouchableOpacity
            className={`flex-row items-center px-4 py-2 rounded ${
              page === totalPages ? 'bg-gray-200' : 'bg-[#0096c7]'
            }`}
            onPress={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            <Text className={page === totalPages ? 'text-gray-400' : 'text-white'}>Next</Text>
            <ChevronRight size={20} color={page === totalPages ? '#9CA3AF' : '#FFFFFF'} />
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

export default PaymentHistoryScreen;
