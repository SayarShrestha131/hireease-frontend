export interface Vehicle {
  _id: string;
  name: string;
  brand: string;
  model: string;
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

export interface VehicleFilters {
  search?: string;
  type?: string;
  fuelType?: string;
  transmission?: string;
  minPrice?: number;
  maxPrice?: number;
  seats?: number;
  available?: boolean;
}

export interface FilterOptions {
  types: string[];
  fuelTypes: string[];
  transmissions: string[];
  seats: number[];
  locations: string[];
  priceRange: {
    minPrice: number;
    maxPrice: number;
  };
}
