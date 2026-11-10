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

export type BookingStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'SCHEDULED'
  | 'PROVIDER_ASSIGNED'
  | 'ON_THE_WAY'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'DISPUTED';

export interface BookingAddress {
  area: string;
  addressLine: string;
  contactPhone: string;
  contactName: string;
}

export interface Booking {
  _id: string;
  id?: string;
  bookingNumber: string;
  customer: User | any;
  service: Service | any;
  provider?: User | any;
  organization?: Organization | any;
  technician?: User | any;
  status: BookingStatus;
  problemDescription: string;
  serviceAddress: BookingAddress;
  scheduledDate: string;
  preferredTimeSlot: string;
  pricingType: PricingType;
  basePrice: number;
  finalPrice: number;
  isPaid: boolean;
  paymentMethod: string;
  cancellationReason?: string;
  rejectionReason?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteItem {
  description: string;
  amount: number;
}

export interface Quote {
  _id: string;
  id?: string;
  booking: string;
  provider: User | any;
  organization?: Organization | any;
  amount: number;
  breakdown: QuoteItem[];
  notes?: string;
  validUntil: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
}

export interface BookingStatusHistory {
  _id: string;
  booking: string;
  previousStatus?: BookingStatus;
  newStatus: BookingStatus;
  changedBy: User | any;
  actorRole: UserRole;
  reason?: string;
  createdAt: string;
}

export type PaymentStatus =
  | 'PENDING'
  | 'COLLECTED_BY_PROVIDER'
  | 'CONFIRMED'
  | 'DISPUTED';

export type CommissionStatus =
  | 'PENDING_SETTLEMENT'
  | 'SETTLED'
  | 'WAIVED';

export interface CashPayment {
  _id: string;
  id?: string;
  booking: string;
  receiptNumber: string;
  customer: User | any;
  provider: User | any;
  organization?: Organization | any;
  amountExpected: number;
  amountCollected: number;
  status: PaymentStatus;
  collectedAt?: string;
  confirmedAt?: string;
  paymentMethod: string;
  notes?: string;
  disputeReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionEntry {
  _id: string;
  id?: string;
  booking: Booking | string | any;
  payment: string;
  provider: User | string | any;
  organization?: Organization | string | any;
  totalAmount: number;
  commissionRate: number;
  commissionAmount: number;
  providerEarnings: number;
  status: CommissionStatus;
  settlement?: string;
  settledAt?: string;
  waiverReason?: string;
  createdAt: string;
}

export interface CommissionSettlement {
  _id: string;
  id?: string;
  settlementNumber: string;
  provider?: User | string | any;
  organization?: Organization | string | any;
  amountSettled: number;
  entriesSettled: string[] | CommissionEntry[];
  settlementMethod: string;
  paymentReference?: string;
  recordedBy: User | string | any;
  notes?: string;
  createdAt: string;
}

export interface ProviderEarningsSummary {
  totalBookings: number;
  totalGrossRevenue: number;
  totalPlatformCommission: number;
  totalNetEarnings: number;
  pendingCommissionDue: number;
  settledCommission: number;
  commissionRate: number;
  recentEntries: CommissionEntry[];
  recentSettlements: CommissionSettlement[];
}

export interface CashReceipt {
  receiptNumber: string;
  bookingNumber: string;
  status: string;
  paymentMethod: string;
  amountExpected: number;
  amountCollected: number;
  currency: string;
  currencySymbol: string;
  collectedAt?: string;
  confirmedAt?: string;
  customer: {
    name: string;
    phone: string;
  };
  provider: {
    name: string;
    phone: string;
  };
  service: {
    name: {
      en: string;
      bn: string;
    };
    category: string;
  };
  serviceAddress: {
    area: string;
    addressLine: string;
  };
}

export type NotificationType =
  | 'BOOKING_STATUS_CHANGED'
  | 'NEW_QUOTE'
  | 'QUOTE_ACCEPTED'
  | 'QUOTE_REJECTED'
  | 'PAYMENT_COLLECTED'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_DISPUTED'
  | 'NEW_CHAT_MESSAGE'
  | 'SYSTEM_ALERT';

export interface Notification {
  _id: string;
  id?: string;
  recipient: string;
  sender?: User | any;
  booking?: Booking | any;
  title: {
    en: string;
    bn: string;
  };
  message: {
    en: string;
    bn: string;
  };
  type: NotificationType;
  isRead: boolean;
  readAt?: string;
  link?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  _id: string;
  id?: string;
  booking: string;
  sender: User | any;
  senderRole: string;
  content: string;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}


