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
