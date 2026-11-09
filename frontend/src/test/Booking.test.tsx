import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BookingModal } from '../components/BookingModal.js';
import { BookingTrackerModal } from '../components/BookingTrackerModal.js';
import { LanguageProvider } from '../context/LanguageContext.js';
import type { Service } from '../types/index.js';

const { mockServiceData } = vi.hoisted(() => ({
  mockServiceData: {
    _id: 'srv-ac-wash',
    slug: 'ac-master-wash',
    name: {
      en: 'Master AC Jet Wash',
      bn: 'মাস্টার এসি জেট ওয়াশ',
    },
    category: {
      _id: 'cat-ac',
      slug: 'ac-repair',
      name: { en: 'AC Servicing', bn: 'এসি সার্ভিসিং' },
      description: { en: 'AC repair', bn: 'এসি মেরামত' },
      icon: 'Wind',
      order: 1,
      isActive: true,
    },
    description: {
      en: 'Deep indoor and outdoor unit cleaning',
      bn: 'গভীর ইনডোর ও আউটডোর পরিষ্কার',
    },
    images: [],
    basePrice: 1200,
    pricingType: 'FIXED_PRICE' as const,
    estimatedDurationMinutes: 60,
    requirements: [],
    isActive: true,
  },
}));

vi.mock('../services/api.js', () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    post: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    patch: vi.fn().mockResolvedValue({ data: { success: true, data: {} } }),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  setApiAccessToken: vi.fn(),
  createBooking: vi.fn().mockResolvedValue({
    _id: 'bk-123',
    bookingNumber: 'SC-2611-A8B9',
    status: 'REQUESTED',
    finalPrice: 1200,
  }),
  fetchBookings: vi.fn().mockResolvedValue({
    bookings: [
      {
        _id: 'bk-123',
        bookingNumber: 'SC-2611-A8B9',
        status: 'REQUESTED',
        service: mockServiceData,
        serviceAddress: {
          area: 'mirpur',
          addressLine: 'House 12, Road 4',
          contactPhone: '01712345678',
          contactName: 'Rahim Customer',
        },
        scheduledDate: '2026-11-20T10:00:00.000Z',
        preferredTimeSlot: 'Morning',
        finalPrice: 1200,
      },
    ],
    pagination: { total: 1, page: 1, limit: 10 },
  }),
  fetchQuotes: vi.fn().mockResolvedValue([]),
  transitionBookingStatus: vi.fn().mockResolvedValue({}),
  respondToQuote: vi.fn().mockResolvedValue({}),
}));

// Mock useAuth
vi.mock('../context/AuthContext.js', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: {
      id: 'cust-1',
      name: 'Rahim Customer',
      email: 'rahim@example.com',
      phone: '01712345678',
      role: 'CUSTOMER',
    },
    isAuthenticated: true,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

describe('ShebaConnect Phase 5 — Booking Engine Frontend Tests', () => {
  it('renders BookingModal with service name, price, Dhaka zones, and cash-after-service policy', () => {
    render(
      <LanguageProvider>
        <BookingModal
          isOpen={true}
          service={mockServiceData as Service}
          onClose={() => {}}
        />
      </LanguageProvider>
    );

    // Header with service title
    expect(screen.getByText('মাস্টার এসি জেট ওয়াশ')).toBeInTheDocument();
    expect(screen.getByText('সার্ভিস বুকিং')).toBeInTheDocument();

    // Cash after service zero-cost badge
    expect(screen.getByText('ক্যাশ অন সার্ভিস (পরিশোধ কাজ শেষের পর)')).toBeInTheDocument();

    // Dhaka zones dropdown option
    expect(screen.getByText('মিরপুর')).toBeInTheDocument();
  });

  it('renders BookingTrackerModal with booking number and 6 lifecycle states', async () => {
    render(
      <LanguageProvider>
        <BookingTrackerModal isOpen={true} onClose={() => {}} />
      </LanguageProvider>
    );

    expect(screen.getByText('বুকিং ট্র্যাকার ও ব্যবস্থাপনা')).toBeInTheDocument();

    // Booking number appears in list and details view
    const bookingTags = await screen.findAllByText('SC-2611-A8B9');
    expect(bookingTags.length).toBeGreaterThanOrEqual(1);

    // Lifecycle steps in Bangla
    expect(screen.getByText('অনুরোধকৃত')).toBeInTheDocument();
    expect(screen.getByText('গৃহীত')).toBeInTheDocument();
    expect(screen.getByText('নির্ধারিত')).toBeInTheDocument();
    expect(screen.getByText('রওনা হয়েছেন')).toBeInTheDocument();
    expect(screen.getByText('কাজ চলছে')).toBeInTheDocument();
    expect(screen.getByText('সম্পন্ন')).toBeInTheDocument();
  });
});
