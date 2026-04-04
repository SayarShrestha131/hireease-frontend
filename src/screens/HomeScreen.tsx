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
  Image,
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
  Calendar,
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { Vehicle, VehicleFilters, FilterOptions } from '../types/vehicle';
import apiClient from '../services/apiClient';
import { getCurrentApiUrl } from '../config/api';

interface HomeScreenProps {
  onNavigateToSettings: () => void;
  onNavigateToBookingForm: (vehicle: Vehicle) => void;
}

/**
 * HomeScreen Component
 * Vehicle catalog with search and filtering capabilities
 */
const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToSettings, onNavigateToBookingForm }) => {
  const { user } = useAuth();
  const { checkForNewVehicles } = useNotifications();

  // State
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

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

  // Check for new vehicles when screen becomes active
  useEffect(() => {
    console.log('[HomeScreen] Screen mounted, checking for new vehicles...');
    // Small delay to ensure context is ready
    const timer = setTimeout(() => {
      checkForNewVehicles();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []); // Empty dependency array to run only once on mount

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
      const vehiclesData = response.data.data.vehicles;
      console.log('[HomeScreen] Vehicles loaded:', vehiclesData.length);
      console.log('[HomeScreen] First vehicle price:', vehiclesData[0]?.pricePerDay);
      console.log('[HomeScreen] First vehicle images:', vehiclesData[0]?.images);
      console.log('[HomeScreen] First vehicle full data:', JSON.stringify(vehiclesData[0], null, 2));
      setVehicles(vehiclesData);
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

  const getVehicleImageUrl = (vehicle: Vehicle) => {
    if (vehicle.images && vehicle.images.length > 0) {
      const imageValue = vehicle.images[0];
      
      // Check if it's already a full URL (http:// or https://)
      if (imageValue.startsWith('http://') || imageValue.startsWith('https://')) {
        console.log('[HomeScreen] Using external URL for', vehicle.name, ':', imageValue);
        return imageValue;
      }
      
      
      // Otherwise, construct URL from API base
      const baseUrl = getCurrentApiUrl();
      const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
      const imageUrl = `${cleanBaseUrl}/vehicles/image/${imageValue}?t=${Date.now()}`;
      console.log('[HomeScreen] Using API URL for', vehicle.name, ':', imageUrl);
      return imageUrl;
    }
    console.log('[HomeScreen] No images for vehicle:', vehicle.name);
    return null;
  };

  const handleImageError = (vehicleId: string, vehicleName: string, error: any) => {
    console.error('[HomeScreen] Image load error for vehicle:', vehicleName, error.nativeEvent?.error || error);
    setImageErrors(prev => new Set(prev).add(vehicleId));
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="bg-[#0096c7] px-6 py-6 pb-4">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-1">
            <Text className="text-white text-sm opacity-90">Welcome back,</Text>
            <Text className="text-white text-xl font-bold mt-1">
              {user?.username || user?.email?.split('@')[0] || 'User'}
            </Text>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={onNavigateToSettings}
              className="bg-white/20 rounded-full p-3"
              activeOpacity={0.7}
            >
              <Settings size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
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
          vehicles.map((vehicle) => {
            const imageUrl = getVehicleImageUrl(vehicle);
            
            return (
              <View key={vehicle._id} className="bg-white rounded-lg overflow-hidden mb-4 shadow-sm">
                {/* Vehicle Image */}
                {imageUrl && !imageErrors.has(vehicle._id) ? (
                  <Image
                    source={{
                      uri: imageUrl,
                      headers: {
                        'Accept': 'image/*',
                      }
                    }}
                    className="w-full h-48"
                    style={{
                      width: '100%',
                      height: 192,
                      backgroundColor: '#E5E7EB'
                    }}
                    resizeMode="cover"
                    onError={(error) => handleImageError(vehicle._id, vehicle.name, error)}
                    onLoadStart={() => {
                      console.log('[HomeScreen] Loading image for:', vehicle.name);
                    }}
                    onLoad={() => {
                      console.log('[HomeScreen] Image loaded successfully for:', vehicle.name);
                    }}
                  />
                ) : (
                  <View className="w-full h-48 bg-gray-200 items-center justify-center">
                    <SettingsGear size={48} color="#9CA3AF" />
                    <Text className="text-gray-500 mt-2 text-sm">No Image</Text>
                  </View>
                )}

              <View className="p-4">
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
                  <View className="flex-1 mr-3">
                    <Text className="text-2xl font-bold text-[#0096c7]" numberOfLines={1}>
                      Rs. {vehicle.pricePerDay?.toLocaleString() || vehicle.pricePerDay || 'N/A'}
                    </Text>
                    <Text className="text-xs text-gray-600">/day</Text>
                  </View>
                  <TouchableOpacity
                    className={`rounded-lg px-6 py-3 ${
                      vehicle.availability.isAvailable ? 'bg-[#0096c7]' : 'bg-gray-300'
                    }`}
                    disabled={!vehicle.availability.isAvailable}
                    onPress={() => vehicle.availability.isAvailable && onNavigateToBookingForm(vehicle)}
                  >
                    <Text className="text-white font-semibold">
                      {vehicle.availability.isAvailable ? 'Book Now' : 'Unavailable'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })
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
