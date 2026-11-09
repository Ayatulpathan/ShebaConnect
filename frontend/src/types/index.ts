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

export type VerificationStatus =
  | 'UNVERIFIED'
  | 'PENDING_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'SUSPENDED';

export type OrganizationApprovalStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export interface UserAddress {
  _id?: string;
  label: string;
  area: string;
  addressLine: string;
  isDefault: boolean;
  createdAt?: string;
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

export interface ProviderProfile {
  _id: string;
  user: string | User;
  bio?: string;
  skills: string[];
  experienceYears: number;
  emergencyContact?: string;
  nidNumber?: string;
  nidFrontUrl?: string;
  nidBackUrl?: string;
  verificationStatus: VerificationStatus;
  verificationRejectionReason?: string;
  totalCompletedJobs: number;
  ratingAverage: number;
  ratingCount: number;
}

export interface Organization {
  _id: string;
  owner: string | User;
  businessName: string;
  tradeLicenseNumber?: string;
  businessAddress?: UserAddress;
  contactEmail?: string;
  contactPhone: string;
  serviceAreas: string[];
  verificationStatus: VerificationStatus;
  isActive: boolean;
}

export interface OrganizationMember {
  _id: string;
  organization: string | Organization;
  user: User;
  role: 'COMPANY_STAFF' | 'TECHNICIAN';
  isActive: boolean;
}

export interface AvailabilitySlot {
  _id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
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
