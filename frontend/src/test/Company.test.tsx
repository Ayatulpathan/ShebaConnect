import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CompanyDashboardModal } from '../components/CompanyDashboardModal.js';
import { TechnicianJobsModal } from '../components/TechnicianJobsModal.js';
import { LanguageProvider } from '../context/LanguageContext.js';
import { AuthProvider } from '../context/AuthContext.js';
import type { Organization, OrganizationMember, Booking, CompanyMetrics } from '../types/index.js';

const { mockCompany, mockMembers, mockBookings, mockMetrics } = vi.hoisted(() => {
  const mockCompany: Organization = {
    _id: 'org-123',
    name: 'Dhaka Multi-Care Services',
    tradeLicense: 'TRAD-2026-9901',
    contactPhone: '01711223344',
    contactEmail: 'info@dhakamulticare.com',
    address: 'Road 11, Banani, Dhaka',
    serviceAreas: ['banani', 'gulshan', 'uttara'],
    approvalStatus: 'APPROVED',
    isVerified: true,
    ratingAverage: 4.9,
    ratingCount: 15,
    createdAt: '2026-11-20T10:00:00.000Z',
  } as any;

  const mockMembers: OrganizationMember[] = [
    {
      _id: 'mem-1',
      organization: 'org-123' as any,
      user: {
        _id: 'tech-1',
        name: 'Kalam Master Plumber',
        email: 'kalam@example.com',
        phone: '01999112233',
        role: 'TECHNICIAN',
        status: 'ACTIVE',
      } as any,
      memberRole: 'TECHNICIAN',
      status: 'ACTIVE',
      assignedJobsCount: 4,
      createdAt: '2026-11-20T10:00:00.000Z',
      updatedAt: '2026-11-20T10:00:00.000Z',
    } as any,
  ];

  const mockBookings: Booking[] = [
    {
      _id: 'bk-cmp-1',
      bookingNumber: 'SC-2611-CMP1',
      status: 'PROVIDER_ASSIGNED',
      customer: {
        _id: 'cust-1',
        name: 'Jamil Hossain',
        phone: '01811223344',
      } as any,
      technician: {
        _id: 'tech-1',
        name: 'Kalam Master Plumber',
        phone: '01999112233',
      } as any,
      serviceAddress: {
        area: 'banani',
        addressLine: 'House 14, Road 27, Banani',
        contactName: 'Jamil',
        contactPhone: '01811223344',
      },
      service: {
        _id: 'srv-1',
        name: { en: 'Pipeline Repair', bn: 'পাইপলাইন মেরামত' },
        slug: 'pipeline-repair',
        basePrice: 800,
      } as any,
      scheduledDate: new Date('2026-11-25T10:00:00.000Z'),
      preferredTimeSlot: 'Morning',
      pricingType: 'FIXED_PRICE',
      basePrice: 800,
      finalPrice: 800,
      isPaid: false,
      paymentMethod: 'CASH_AFTER_SERVICE',
      problemDescription: 'Main bathroom pipe leakage',
      createdAt: new Date('2026-11-20T10:00:00.000Z'),
      updatedAt: new Date('2026-11-20T10:00:00.000Z'),
    } as any,
  ];

  const mockMetrics: CompanyMetrics = {
    totalBookings: 5,
    completedBookings: 4,
    activeBookings: 1,
    cancelledBookings: 0,
    totalGrossRevenue: 4000,
    netRevenue: 3600,
    platformCommissionDue: 400,
    technicianStats: [
      {
        technicianId: 'tech-1',
        name: 'Kalam Master Plumber',
        phone: '01999112233',
        email: 'kalam@example.com',
        assignedJobsCount: 5,
        completedJobsCount: 4,
        ratingAverage: 4.8,
        ratingCount: 4,
      },
    ],
  };

  return { mockCompany, mockMembers, mockBookings, mockMetrics };
});

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
  fetchMyCompany: vi.fn().mockResolvedValue(mockCompany),
  fetchCompanyMembers: vi.fn().mockResolvedValue(mockMembers),
  fetchCompanyBookings: vi.fn().mockResolvedValue(mockBookings),
  fetchCompanyMetrics: vi.fn().mockResolvedValue(mockMetrics),
  addCompanyMember: vi.fn().mockResolvedValue({ member: mockMembers[0] }),
  updateCompanyMember: vi.fn().mockResolvedValue(mockMembers[0]),
  removeCompanyMember: vi.fn().mockResolvedValue(undefined),
  assignTechnicianToBooking: vi.fn().mockResolvedValue(mockBookings[0]),
  fetchTechnicianJobs: vi.fn().mockResolvedValue(mockBookings),
  transitionBookingStatus: vi.fn().mockResolvedValue({
    ...mockBookings[0],
    status: 'ON_THE_WAY',
  }),
  recordCashCollection: vi.fn().mockResolvedValue({}),
}));

describe('ShebaConnect Phase 9 — Company & Technician Operations Frontend Tests', () => {
  it('renders CompanyDashboardModal with member list and switches to Analytics tab', async () => {
    render(
      <LanguageProvider>
        <AuthProvider>
          <CompanyDashboardModal isOpen={true} onClose={() => {}} />
        </AuthProvider>
      </LanguageProvider>
    );

    // Header company title
    await waitFor(() => {
      expect(screen.getByText('Dhaka Multi-Care Services')).toBeInTheDocument();
    });

    // Staff tab shows member name
    expect(screen.getByText('Kalam Master Plumber')).toBeInTheDocument();

    // Click on Analytics & Revenue tab
    const analyticsTab = screen.getByRole('button', {
      name: /Analytics & Revenue|আয় ও পারফরম্যান্স/i,
    });
    fireEvent.click(analyticsTab);

    // Verify gross and net revenue metrics are displayed
    await waitFor(() => {
      expect(screen.getByText('৳4,000')).toBeInTheDocument();
      expect(screen.getByText('৳3,600')).toBeInTheDocument();
      expect(screen.getByText('৳400')).toBeInTheDocument();
    });
  });

  it('renders TechnicianJobsModal with assigned jobs and action button', async () => {
    render(
      <LanguageProvider>
        <AuthProvider>
          <TechnicianJobsModal isOpen={true} onClose={() => {}} />
        </AuthProvider>
      </LanguageProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/#SC-2611-CMP1/)).toBeInTheDocument();
      expect(screen.getByText('Jamil Hossain')).toBeInTheDocument();
      expect(screen.getByText(/On The Way|রওনা হোন/i)).toBeInTheDocument();
    });
  });
});
