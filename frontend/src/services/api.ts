import axios from 'axios';
import type { HealthResponse, AuthResponse, Category, Service } from '../types/index.js';

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
