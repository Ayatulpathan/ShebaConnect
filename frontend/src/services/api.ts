import axios from 'axios';
import type {
  HealthResponse,
  AuthResponse,
  Category,
  Service,
  ProviderProfile,
  AvailabilitySlot,
  Organization,
  OrganizationMember,
  Booking,
  BookingAddress,
  Quote,
  BookingStatusHistory,
  CashPayment,
  CommissionEntry,
  CommissionSettlement,
  ProviderEarningsSummary,
  CashReceipt,
  Notification,
  ChatMessage,
  Review,
  CreateReviewDTO,
  ServiceReviewsResponse,
} from '../types/index.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let currentAccessToken: string | null = null;

export const setApiAccessToken = (token: string | null) => {
  currentAccessToken = token;
};

// Request interceptor to attach Bearer token
apiClient.interceptors.request.use(
  (config) => {
    if (currentAccessToken && config.headers) {
      config.headers.Authorization = `Bearer ${currentAccessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to attempt refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/register') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await axios.post<AuthResponse>(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data.data.accessToken;
        setApiAccessToken(newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshErr) {
        setApiAccessToken(null);
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export const checkHealth = async (): Promise<HealthResponse> => {
  const response = await apiClient.get<HealthResponse>('/health');
  return response.data;
};

// Marketplace API
export const fetchCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get<{ success: boolean; data: { categories: Category[] } }>(
    '/categories'
  );
  return response.data.data.categories;
};

export const fetchServices = async (categoryId?: string): Promise<Service[]> => {
  const url = categoryId ? `/services?category=${categoryId}` : '/services';
  const response = await apiClient.get<{ success: boolean; data: { services: Service[] } }>(url);
  return response.data.data.services;
};

export const searchServices = async (params: {
  q?: string;
  category?: string;
  area?: string;
  minPrice?: number;
  maxPrice?: number;
}): Promise<{ services: Service[]; pagination: { total: number } }> => {
  const response = await apiClient.get<{
    success: boolean;
    data: { services: Service[]; pagination: { total: number } };
  }>('/services/search', { params });
  return response.data.data;
};

// Provider Operations
export const fetchMyProviderProfile = async (): Promise<ProviderProfile> => {
  const response = await apiClient.get<{ success: boolean; data: { profile: ProviderProfile } }>(
    '/providers/operations/profile'
  );
  return response.data.data.profile;
};

export const updateMyProviderProfile = async (data: {
  bio?: string;
  skills?: string[];
  experienceYears?: number;
  emergencyContact?: string;
}): Promise<ProviderProfile> => {
  const response = await apiClient.patch<{ success: boolean; data: { profile: ProviderProfile } }>(
    '/providers/operations/profile',
    data
  );
  return response.data.data.profile;
};

export const submitProviderVerification = async (data: {
  nidNumber: string;
  nidFrontUrl?: string;
  nidBackUrl?: string;
}): Promise<ProviderProfile> => {
  const response = await apiClient.post<{ success: boolean; data: { profile: ProviderProfile } }>(
    '/providers/operations/verification',
    data
  );
  return response.data.data.profile;
};

export const fetchMyAvailability = async (): Promise<AvailabilitySlot[]> => {
  const response = await apiClient.get<{
    success: boolean;
    data: { availabilitySlots: AvailabilitySlot[] };
  }>('/providers/operations/availability');
  return response.data.data.availabilitySlots;
};

export const updateMyAvailability = async (
  slots: AvailabilitySlot[]
): Promise<AvailabilitySlot[]> => {
  const response = await apiClient.put<{
    success: boolean;
    data: { availabilitySlots: AvailabilitySlot[] };
  }>('/providers/operations/availability', { slots });
  return response.data.data.availabilitySlots;
};

// Company Operations
export const createCompany = async (data: {
  businessName: string;
  tradeLicenseNumber?: string;
  contactPhone: string;
  contactEmail?: string;
  serviceAreas: string[];
}): Promise<Organization> => {
  const response = await apiClient.post<{
    success: boolean;
    data: { organization: Organization };
  }>('/companies', data);
  return response.data.data.organization;
};

export const fetchMyCompany = async (): Promise<Organization | null> => {
  const response = await apiClient.get<{
    success: boolean;
    data: { organization: Organization | null };
  }>('/companies/my');
  return response.data.data.organization;
};

export const updateMyCompany = async (
  orgId: string,
  data: Partial<Organization>
): Promise<Organization> => {
  const response = await apiClient.patch<{
    success: boolean;
    data: { organization: Organization };
  }>(`/companies/${orgId}`, data);
  return response.data.data.organization;
};

export const fetchCompanyMembers = async (orgId: string): Promise<OrganizationMember[]> => {
  const response = await apiClient.get<{
    success: boolean;
    data: { members: OrganizationMember[] };
  }>(`/companies/${orgId}/members`);
  return response.data.data.members;
};

export const addCompanyMember = async (
  orgId: string,
  data: {
    userId: string;
    role: 'COMPANY_STAFF' | 'TECHNICIAN';
  }
): Promise<OrganizationMember> => {
  const response = await apiClient.post<{
    success: boolean;
    data: { member: OrganizationMember };
  }>(`/companies/${orgId}/members`, data);
  return response.data.data.member;
};

export const removeCompanyMember = async (
  orgId: string,
  memberId: string
): Promise<void> => {
  await apiClient.delete(`/companies/${orgId}/members/${memberId}`);
};

// Booking & Quotation Operations
export const createBooking = async (data: {
  serviceId: string;
  providerId?: string;
  organizationId?: string;
  problemDescription: string;
  serviceAddress: BookingAddress;
  scheduledDate: string;
  preferredTimeSlot: string;
}): Promise<Booking> => {
  const response = await apiClient.post<{ success: boolean; data: { booking: Booking } }>(
    '/bookings',
    data
  );
  return response.data.data.booking;
};

export const fetchBooking = async (bookingId: string): Promise<Booking> => {
  const response = await apiClient.get<{ success: boolean; data: { booking: Booking } }>(
    `/bookings/${bookingId}`
  );
  return response.data.data.booking;
};

export const fetchBookings = async (params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ bookings: Booking[]; pagination: { total: number; page: number; limit: number } }> => {
  const response = await apiClient.get<{
    success: boolean;
    data: { bookings: Booking[]; pagination: { total: number; page: number; limit: number } };
  }>('/bookings', { params });
  return response.data.data;
};

export const transitionBookingStatus = async (
  bookingId: string,
  data: {
    status: string;
    reason?: string;
    technicianId?: string;
    quoteId?: string;
    finalPrice?: number;
  }
): Promise<Booking> => {
  const response = await apiClient.patch<{
    success: boolean;
    data: { booking: Booking };
  }>(`/bookings/${bookingId}/status`, data);
  return response.data.data.booking;
};

export const fetchBookingHistory = async (
  bookingId: string
): Promise<BookingStatusHistory[]> => {
  const response = await apiClient.get<{
    success: boolean;
    data: { history: BookingStatusHistory[] };
  }>(`/bookings/${bookingId}/history`);
  return response.data.data.history;
};

export const createQuote = async (
  bookingId: string,
  data: {
    amount: number;
    breakdown?: Array<{ description: string; amount: number }>;
    notes?: string;
    validUntil: string;
  }
): Promise<Quote> => {
  const response = await apiClient.post<{ success: boolean; data: { quote: Quote } }>(
    `/bookings/${bookingId}/quotes`,
    data
  );
  return response.data.data.quote;
};

export const fetchQuotes = async (bookingId: string): Promise<Quote[]> => {
  const response = await apiClient.get<{ success: boolean; data: { quotes: Quote[] } }>(
    `/bookings/${bookingId}/quotes`
  );
  return response.data.data.quotes;
};

export const respondToQuote = async (
  quoteId: string,
  action: 'ACCEPT' | 'REJECT'
): Promise<{ quote: Quote; booking?: Booking }> => {
  const response = await apiClient.post<{
    success: boolean;
    data: { quote: Quote; booking?: Booking };
  }>(`/bookings/quotes/${quoteId}/respond`, { action });
  return response.data.data;
};

// --- Phase 6: Cash Payment & Commission Engine ---

export const fetchBookingPayment = async (
  bookingId: string
): Promise<{
  payment: CashPayment;
  commissionEntry?: CommissionEntry | null;
  booking: Booking;
}> => {
  const response = await apiClient.get<{
    success: boolean;
    data: {
      payment: CashPayment;
      commissionEntry?: CommissionEntry | null;
      booking: Booking;
    };
  }>(`/payments/bookings/${bookingId}`);
  return response.data.data;
};

export const recordCashCollection = async (
  bookingId: string,
  amountCollected: number,
  notes?: string
): Promise<CashPayment> => {
  const response = await apiClient.post<{
    success: boolean;
    data: { payment: CashPayment };
  }>(`/payments/bookings/${bookingId}/collect`, { amountCollected, notes });
  return response.data.data.payment;
};

export const confirmCashPayment = async (
  bookingId: string,
  notes?: string
): Promise<{ payment: CashPayment; commissionEntry: CommissionEntry }> => {
  const response = await apiClient.post<{
    success: boolean;
    data: { payment: CashPayment; commissionEntry: CommissionEntry };
  }>(`/payments/bookings/${bookingId}/confirm`, { notes });
  return response.data.data;
};

export const disputeCashPayment = async (
  bookingId: string,
  reason: string
): Promise<CashPayment> => {
  const response = await apiClient.post<{
    success: boolean;
    data: { payment: CashPayment };
  }>(`/payments/bookings/${bookingId}/dispute`, { reason });
  return response.data.data.payment;
};

export const fetchBookingReceipt = async (
  bookingId: string
): Promise<CashReceipt> => {
  const response = await apiClient.get<{
    success: boolean;
    data: { receipt: CashReceipt };
  }>(`/payments/bookings/${bookingId}/receipt`);
  return response.data.data.receipt;
};

export const fetchProviderEarningsSummary = async (): Promise<ProviderEarningsSummary> => {
  const response = await apiClient.get<{
    success: boolean;
    data: ProviderEarningsSummary;
  }>('/payments/provider/summary');
  return response.data.data;
};

export const recordCommissionSettlement = async (data: {
  providerId?: string;
  organizationId?: string;
  entryIds: string[];
  amountSettled: number;
  settlementMethod?: string;
  paymentReference?: string;
  notes?: string;
}): Promise<{ settlement: CommissionSettlement; settledCount: number }> => {
  const response = await apiClient.post<{
    success: boolean;
    data: { settlement: CommissionSettlement; settledCount: number };
  }>('/payments/admin/settle', data);
  return response.data.data;
};

export const fetchAdminFinancialReport = async (): Promise<any> => {
  const response = await apiClient.get<{ success: boolean; data: any }>(
    '/payments/admin/report'
  );
  return response.data.data;
};

// --- Phase 7: Real-Time Communication & Notifications ---

export const fetchNotifications = async (params?: {
  isRead?: boolean;
  page?: number;
  limit?: number;
}): Promise<{
  notifications: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}> => {
  const response = await apiClient.get<{
    success: boolean;
    data: {
      notifications: Notification[];
      total: number;
      unreadCount: number;
      page: number;
      limit: number;
    };
  }>('/notifications', { params });
  return response.data.data;
};

export const fetchUnreadNotificationCount = async (): Promise<number> => {
  const response = await apiClient.get<{
    success: boolean;
    data: { unreadCount: number };
  }>('/notifications/unread-count');
  return response.data.data.unreadCount;
};

export const markNotificationAsRead = async (
  notificationId: string
): Promise<Notification> => {
  const response = await apiClient.patch<{
    success: boolean;
    data: { notification: Notification };
  }>(`/notifications/${notificationId}/read`);
  return response.data.data.notification;
};

export const markAllNotificationsAsRead = async (): Promise<number> => {
  const response = await apiClient.patch<{
    success: boolean;
    data: { modifiedCount: number };
  }>('/notifications/read-all');
  return response.data.data.modifiedCount;
};

export const fetchBookingMessages = async (
  bookingId: string,
  limit?: number
): Promise<ChatMessage[]> => {
  const response = await apiClient.get<{
    success: boolean;
    data: { messages: ChatMessage[] };
  }>(`/chat/bookings/${bookingId}`, { params: { limit } });
  return response.data.data.messages;
};

export const sendBookingMessage = async (
  bookingId: string,
  content: string
): Promise<ChatMessage> => {
  const response = await apiClient.post<{
    success: boolean;
    data: { message: ChatMessage };
  }>(`/chat/bookings/${bookingId}`, { content });
  return response.data.data.message;
};

export const markBookingMessagesAsRead = async (
  bookingId: string
): Promise<number> => {
  const response = await apiClient.patch<{
    success: boolean;
    data: { modifiedCount: number };
  }>(`/chat/bookings/${bookingId}/read`);
  return response.data.data.modifiedCount;
};

// ==================== Phase 8: Reviews & Ratings ====================

export const createReview = async (data: CreateReviewDTO): Promise<Review> => {
  const response = await apiClient.post<{
    success: boolean;
    data: { review: Review };
  }>('/reviews', data);
  return response.data.data.review;
};

export const replyToReview = async (
  reviewId: string,
  reply: string
): Promise<Review> => {
  const response = await apiClient.post<{
    success: boolean;
    data: { review: Review };
  }>(`/reviews/${reviewId}/reply`, { reply });
  return response.data.data.review;
};

export const fetchBookingReview = async (
  bookingId: string
): Promise<Review | null> => {
  const response = await apiClient.get<{
    success: boolean;
    data: { review: Review | null };
  }>(`/reviews/booking/${bookingId}`);
  return response.data.data.review;
};

export const fetchServiceReviews = async (
  serviceId: string,
  page = 1,
  limit = 10
): Promise<ServiceReviewsResponse> => {
  const response = await apiClient.get<{
    success: boolean;
    data: ServiceReviewsResponse;
  }>(`/reviews/service/${serviceId}`, { params: { page, limit } });
  return response.data.data;
};

export const fetchProviderReviews = async (
  providerId: string,
  page = 1,
  limit = 10
): Promise<ServiceReviewsResponse> => {
  const response = await apiClient.get<{
    success: boolean;
    data: ServiceReviewsResponse;
  }>(`/reviews/provider/${providerId}`, { params: { page, limit } });
  return response.data.data;
};

export const updateReviewStatus = async (
  reviewId: string,
  status: 'ACTIVE' | 'FLAGGED' | 'HIDDEN'
): Promise<Review> => {
  const response = await apiClient.patch<{
    success: boolean;
    data: { review: Review };
  }>(`/reviews/${reviewId}/status`, { status });
  return response.data.data.review;
};



