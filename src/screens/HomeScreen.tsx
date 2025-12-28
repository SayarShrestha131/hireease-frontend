/**
 * Home Screen - Vehicle Management System
 * 
 * Comprehensive vehicle catalog with advanced search and filtering
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Settings,
  Search,
  Filter,
  X,
  Star,
  MapPin,
  Users,
  Fuel,
  Settings as SettingsGear,
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { Vehicle, VehicleFilters, FilterOptions } from '../types/vehicle';
import apiClient from '../services/apiClient';

interface HomeScreenProps {
  onNavigateToSettings: () => void;
}

/**
 * HomeScreen Component
 * Vehicle catalog with search and filtering capabilities
 */
const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToSettings }) => {
  const { user } = useAuth();

  // State
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);

  // Filters
  const [filters, setFilters] = useState<VehicleFilters>({
    search: '',
    type: '',
    fuelType: '',
    transmission: '',
    available: true,
  });

  // Fetch vehicles on mount and when filters change
  useEffect(() => {
    fetchVehicles();
  }, [filters]);

  // Fetch filter options on mount
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.search) params.append('search', filters.search);
      if (filters.type) params.append('type', filters.type);
      if (filters.fuelType) params.append('fuelType', filters.fuelType);
      if (filters.transmission) params.append('transmission', filters.transmission);
      if (filters.available !== undefined) params.append('available', String(filters.available));

      const response = await apiClient.get(`/vehicles?${params.toString()}`);
      setVehicles(response.data.data.vehicles);
    } catch (error: any) {
      console.error('Error fetching vehicles:', error);
      
      // Show user-friendly error message
      if (error.code === 'ECONNABORTED') {
        console.error('Request timeout - Backend might be slow or not responding');
      } else if (error.message === 'Network Error') {
        console.error('Network Error - Make sure:');
        console.error('1. Backend server is running (npm run dev in backend folder)');
        console.error('2. Backend is accessible at:', apiClient.defaults.baseURL);
        console.error('3. Check Windows Firewall settings');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await apiClient.get('/vehicles/filters/options');
      setFilterOptions(response.data.data);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const handleSearch = () => {
    setFilters({ ...filters, search: searchQuery });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      fuelType: '',
      transmission: '',
      available: true,
    });
    setSearchQuery('');
  };

  const applyFilter = (key: keyof VehicleFilters, value: any) => {
    setFilters({ ...filters, [key]: value });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-[#0096c7] px-6 py-6 pb-4">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-1">
            <Text className="text-white text-sm opacity-90">Welcome back,</Text>
            <Text className="text-white text-xl font-bold mt-1">
              {user?.email?.split('@')[0] || 'User'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onNavigateToSettings}
            className="bg-white/20 rounded-full p-3"
            activeOpacity={0.7}
          >
            <Settings size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-white rounded-lg px-4 py-3">
          <Search size={20} color="#6B7280" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            placeholder="Search vehicles..."
            className="flex-1 ml-3 text-base text-gray-800"
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity
            onPress={() => setShowFilters(true)}
            className="bg-[#0096c7] rounded-lg p-2 ml-2"
          >
            <Filter size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Active Filters */}
      {(filters.type || filters.fuelType || filters.transmission) && (
        <View className="px-6 py-3 bg-white border-b border-gray-200">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row items-center">
              {filters.type && (
                <View className="bg-[#0096c7] rounded-full px-3 py-1 mr-2 flex-row items-center">
                  <Text className="text-white text-xs capitalize">{filters.type}</Text>
                  <TouchableOpacity onPress={() => applyFilter('type', '')}>
                    <X size={14} color="#FFFFFF" className="ml-1" />
                  </TouchableOpacity>
                </View>
              )}
              {filters.fuelType && (
                <View className="bg-[#0096c7] rounded-full px-3 py-1 mr-2 flex-row items-center">
                  <Text className="text-white text-xs capitalize">{filters.fuelType}</Text>
                  <TouchableOpacity onPress={() => applyFilter('fuelType', '')}>
                    <X size={14} color="#FFFFFF" className="ml-1" />
                  </TouchableOpacity>
                </View>
              )}
              {filters.transmission && (
                <View className="bg-[#0096c7] rounded-full px-3 py-1 mr-2 flex-row items-center">
                  <Text className="text-white text-xs capitalize">{filters.transmission}</Text>
                  <TouchableOpacity onPress={() => applyFilter('transmission', '')}>
                    <X size={14} color="#FFFFFF" className="ml-1" />
                  </TouchableOpacity>
                </View>
              )}
              <TouchableOpacity onPress={clearFilters} className="ml-2">
                <Text className="text-red-600 text-xs font-semibold">Clear All</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Vehicle List */}
      <ScrollView className="flex-1 px-6 py-4">
        {loading ? (
          <View className="py-20">
            <ActivityIndicator size="large" color="#0096c7" />
            <Text className="text-center text-gray-600 mt-4">Loading vehicles...</Text>
          </View>
        ) : vehicles.length === 0 ? (
          <View className="py-20">
            <Text className="text-center text-gray-600 text-lg">No vehicles found</Text>
            <Text className="text-center text-gray-500 mt-2">Try adjusting your filters</Text>
          </View>
        ) : (
          vehicles.map((vehicle) => (
            <View key={vehicle._id} className="bg-white rounded-lg p-4 mb-4 shadow-sm">
              {/* Vehicle Header */}
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-800">{vehicle.name}</Text>
                  <Text className="text-sm text-gray-600 mt-1">
                    {vehicle.brand} • {vehicle.year}
                  </Text>
                </View>
                <View
                  className={`px-3 py-1 rounded-full ${
                    vehicle.availability.isAvailable ? 'bg-green-100' : 'bg-red-100'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      vehicle.availability.isAvailable ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {vehicle.availability.isAvailable ? 'Available' : 'Booked'}
                  </Text>
                </View>
              </View>

              {/* Vehicle Details */}
              <View className="flex-row items-center mb-3 flex-wrap">
                <View className="flex-row items-center mr-4 mb-2">
                  <Fuel size={14} color="#6B7280" />
                  <Text className="text-xs text-gray-600 ml-1 capitalize">{vehicle.fuelType}</Text>
                </View>
                <View className="flex-row items-center mr-4 mb-2">
                  <SettingsGear size={14} color="#6B7280" />
                  <Text className="text-xs text-gray-600 ml-1 capitalize">
                    {vehicle.transmission}
                  </Text>
                </View>
                <View className="flex-row items-center mr-4 mb-2">
                  <Users size={14} color="#6B7280" />
                  <Text className="text-xs text-gray-600 ml-1">{vehicle.seats} Seats</Text>
                </View>
                <View className="flex-row items-center mb-2">
                  <MapPin size={14} color="#6B7280" />
                  <Text className="text-xs text-gray-600 ml-1">
                    {vehicle.availability.location}
                  </Text>
                </View>
              </View>

              {/* Rating */}
              {vehicle.rating > 0 && (
                <View className="flex-row items-center mb-3">
                  <Star size={14} color="#F59E0B" fill="#F59E0B" />
                  <Text className="text-sm text-gray-700 ml-1">
                    {vehicle.rating.toFixed(1)} ({vehicle.totalReviews} reviews)
                  </Text>
                </View>
              )}

              {/* Price and Book Button */}
              <View className="flex-row items-center justify-between pt-3 border-t border-gray-200">
                <View>
                  <Text className="text-2xl font-bold text-[#0096c7]">
                    Rs. {vehicle.pricePerDay.toLocaleString()}
                  </Text>
                  <Text className="text-xs text-gray-600">/day</Text>
                </View>
                <TouchableOpacity
                  className={`rounded-lg px-6 py-3 ${
                    vehicle.availability.isAvailable ? 'bg-[#0096c7]' : 'bg-gray-300'
                  }`}
                  disabled={!vehicle.availability.isAvailable}
                >
                  <Text className="text-white font-semibold">
                    {vehicle.availability.isAvailable ? 'Book Now' : 'Unavailable'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal visible={showFilters} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
            {/* Modal Header */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-800">Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Vehicle Type */}
              <View className="mb-6">
                <Text className="text-sm font-semibold text-gray-700 mb-3">Vehicle Type</Text>
                <View className="flex-row flex-wrap">
                  {filterOptions?.types.map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => applyFilter('type', filters.type === type ? '' : type)}
                      className={`px-4 py-2 rounded-full mr-2 mb-2 ${
                        filters.type === type ? 'bg-[#0096c7]' : 'bg-gray-200'
                      }`}
                    >
                      <Text
                        className={`text-sm capitalize ${
                          filters.type === type ? 'text-white font-semibold' : 'text-gray-700'
                        }`}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Fuel Type */}
              <View className="mb-6">
                <Text className="text-sm font-semibold text-gray-700 mb-3">Fuel Type</Text>
                <View className="flex-row flex-wrap">
                  {filterOptions?.fuelTypes.map((fuelType) => (
                    <TouchableOpacity
                      key={fuelType}
                      onPress={() =>
                        applyFilter('fuelType', filters.fuelType === fuelType ? '' : fuelType)
                      }
                      className={`px-4 py-2 rounded-full mr-2 mb-2 ${
                        filters.fuelType === fuelType ? 'bg-[#0096c7]' : 'bg-gray-200'
                      }`}
                    >
                      <Text
                        className={`text-sm capitalize ${
                          filters.fuelType === fuelType
                            ? 'text-white font-semibold'
                            : 'text-gray-700'
                        }`}
                      >
                        {fuelType}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Transmission */}
              <View className="mb-6">
                <Text className="text-sm font-semibold text-gray-700 mb-3">Transmission</Text>
                <View className="flex-row flex-wrap">
                  {filterOptions?.transmissions.map((transmission) => (
                    <TouchableOpacity
                      key={transmission}
                      onPress={() =>
                        applyFilter(
                          'transmission',
                          filters.transmission === transmission ? '' : transmission
                        )
                      }
                      className={`px-4 py-2 rounded-full mr-2 mb-2 ${
                        filters.transmission === transmission ? 'bg-[#0096c7]' : 'bg-gray-200'
                      }`}
                    >
                      <Text
                        className={`text-sm capitalize ${
                          filters.transmission === transmission
                            ? 'text-white font-semibold'
                            : 'text-gray-700'
                        }`}
                      >
                        {transmission}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Availability */}
              <View className="mb-6">
                <Text className="text-sm font-semibold text-gray-700 mb-3">Availability</Text>
                <TouchableOpacity
                  onPress={() => applyFilter('available', !filters.available)}
                  className="flex-row items-center"
                >
                  <View
                    className={`w-12 h-6 rounded-full ${
                      filters.available ? 'bg-[#0096c7]' : 'bg-gray-300'
                    }`}
                  >
                    <View
                      className={`w-5 h-5 rounded-full bg-white mt-0.5 ${
                        filters.available ? 'ml-6' : 'ml-0.5'
                      }`}
                    />
                  </View>
                  <Text className="text-sm text-gray-700 ml-3">Show only available vehicles</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Apply Button */}
            <TouchableOpacity
              onPress={() => setShowFilters(false)}
              className="bg-[#0096c7] rounded-lg py-4 mt-4"
            >
              <Text className="text-white text-center font-semibold text-base">
                Apply Filters
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default HomeScreen;
