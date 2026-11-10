import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import http from 'http';
import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { SocketService } from '../src/services/socket.service.js';
import { User } from '../src/models/User.js';
import { Service } from '../src/models/Service.js';
import { Category } from '../src/models/Category.js';
import { Booking } from '../src/models/Booking.js';
import { Organization } from '../src/models/Organization.js';
import { ProviderProfile } from '../src/models/ProviderProfile.js';
import { CashPayment } from '../src/models/CashPayment.js';
import { CommissionEntry } from '../src/models/CommissionEntry.js';
import { AuditLog } from '../src/models/AuditLog.js';
import { generateTokens } from '../src/utils/token.js';
import { hashPassword } from '../src/utils/password.js';

describe('ShebaConnect Phase 10 — Admin Governance & Marketplace Operations Tests', () => {
  let mongoServer: MongoMemoryServer;
  let server: http.Server;
  const app = createApp();

  let adminToken: string;
  let adminId: string;

  let supportAgentToken: string;
  let supportAgentId: string;

  let customerToken: string;
  let customerId: string;

  let providerToken: string;
  let providerId: string;

  let companyOwnerToken: string;
  let companyOwnerId: string;

  let serviceId: string;
  let providerProfileId: string;
  let orgId: string;
  let disputedBookingId: string;
  let commissionEntryId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    server = http.createServer(app);
    SocketService.init(server);

    const hashedPassword = await hashPassword('AdminPass123');

    // 1. Admin
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@shebaconnect.com',
      phone: '01710000001',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      isVerified: true,
    });
    adminId = admin._id.toString();
    adminToken = generateTokens({
      sub: adminId,
      role: admin.role,
      email: admin.email,
    }).accessToken;

    // 2. Support Agent
    const support = await User.create({
      name: 'Support Agent Rahim',
      email: 'support@shebaconnect.com',
      phone: '01710000002',
      password: hashedPassword,
      role: 'SUPPORT_AGENT',
      status: 'ACTIVE',
    });
    supportAgentId = support._id.toString();
    supportAgentToken = generateTokens({
      sub: supportAgentId,
      role: support.role,
      email: support.email,
    }).accessToken;

    // 3. Customer
    const customer = await User.create({
      name: 'Anika Rahman',
      email: 'anika@test.com',
      phone: '01710000003',
      password: hashedPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    });
    customerId = customer._id.toString();
    customerToken = generateTokens({
      sub: customerId,
      role: customer.role,
      email: customer.email,
    }).accessToken;

    // 4. Individual Provider
    const provider = await User.create({
      name: 'Kabir Electrician',
      email: 'kabir@test.com',
      phone: '01710000004',
      password: hashedPassword,
      role: 'INDIVIDUAL_PROVIDER',
      status: 'ACTIVE',
      isVerified: false,
    });
    providerId = provider._id.toString();
    providerToken = generateTokens({
      sub: providerId,
      role: provider.role,
      email: provider.email,
    }).accessToken;

    const profile = await ProviderProfile.create({
      user: provider._id,
      nidNumber: '19951234567890123',
      skills: ['Electrical Wiring', 'AC Servicing'],
      verificationStatus: 'PENDING_REVIEW',
      verificationDocuments: [
        {
          docType: 'NID',
          documentNumber: '19951234567890123',
          fileUrl: '/uploads/nid-test.png',
          submittedAt: new Date(),
        },
      ],
    });
    providerProfileId = profile._id.toString();

    // 5. Company Owner & Organization
    const owner = await User.create({
      name: 'Nazmul Enterprise',
      email: 'nazmul@enterprise.com',
      phone: '01710000005',
      password: hashedPassword,
      role: 'COMPANY_OWNER',
      status: 'ACTIVE',
    });
    companyOwnerId = owner._id.toString();
    companyOwnerToken = generateTokens({
      sub: companyOwnerId,
      role: owner.role,
      email: owner.email,
    }).accessToken;

    const org = await Organization.create({
      owner: owner._id,
      name: 'Dhaka Cool Engineering',
      tradeLicense: 'TRAD/DNCC/2026/99812',
      contactPhone: '01710000005',
      address: 'House 14, Road 5, Dhanmondi, Dhaka',
      serviceAreas: ['dhanmondi', 'mirpur'],
      approvalStatus: 'PENDING_APPROVAL',
      isVerified: false,
    });
    orgId = org._id.toString();

    // 6. Category & Service
    const cat = await Category.create({
      name: { en: 'AC Servicing', bn: 'এসি সার্ভিসিং' },
      description: {
        en: 'AC servicing and cooling repair',
        bn: 'এসি মেরামত ও সার্ভিসিং',
      },
      slug: 'ac-servicing',
      icon: 'wind',
      isActive: true,
      displayOrder: 1,
    });

    const srv = await Service.create({
      category: cat._id,
      name: { en: 'Master AC Servicing', bn: 'মাস্টার এসি সার্ভিসিং' },
      slug: 'master-ac-servicing',
      description: {
        en: 'Comprehensive cooling jet wash and filter cleaning',
        bn: 'সম্পূর্ণ কুলিং জেট ওয়াশ এবং ফিল্টার ক্লিনিং সার্ভিস',
      },
      pricingType: 'FIXED_PRICE',
      basePrice: 1500,
      estimatedDurationMinutes: 60,
      serviceAreas: ['dhanmondi'],
      isActive: true,
    });
    serviceId = srv._id.toString();

    // 7. Disputed Booking
    const booking = await Booking.create({
      bookingNumber: 'BK-2611-TESTDISP',
      customer: customer._id,
      service: srv._id,
      provider: provider._id,
      status: 'DISPUTED',
      problemDescription: 'Technician left water leaking and did not clean up.',
      serviceAddress: {
        area: 'dhanmondi',
        addressLine: 'Flat 4B, Road 7',
        contactPhone: '01710000003',
        contactName: 'Anika Rahman',
      },
      scheduledDate: new Date(),
      preferredTimeSlot: '10:00 - 12:00',
      pricingType: 'FIXED_PRICE',
      basePrice: 1500,
      finalPrice: 1500,
      isPaid: false,
      paymentMethod: 'CASH_AFTER_SERVICE',
    });
    disputedBookingId = booking._id.toString();

    const payment = await CashPayment.create({
      booking: booking._id,
      receiptNumber: 'RCP-2611-DISP01',
      customer: customer._id,
      provider: provider._id,
      amountExpected: 1500,
      amountCollected: 1500,
      status: 'DISPUTED',
      paymentMethod: 'CASH_AFTER_SERVICE',
    });

    const comm = await CommissionEntry.create({
      booking: booking._id,
      payment: payment._id,
      provider: provider._id,
      totalAmount: 1500,
      commissionRate: 0.1,
      commissionAmount: 150,
      providerEarnings: 1350,
      status: 'PENDING_SETTLEMENT',
    });
    commissionEntryId = comm._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('1. RBAC & Access Restrictions for Admin Endpoints', () => {
    it('rejects unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/v1/admin/overview');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects regular CUSTOMER from accessing overview with 403', async () => {
      const res = await request(app)
        .get('/api/v1/admin/overview')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe('FORBIDDEN_ROLE');
    });

    it('rejects INDIVIDUAL_PROVIDER from accessing admin user management with 403', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${providerToken}`);
      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe('FORBIDDEN_ROLE');
    });

    it('rejects SUPPORT_AGENT from performing write actions (e.g. updating user status) with 403', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${customerId}/status`)
        .set('Authorization', `Bearer ${supportAgentToken}`)
        .send({ status: 'SUSPENDED', reason: 'Attempted fraud' });
      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe('FORBIDDEN_ROLE');
    });

    it('allows SUPPORT_AGENT to view read-only platform overview', async () => {
      const res = await request(app)
        .get('/api/v1/admin/overview')
        .set('Authorization', `Bearer ${supportAgentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users).toBeDefined();
    });
  });

  describe('2. Platform Overview & Metrics (GET /api/v1/admin/overview)', () => {
    it('returns aggregated counts of users, bookings, and cash financials for ADMIN', async () => {
      const res = await request(app)
        .get('/api/v1/admin/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const { users, bookings, financials } = res.body.data;

      expect(users.total).toBeGreaterThanOrEqual(5);
      expect(users.customers).toBeGreaterThanOrEqual(1);
      expect(users.individualProviders).toBeGreaterThanOrEqual(1);
      expect(users.registeredCompanies).toBeGreaterThanOrEqual(1);
      expect(users.pendingProviderVerifications).toBeGreaterThanOrEqual(1);
      expect(users.pendingCompanyApprovals).toBeGreaterThanOrEqual(1);

      expect(bookings.total).toBeGreaterThanOrEqual(1);
      expect(bookings.disputed).toBeGreaterThanOrEqual(1);

      expect(financials.totalCommissionPendingBDT).toBeGreaterThanOrEqual(150);
    });
  });

  describe('3. User Governance (GET /api/v1/admin/users & PATCH /api/v1/admin/users/:id/status)', () => {
    it('allows ADMIN to query users with filtering and search', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users?role=CUSTOMER&search=Anika')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users.length).toBe(1);
      expect(res.body.data.users[0].name).toBe('Anika Rahman');
      expect(res.body.data.total).toBe(1);
    });

    it('prevents ADMIN from suspending their own account', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${adminId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'SUSPENDED', reason: 'Accidental self-test' });

      expect(res.status).toBe(400);
      expect(res.body.errorCode).toBe('SELF_SUSPENSION_PROHIBITED');
    });

    it('allows ADMIN to suspend a user account and records an audit log', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${customerId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'SUSPENDED', reason: 'Repeated non-payment of cash' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.status).toBe('SUSPENDED');

      // Verify Audit Log was persisted
      const log = await AuditLog.findOne({
        targetType: 'USER',
        targetId: customerId,
        action: 'USER_SUSPENDED',
      });
      expect(log).toBeDefined();
      expect(log?.actorRole).toBe('ADMIN');
      expect((log?.details as any).reason).toBe('Repeated non-payment of cash');
    });

    it('allows ADMIN to reactivate a suspended user account', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${customerId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'ACTIVE', reason: 'Account cleared after review' });

      expect(res.status).toBe(200);
      expect(res.body.data.user.status).toBe('ACTIVE');

      const log = await AuditLog.findOne({
        targetType: 'USER',
        targetId: customerId,
        action: 'USER_ACTIVATED',
      });
      expect(log).toBeDefined();
    });
  });

  describe('4. Provider Verification Queue & Review', () => {
    it('returns pending verification submissions for providers and companies', async () => {
      const res = await request(app)
        .get('/api/v1/admin/verification-applications')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.providers.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.companies.length).toBeGreaterThanOrEqual(1);
    });

    it('allows ADMIN to approve provider verification, updating profile and user', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/providers/${providerProfileId}/verification`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'VERIFIED',
          notes: 'NID documents verified against government records',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile.verificationStatus).toBe('VERIFIED');
      expect(res.body.data.profile.verifiedAt).toBeDefined();

      // Check User isVerified updated to true
      const user = await User.findById(providerId);
      expect(user?.isVerified).toBe(true);

      // Verify Audit Log
      const log = await AuditLog.findOne({
        targetType: 'PROVIDER',
        targetId: providerProfileId,
        action: 'PROVIDER_VERIFIED',
      });
      expect(log).toBeDefined();
    });

    it('allows ADMIN to approve company registration', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/companies/${orgId}/approval`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'APPROVED',
          notes: 'Trade license verified with DNCC authority',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.organization.approvalStatus).toBe('APPROVED');
      expect(res.body.data.organization.isVerified).toBe(true);

      const log = await AuditLog.findOne({
        targetType: 'COMPANY',
        targetId: orgId,
        action: 'COMPANY_APPROVED',
      });
      expect(log).toBeDefined();
    });
  });

  describe('5. Booking Management & Dispute Resolution', () => {
    it('lists all bookings with status filter for admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/bookings?status=DISPUTED')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bookings.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.bookings[0].bookingNumber).toBe('BK-2611-TESTDISP');
    });

    it('retrieves disputed bookings queue with customer and payment info', async () => {
      const res = await request(app)
        .get('/api/v1/admin/disputes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.disputes.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.disputes[0].booking._id.toString()).toBe(disputedBookingId);
      expect(res.body.data.disputes[0].payment).toBeDefined();
    });

    it('resolves dispute as RESOLVE_AS_COMPLETED and updates cash payment', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/disputes/${disputedBookingId}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          resolution: 'RESOLVE_AS_COMPLETED',
          notes: 'Customer confirmed technician returned and fixed leak.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.booking.status).toBe('COMPLETED');

      // Verify payment marked confirmed
      const payment = await CashPayment.findOne({ booking: disputedBookingId });
      expect(payment?.status).toBe('CONFIRMED');

      // Verify Audit Log
      const log = await AuditLog.findOne({
        targetType: 'BOOKING',
        targetId: disputedBookingId,
        action: 'DISPUTE_RESOLVED',
      });
      expect(log).toBeDefined();
      expect((log?.details as any).resolution).toBe('RESOLVE_AS_COMPLETED');
    });
  });

  describe('6. Financial Settlements & Audit Trail', () => {
    it('allows ADMIN to record commission settlement for pending entries', async () => {
      const res = await request(app)
        .post('/api/v1/admin/settlements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          providerId,
          entryIds: [commissionEntryId],
          amountSettled: 150,
          settlementMethod: 'MANUAL_CASH_OR_OFFLINE',
          paymentReference: 'OFFLINE-HQ-RECEIPT-441',
          notes: 'Provider paid ৳150 commission at Dhaka central office',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.settledCount).toBe(1);

      // Verify entry is now SETTLED
      const entry = await CommissionEntry.findById(commissionEntryId);
      expect(entry?.status).toBe('SETTLED');
    });

    it('allows ADMIN to retrieve audit logs tracking platform governance actions', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.logs.length).toBeGreaterThanOrEqual(4);
      expect(res.body.data.logs[0].actor).toBeDefined();
    });
  });
});
