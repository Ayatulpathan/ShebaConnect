export type Language = 'bn' | 'en';

export type UserRole =
  | 'CUSTOMER'
  | 'INDIVIDUAL_PROVIDER'
  | 'COMPANY_OWNER'
  | 'COMPANY_STAFF'
  | 'TECHNICIAN'
  | 'ADMIN'
  | 'SUPPORT_AGENT';

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
