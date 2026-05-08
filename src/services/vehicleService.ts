/**
 * Vehicle Service
 * 
 * This module provides methods for interacting with the vehicle API endpoints.
 * Handles vehicle fetching, filtering, and search operations.
 */

import apiClient from './apiClient';
import { getErrorMessage } from '../utils/errorHandler';

/**
 * Vehicle interface matching backend response
 */
export interface Vehicle {
  _id: string;
  name: string;
  brand: string;
  vehicleModel: string;
  year: number;
  type: 'sedan' | 'suv' | 'hatchback' | 'truck' | 'van' | 'sports' | 'electric';
  fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  transmission: 'manual' | 'automatic';
  seats: number;
  pricePerDay: number;
  images: string[];
  features: string[];
  specifications: {
    engine?: string;
    power?: string;
    mileage?: string;
    color?: string;
  };
  availability: {
    isAvailable: boolean;
    location: string;
  };
  rating: number;
  totalReviews: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Vehicle filters interface
 */
export interface VehicleFilters {
  search?: string;
  type?: string;
  fuelType?: string;
  transmission?: string;
  minPrice?: number;
  maxPrice?: number;
  seats?: number;
  available?: boolean;
  sortBy?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * API Response interfaces
 */
export interface GetVehiclesResponse {
  success: boolean;
  data: {
    vehicles: Vehicle[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface GetVehicleResponse {
  success: boolean;
  data: {
    vehicle: Vehicle;
  };
}

export interface FilterOptionsResponse {
  success: boolean;
  data: {
    types: string[];
    fuelTypes: string[];
    transmissions: string[];
    seats: number[];
    locations: string[];
    priceRange: {
      minPrice: number;
      maxPrice: number;
    };
  };
}

/**
 * Vehicle Service Class
 * Provides methods for vehicle operations including fetching, filtering, and search
 */
class VehicleService {
  /**
   * Get all vehicles with optional filtering
   * 
   * @param filters - Optional filters for vehicles
   * @returns Promise resolving to vehicles list with pagination
   * @throws Error with user-friendly message on failure
   */
  async getVehicles(filters: VehicleFilters = {}): Promise<GetVehiclesResponse['data']> {
    try {
      console.log('[VehicleService] Fetching vehicles with filters:', filters);
      
      // Build query parameters
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
      
      const queryString = params.toString();
      const url = `/vehicles${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get<GetVehiclesResponse>(url);
      
      console.log('[VehicleService] ✅ Vehicles fetched successfully:', response.data.data.vehicles.length);
      
      return response.data.data;
    } catch (error) {
      console.error('[VehicleService] ❌ Error fetching vehicles:', error);
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get available vehicles count
   * 
   * @returns Promise resolving to count of available vehicles
   * @throws Error with user-friendly message on failure
   */
  async getAvailableVehiclesCount(): Promise<number> {
    try {
      console.log('[VehicleService] Fetching available vehicles count');
      
      const response = await this.getVehicles({ 
        available: true,
        limit: 1 // We only need the count, not the actual vehicles
      });
      
      console.log('[VehicleService] ✅ Available vehicles count:', response.pagination.total);
      
      return response.pagination.total;
    } catch (error) {
      console.error('[VehicleService] ❌ Error fetching available vehicles count:', error);
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get single vehicle by ID
   * 
   * @param vehicleId - ID of the vehicle to retrieve
   * @returns Promise resolving to vehicle details
   * @throws Error with user-friendly message on failure
   */
  async getVehicleById(vehicleId: string): Promise<Vehicle> {
    try {
      console.log('[VehicleService] Fetching vehicle by ID:', vehicleId);
      
      const response = await apiClient.get<GetVehicleResponse>(`/vehicles/${vehicleId}`);
      
      console.log('[VehicleService] ✅ Vehicle fetched successfully:', response.data.data.vehicle.name);
      
      return response.data.data.vehicle;
    } catch (error) {
      console.error('[VehicleService] ❌ Error fetching vehicle:', error);
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get filter options for vehicle filtering UI
   * 
   * @returns Promise resolving to available filter options
   * @throws Error with user-friendly message on failure
   */
  async getFilterOptions(): Promise<FilterOptionsResponse['data']> {
    try {
      console.log('[VehicleService] Fetching filter options');
      
      const response = await apiClient.get<FilterOptionsResponse>('/vehicles/filters/options');
      
      console.log('[VehicleService] ✅ Filter options fetched successfully');
      
      return response.data.data;
    } catch (error) {
      console.error('[VehicleService] ❌ Error fetching filter options:', error);
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Search vehicles by text query
   * 
   * @param query - Search query string
   * @param additionalFilters - Additional filters to apply
   * @returns Promise resolving to search results
   * @throws Error with user-friendly message on failure
   */
  async searchVehicles(
    query: string, 
    additionalFilters: Omit<VehicleFilters, 'search'> = {}
  ): Promise<GetVehiclesResponse['data']> {
    try {
      console.log('[VehicleService] Searching vehicles with query:', query);
      
      const filters: VehicleFilters = {
        search: query,
        ...additionalFilters
      };
      
      return await this.getVehicles(filters);
    } catch (error) {
      console.error('[VehicleService] ❌ Error searching vehicles:', error);
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get vehicles by type
   * 
   * @param type - Vehicle type to filter by
   * @param additionalFilters - Additional filters to apply
   * @returns Promise resolving to filtered vehicles
   * @throws Error with user-friendly message on failure
   */
  async getVehiclesByType(
    type: string,
    additionalFilters: Omit<VehicleFilters, 'type'> = {}
  ): Promise<GetVehiclesResponse['data']> {
    try {
      console.log('[VehicleService] Fetching vehicles by type:', type);
      
      const filters: VehicleFilters = {
        type,
        ...additionalFilters
      };
      
      return await this.getVehicles(filters);
    } catch (error) {
      console.error('[VehicleService] ❌ Error fetching vehicles by type:', error);
      throw new Error(getErrorMessage(error));
    }
  }

  /**
   * Get vehicles in price range
   * 
   * @param minPrice - Minimum price per day
   * @param maxPrice - Maximum price per day
   * @param additionalFilters - Additional filters to apply
   * @returns Promise resolving to filtered vehicles
   * @throws Error with user-friendly message on failure
   */
  async getVehiclesByPriceRange(
    minPrice: number,
    maxPrice: number,
    additionalFilters: Omit<VehicleFilters, 'minPrice' | 'maxPrice'> = {}
  ): Promise<GetVehiclesResponse['data']> {
    try {
      console.log('[VehicleService] Fetching vehicles by price range:', minPrice, '-', maxPrice);
      
      const filters: VehicleFilters = {
        minPrice,
        maxPrice,
        ...additionalFilters
      };
      
      return await this.getVehicles(filters);
    } catch (error) {
      console.error('[VehicleService] ❌ Error fetching vehicles by price range:', error);
      throw new Error(getErrorMessage(error));
    }
  }
}

// Export singleton instance
export default new VehicleService();