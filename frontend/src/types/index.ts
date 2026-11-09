export type Language = 'bn' | 'en';

export type UserRole =
  | 'CUSTOMER'
  | 'INDIVIDUAL_PROVIDER'
  | 'COMPANY_OWNER'
  | 'COMPANY_STAFF'
  | 'TECHNICIAN'
  | 'ADMIN'
  | 'SUPPORT_AGENT';

export type PricingType =
  | 'FIXED_PRICE'
  | 'STARTING_PRICE'
  | 'HOURLY_PRICE'
  | 'INSPECTION_REQUIRED'
  | 'CUSTOM_QUOTATION';

export interface UserAddress {
  _id: string;
  label: string;
  area: string;
  addressLine: string;
  isDefault: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  isVerified: boolean;
  preferredLanguage: 'bn' | 'en';
  avatarUrl?: string;
  addresses: UserAddress[];
  createdAt: string;
}

export interface Category {
  _id: string;
  slug: string;
  name: {
    en: string;
    bn: string;
  };
  description: {
    en: string;
    bn: string;
  };
  icon: string;
  order: number;
  isActive: boolean;
}

export interface Service {
  _id: string;
  slug: string;
  name: {
    en: string;
    bn: string;
  };
  category: Category | string;
  description: {
    en: string;
    bn: string;
  };
  images: string[];
  basePrice: number; // In BDT (৳)
  pricingType: PricingType;
  estimatedDurationMinutes: number;
  requirements: string[];
  isActive: boolean;
}

export interface ProviderListing {
  _id: string;
  provider: User;
  service: Service;
  customPrice?: number;
  serviceAreas: string[];
  experienceYears: number;
  isActive: boolean;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken?: string;
  };
}

export interface HealthResponse {
  status: 'UP' | 'HEALTHY' | 'DEGRADED';
  timestamp: string;
  service: string;
  version?: string;
  uptimeSeconds?: number;
  environment?: string;
  database?: {
    isConnected: boolean;
    state: string;
  };
  zeroCostPolicy?: {
    budget: string;
    cloudR2Active: boolean;
    paidMapAPIsActive: boolean;
    paidPaymentGatewayActive: boolean;
  };
}

export interface DhakaArea {
  id: string;
  nameEn: string;
  nameBn: string;
  zone: 'North' | 'South';
}
