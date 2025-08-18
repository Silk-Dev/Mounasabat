// Core types for the unified platform
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'provider' | 'admin';
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Provider {
  id: string;
  userId: string;
  businessName: string;
  description: string;
  images: string[];
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  location: {
    address: string;
    city: string;
    coordinates: [number, number];
  };
  services: Service[];
  packages?: Package[];
  reviews?: Review[];
  contactEmail?: string;
  phoneNumber?: string;
  website?: string;
  coverageAreas: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Package {
  id: string;
  providerId: string;
  name: string;
  description?: string;
  totalPrice: number;
  discount?: number;
  isActive: boolean;
  items: PackageItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PackageItem {
  id: string;
  packageId: string;
  serviceId: string;
  service: Service;
  quantity: number;
  price: number;
}

export interface Review {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
  providerId?: string;
  serviceId?: string;
  rating: number;
  comment?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AvailabilitySlot {
  date: Date;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  bookingId?: string;
}

export interface Service {
  id: string;
  providerId: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  basePrice: number;
  priceUnit: string;
  images: string[];
  features: string[];
  isActive: boolean;
  location?: string;
  coverageArea?: string[];
  pricingType?: 'FIXED' | 'QUOTE';
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  id: string;
  customerId: string;
  providerId: string;
  serviceId: string;
  status: BookingStatus;
  eventDate: Date;
  eventDetails: {
    type: string;
    guestCount?: number;
    location?: string;
    specialRequests?: string;
  };
  pricing: {
    subtotal: number;
    taxes: number;
    fees: number;
    total: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type BookingStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'PAID'
  | 'DELIVERED';

export interface SearchFilters {
  query?: string;
  location?: string;
  category?: string;
  priceRange?: [number, number];
  rating?: number;
  availability?: {
    startDate: Date;
    endDate: Date;
  };
  serviceType?: string[];
}

export interface SearchResult {
  id: string;
  type: 'service' | 'provider';
  name: string;
  description: string;
  images: string[];
  rating: number;
  reviewCount: number;
  basePrice: number;
  location: string;
  provider: {
    id: string;
    name: string;
    isVerified: boolean;
  };
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export interface SearchResponse {
  success: boolean;
  data: SearchResult[];
  total: number;
  filters: SearchFilters;
  error?: string;
  message?: string;
}

// Booking Flow Types
export interface BookingFlow {
  step: 'selection' | 'details' | 'customer' | 'payment' | 'confirmation';
  selectedServices: SelectedService[];
  eventDetails: EventDetails;
  customerInfo: CustomerInfo;
  paymentInfo?: PaymentInfo;
  totalAmount: number;
}

export interface SelectedService {
  serviceId: string;
  providerId: string;
  service: Service;
  provider: Provider;
  quantity: number;
  customizations?: Record<string, any>;
  dateTime: Date;
  duration: number;
  price: number;
}

export interface EventDetails {
  type: string;
  date: Date;
  startTime: string;
  endTime: string;
  guestCount?: number;
  location?: string;
  specialRequests?: string;
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export interface PaymentInfo {
  method: 'card' | 'bank_transfer';
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  transactionId?: string;
  amount: number;
  currency: string;
}

export interface BookingConfirmation {
  bookingId: string;
  confirmationNumber: string;
  status: BookingStatus;
  services: SelectedService[];
  eventDetails: EventDetails;
  customerInfo: CustomerInfo;
  totalAmount: number;
  paymentStatus: string;
  createdAt: Date;
}

// Favorites and User Preferences Types
export interface Favorite {
  id: string;
  userId: string;
  providerId?: string;
  productId?: string;
  provider?: Provider;
  product?: Product;
  createdAt: Date;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  basePrice: number;
  images: string[];
  isCustomizable: boolean;
  isActive: boolean;
  inventory?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  id: string;
  userId: string;
  language: string;
  currency: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    marketing: boolean;
  };
  searchPreferences: {
    defaultLocation?: string;
    preferredCategories: string[];
    priceRange?: [number, number];
    sortBy: 'price' | 'rating' | 'distance' | 'popularity';
  };
  privacy: {
    profileVisible: boolean;
    showReviews: boolean;
    allowMessages: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface FavoriteItem {
  id: string;
  type: 'provider' | 'product';
  name: string;
  description?: string;
  images: string[];
  rating?: number;
  reviewCount?: number;
  basePrice: number;
  location?: string;
  category: string;
  provider?: {
    id: string;
    name: string;
    isVerified: boolean;
  };
  createdAt: Date;
}

export interface ComparisonItem extends FavoriteItem {
  features: string[];
  pricing: {
    basePrice: number;
    priceUnit?: string;
    additionalFees?: { name: string; amount: number }[];
  };
  availability?: boolean;
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
  };
}