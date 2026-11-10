import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminDashboardModal } from '../components/AdminDashboardModal.js';
import { LanguageProvider } from '../context/LanguageContext.js';
import { AuthProvider } from '../context/AuthContext.js';
import type {
  AdminOverviewData,
  AdminVerificationApplications,
  AdminDispute,
  AuditLogRecord,
  User,
} from '../types/index.js';

const {
  mockOverview,
  mockUsers,
  mockVerificationApps,
  mockDisputes,
  mockAuditLogs,
} = vi.hoisted(() => {
  const mockOverview: AdminOverviewData = {
    users: {
      total: 42,
      customers: 25,
      individualProviders: 10,
      registeredCompanies: 5,
      verifiedProviders: 8,
      pendingProviderVerifications: 2,
      pendingCompanyApprovals: 1,
    },
    bookings: {
      total: 80,
      completed: 65,
      cancelled: 10,
      disputed: 2,
      activeInProgress: 3,
    },
    financials: {
      totalGrossVolumeBDT: 150000,
      totalCommissionEarnedBDT: 15000,
      totalCommissionPendingBDT: 3000,
      totalCommissionSettledBDT: 12000,
      settlementsCount: 6,
    },
  };

  const mockUsers: User[] = [
    {
      id: 'usr-1',
      name: 'Tanvir Ahmed',
      email: 'tanvir@example.com',
      phone: '01712345678',
      role: 'CUSTOMER',
      status: 'ACTIVE',
      isVerified: true,
      preferredLanguage: 'bn',
      addresses: [],
      createdAt: '2026-11-20T10:00:00.000Z',
    },
    {
      id: 'usr-2',
      name: 'Bad Actor User',
      email: 'badactor@example.com',
      phone: '01812345678',
      role: 'INDIVIDUAL_PROVIDER',
      status: 'SUSPENDED',
      isVerified: false,
      preferredLanguage: 'en',
      addresses: [],
      createdAt: '2026-11-21T10:00:00.000Z',
    },
  ];

  const mockVerificationApps: AdminVerificationApplications = {
    providers: [
      {
        _id: 'prof-1',
        user: {
          _id: 'usr-3',
          name: 'Nayeem Master Electrician',
          email: 'nayeem@example.com',
          phone: '01912345678',
          status: 'ACTIVE',
          isVerified: false,
        },
        nidNumber: '19901234567890123',
        skills: ['Wiring', 'Switchboard', 'Generator'],
        experienceYears: 5,
        verificationStatus: 'PENDING_REVIEW',
      },
    ],
    companies: [
      {
        _id: 'org-1',
        name: 'Dhaka Quick AC Services',
        tradeLicense: 'TRAD-2026-4402',
        address: 'House 5, Road 2, Dhanmondi',
        serviceAreas: ['dhanmondi', 'mirpur'],
        approvalStatus: 'PENDING_APPROVAL',
        owner: {
          name: 'Rashid Khan',
          phone: '01799887766',
        },
      },
    ],
  };

  const mockDisputes: AdminDispute[] = [
    {
      booking: {
        id: 'bk-disp-1',
        _id: 'bk-disp-1',
        bookingNumber: 'SC-2611-DISP99',
        status: 'DISPUTED',
        customer: {
          name: 'Anika Rahman',
          phone: '01710000003',
        } as any,
        provider: {
          name: 'Kabir Electrician',
          phone: '01710000004',
        } as any,
        service: {
          name: { en: 'AC Jet Cleaning', bn: 'এসি জেট ক্লিনিং' },
          basePrice: 1500,
        } as any,
        serviceAddress: {
          area: 'dhanmondi',
          addressLine: 'Flat 4B, Road 7',
          contactName: 'Anika',
          contactPhone: '01710000003',
        },
        scheduledDate: new Date('2026-11-20T10:00:00.000Z'),
        basePrice: 1500,
        finalPrice: 1500,
        problemDescription: 'Technician left water leaking and did not clean up.',
        isPaid: false,
        paymentMethod: 'CASH_AFTER_SERVICE',
      } as any,
      payment: {
        amountCollected: 1500,
        status: 'DISPUTED',
      } as any,
    },
  ];

  const mockAuditLogs: AuditLogRecord[] = [
    {
      _id: 'log-1',
      actor: {
        _id: 'admin-1',
        name: 'Super Admin',
        email: 'admin@shebaconnect.com',
        role: 'ADMIN',
      },
      actorRole: 'ADMIN',
      action: 'USER_SUSPENDED',
      targetType: 'USER',
      targetId: 'usr-2',
      details: { reason: 'Policy violation' },
      createdAt: '2026-11-20T12:00:00.000Z',
    },
  ];

  return {
    mockOverview,
    mockUsers,
    mockVerificationApps,
    mockDisputes,
    mockAuditLogs,
  };
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
  fetchAdminOverview: vi.fn().mockImplementation(() => Promise.resolve(mockOverview)),
  fetchAdminUsers: vi.fn().mockImplementation(() =>
    Promise.resolve({
      users: mockUsers,
      total: mockUsers.length,
      page: 1,
      limit: 20,
      totalPages: 1,
    })
  ),
  updateAdminUserStatus: vi.fn().mockImplementation((userId, status) => {
    const user = mockUsers.find((u) => u.id === userId);
    return Promise.resolve({ ...user, status });
  }),
  fetchAdminVerificationApplications: vi.fn().mockImplementation(() =>
    Promise.resolve(mockVerificationApps)
  ),
  reviewAdminProviderVerification: vi.fn().mockImplementation((id, data) =>
    Promise.resolve({ _id: id, verificationStatus: data.status })
  ),
  reviewAdminCompanyApproval: vi.fn().mockImplementation((id, data) =>
    Promise.resolve({ _id: id, approvalStatus: data.status, isVerified: data.status === 'APPROVED' })
  ),
  fetchAdminDisputes: vi.fn().mockImplementation(() => Promise.resolve(mockDisputes)),
  resolveAdminDispute: vi.fn().mockImplementation((id, data) =>
    Promise.resolve({
      id,
      status: data.resolution === 'RESOLVE_AS_COMPLETED' ? 'COMPLETED' : 'CANCELLED',
    })
  ),
  fetchAdminAuditLogs: vi.fn().mockImplementation(() =>
    Promise.resolve({
      logs: mockAuditLogs,
      total: mockAuditLogs.length,
      page: 1,
      limit: 20,
      totalPages: 1,
    })
  ),
}));

describe('ShebaConnect Phase 10 — Admin Governance & Marketplace Operations Frontend Tests', () => {
  it('renders AdminDashboardModal with Overview KPIs', async () => {
    render(
      <LanguageProvider>
        <AuthProvider>
          <AdminDashboardModal isOpen={true} onClose={vi.fn()} lang="en" />
        </AuthProvider>
      </LanguageProvider>
    );

    // Verify Title
    expect(
      screen.getByText('ShebaConnect Admin & Marketplace Governance')
    ).toBeInTheDocument();

    // Verify Metrics from mockOverview
    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument(); // total users
      expect(screen.getByText('65')).toBeInTheDocument(); // completed bookings
      expect(screen.getByText('৳150,000')).toBeInTheDocument(); // gross volume
      expect(screen.getByText('৳15,000')).toBeInTheDocument(); // 10% platform commission
    });
  });

  it('switches to User Governance tab and toggles user status', async () => {
    render(
      <LanguageProvider>
        <AuthProvider>
          <AdminDashboardModal isOpen={true} onClose={vi.fn()} lang="en" />
        </AuthProvider>
      </LanguageProvider>
    );

    // Switch to User Governance tab
    const userTab = screen.getByText('User Governance');
    fireEvent.click(userTab);

    // Wait for users table to populate
    await waitFor(() => {
      expect(screen.getByText('Tanvir Ahmed')).toBeInTheDocument();
      expect(screen.getByText('Bad Actor User')).toBeInTheDocument();
    });

    // Suspend Tanvir Ahmed
    const suspendButtons = screen.getAllByText('Suspend');
    expect(suspendButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(suspendButtons[0]);

    await waitFor(() => {
      expect(
        screen.getByText(/User Tanvir Ahmed status updated to SUSPENDED/)
      ).toBeInTheDocument();
    });
  });

  it('switches to Verification Queue tab and approves provider application', async () => {
    render(
      <LanguageProvider>
        <AuthProvider>
          <AdminDashboardModal isOpen={true} onClose={vi.fn()} lang="en" />
        </AuthProvider>
      </LanguageProvider>
    );

    // Switch to Verification Queue
    const verifTab = screen.getByText('Verification Queue');
    fireEvent.click(verifTab);

    await waitFor(() => {
      expect(screen.getByText('Nayeem Master Electrician')).toBeInTheDocument();
      expect(screen.getByText('19901234567890123')).toBeInTheDocument();
    });

    // Click Approve
    const approveBtn = screen.getByText('Approve');
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Provider application verified successfully')
      ).toBeInTheDocument();
    });
  });

  it('switches to Dispute Resolution tab and resolves dispute', async () => {
    render(
      <LanguageProvider>
        <AuthProvider>
          <AdminDashboardModal isOpen={true} onClose={vi.fn()} lang="en" />
        </AuthProvider>
      </LanguageProvider>
    );

    // Switch to Dispute Resolution
    const disputeTab = screen.getByText('Dispute Resolution');
    fireEvent.click(disputeTab);

    await waitFor(() => {
      expect(screen.getByText(/#SC-2611-DISP99/)).toBeInTheDocument();
      expect(screen.getByText(/Anika Rahman/)).toBeInTheDocument();
    });

    // Click Resolve as Completed
    const resolveBtn = screen.getByText('Resolve as Completed');
    fireEvent.click(resolveBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Dispute successfully resolved as COMPLETED/)
      ).toBeInTheDocument();
    });
  });

  it('switches to Platform Audit Trail tab and displays logs', async () => {
    render(
      <LanguageProvider>
        <AuthProvider>
          <AdminDashboardModal isOpen={true} onClose={vi.fn()} lang="en" />
        </AuthProvider>
      </LanguageProvider>
    );

    // Switch to Platform Audit Trail
    const auditTab = screen.getByText('Platform Audit Trail');
    fireEvent.click(auditTab);

    await waitFor(() => {
      expect(screen.getByText('Super Admin')).toBeInTheDocument();
      expect(screen.getByText('USER_SUSPENDED')).toBeInTheDocument();
    });
  });
});
