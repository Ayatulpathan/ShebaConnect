import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ProviderEarningsModal } from '../components/ProviderEarningsModal.js';
import { BookingTrackerModal } from '../components/BookingTrackerModal.js';
import { LanguageProvider } from '../context/LanguageContext.js';

const { mockSummary, mockPayment, mockReceipt } = vi.hoisted(() => ({
  mockSummary: {
    totalBookings: 2,
    totalGrossRevenue: 2000,
    totalPlatformCommission: 200,
    totalNetEarnings: 1800,
    pendingCommissionDue: 200,
    settledCommission: 0,
    commissionRate: 0.1,
    recentEntries: [
      {
        _id: 'entry-1',
        booking: {
          bookingNumber: 'SC-2611-TEST01',
          scheduledDate: '2026-11-20T10:00:00.000Z',
          pricingType: 'FIXED_PRICE',
          finalPrice: 1000,
          status: 'COMPLETED',
        },
        payment: 'pay-1',
        provider: 'prov-1',
        totalAmount: 1000,
        commissionRate: 0.1,
        commissionAmount: 100,
        providerEarnings: 900,
        status: 'PENDING_SETTLEMENT',
        createdAt: '2026-11-20T12:00:00.000Z',
      },
    ],
    recentSettlements: [],
  },
  mockPayment: {
    _id: 'pay-1',
    booking: 'bk-comp-1',
    receiptNumber: 'RCP-2611-A8B9C1',
    customer: { name: 'Rahim Customer', phone: '01711000001' },
    provider: { name: 'Hasan Technician', phone: '01711000003' },
    amountExpected: 1200,
    amountCollected: 1200,
    status: 'COLLECTED_BY_PROVIDER',
    paymentMethod: 'CASH_AFTER_SERVICE',
    createdAt: '2026-11-20T12:00:00.000Z',
    updatedAt: '2026-11-20T12:00:00.000Z',
  },
  mockReceipt: {
    receiptNumber: 'RCP-2611-A8B9C1',
    bookingNumber: 'SC-2611-TEST01',
    status: 'CONFIRMED',
    paymentMethod: 'Cash After Service (ক্যাশ অন ডেলিভারি / সার্ভিসের পর ক্যাশ)',
    amountExpected: 1200,
    amountCollected: 1200,
    currency: 'BDT',
    currencySymbol: '৳',
    customer: { name: 'Rahim Customer', phone: '01711000001' },
    provider: { name: 'Hasan Technician', phone: '01711000003' },
    service: { name: { en: 'AC Jet Wash', bn: 'এসি জেট ওয়াশ' }, category: 'AC' },
    serviceAddress: { area: 'mirpur', addressLine: 'Mirpur 10' },
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
  fetchProviderEarningsSummary: vi.fn().mockResolvedValue(mockSummary),
  fetchBookings: vi.fn().mockResolvedValue({
    bookings: [
      {
        _id: 'bk-comp-1',
        bookingNumber: 'SC-2611-PAY01',
        status: 'COMPLETED',
        service: {
          name: { en: 'AC Master Service', bn: 'এসি মাস্টার সার্ভিস' },
        },
        serviceAddress: {
          area: 'mirpur',
          addressLine: 'Mirpur 10',
          contactName: 'Rahim Customer',
          contactPhone: '01711000001',
        },
        scheduledDate: '2026-11-20T10:00:00.000Z',
        preferredTimeSlot: 'Morning',
        finalPrice: 1200,
        basePrice: 1200,
        isPaid: false,
      },
    ],
    pagination: { total: 1, page: 1, limit: 10 },
  }),
  fetchQuotes: vi.fn().mockResolvedValue([]),
  fetchBookingPayment: vi.fn().mockResolvedValue({ payment: mockPayment }),
  confirmCashPayment: vi.fn().mockResolvedValue({
    payment: { ...mockPayment, status: 'CONFIRMED' },
    commissionEntry: { commissionAmount: 120 },
  }),
  recordCashCollection: vi.fn().mockResolvedValue(mockPayment),
  disputeCashPayment: vi.fn().mockResolvedValue({ ...mockPayment, status: 'DISPUTED' }),
  fetchBookingReceipt: vi.fn().mockResolvedValue(mockReceipt),
  fetchBookingReview: vi.fn().mockResolvedValue(null),
  transitionBookingStatus: vi.fn().mockResolvedValue({}),
  respondToQuote: vi.fn().mockResolvedValue({}),
}));

vi.mock('../context/AuthContext.js', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: {
      id: 'cust-1',
      name: 'Rahim Customer',
      email: 'rahim@example.com',
      phone: '01711000001',
      role: 'CUSTOMER',
    },
    isAuthenticated: true,
  }),
}));

describe('ShebaConnect Phase 6 — Cash Payment & Commission Frontend Tests', () => {
  it('renders ProviderEarningsModal with gross cash, 90% net earnings, and 10% commission ledger', async () => {
    render(
      <LanguageProvider>
        <ProviderEarningsModal isOpen={true} onClose={() => {}} />
      </LanguageProvider>
    );

    expect(screen.getByText('আয় ও প্ল্যাটফর্ম কমিশন লেজার')).toBeInTheDocument();

    // Verify gross revenue
    await waitFor(() => {
      expect(screen.getByText('৳2,000')).toBeInTheDocument();
    });

    // Verify net earnings (90%) and commission (10%)
    expect(screen.getByText('৳1,800')).toBeInTheDocument();
    const dues = screen.getAllByText('৳200');
    expect(dues.length).toBeGreaterThanOrEqual(1);

    // Verify zero cost policy banner
    expect(screen.getByText(/জিরো-কস্ট ক্যাশ পলিসি/)).toBeInTheDocument();

    // Booking entry in ledger table
    expect(screen.getByText('SC-2611-TEST01')).toBeInTheDocument();
  });

  it('renders BookingTrackerModal with cash payment controls for completed booking', async () => {
    render(
      <LanguageProvider>
        <BookingTrackerModal isOpen={true} onClose={() => {}} />
      </LanguageProvider>
    );

    // Verify booking appears
    await waitFor(() => {
      const numbers = screen.getAllByText('SC-2611-PAY01');
      expect(numbers.length).toBeGreaterThanOrEqual(1);
    });

    // Cash-after-service section
    expect(screen.getByText('ক্যাশ আফটার সার্ভিস পেমেন্ট')).toBeInTheDocument();

    // Customer confirm cash handover button
    expect(screen.getByText('ক্যাশ পরিশোধ নিশ্চিত করুন')).toBeInTheDocument();
  });
});
