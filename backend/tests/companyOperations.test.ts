import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import http from 'http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { SocketService } from '../src/services/socket.service.js';
import { User } from '../src/models/User.js';
import { Service } from '../src/models/Service.js';
import { Category } from '../src/models/Category.js';
import { Booking } from '../src/models/Booking.js';
import { Organization } from '../src/models/Organization.js';
import { OrganizationMember } from '../src/models/OrganizationMember.js';
import { generateTokens } from '../src/utils/token.js';
import { hashPassword } from '../src/utils/password.js';

describe('ShebaConnect Phase 9 — Company & Technician Operations Tests', () => {
  let mongoServer: MongoMemoryServer;
  let server: http.Server;
  const app = createApp();

  let ownerToken: string;
  let ownerId: string;

  let otherOwnerToken: string;
  let otherOwnerId: string;

  let staffToken: string;
  let staffId: string;

  let technicianToken: string;
  let technicianId: string;

  let customerToken: string;
  let customerId: string;

  let orgId: string;
  let serviceId: string;
  let companyBookingId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    server = http.createServer(app);
    SocketService.init(server);

    const hashedPassword = await hashPassword('Password123');

    // 1. Company Owner A
    const owner = await User.create({
      name: 'Bashir Owner',
      email: 'bashir.owner@sheba-test.com',
      phone: '01711223344',
      password: hashedPassword,
      role: 'COMPANY_OWNER',
    });
    ownerId = owner._id.toString();
    ownerToken = generateTokens({
      sub: ownerId,
      role: owner.role,
      email: owner.email,
    }).accessToken;

    // 2. Company Owner B (for tenant isolation test)
    const otherOwner = await User.create({
      name: 'Farid Competitor',
      email: 'farid.comp@sheba-test.com',
      phone: '01711223399',
      password: hashedPassword,
      role: 'COMPANY_OWNER',
    });
    otherOwnerId = otherOwner._id.toString();
    otherOwnerToken = generateTokens({
      sub: otherOwnerId,
      role: otherOwner.role,
      email: otherOwner.email,
    }).accessToken;

    // 3. Customer
    const customer = await User.create({
      name: 'Jamil Customer',
      email: 'jamil.customer@example.com',
      phone: '01811223344',
      password: hashedPassword,
      role: 'CUSTOMER',
    });
    customerId = customer._id.toString();
    customerToken = generateTokens({
      sub: customerId,
      role: customer.role,
      email: customer.email,
    }).accessToken;

    // 4. Create Category and Service
    const cat = await Category.create({
      name: { en: 'Plumbing Works', bn: 'প্লাম্বিং কাজ' },
      slug: 'plumbing-works-p9',
      description: { en: 'Expert pipe and sanitary repair', bn: 'পাইপ ও স্যানিটারি মেরামত' },
      icon: 'droplets',
    });

    const srv = await Service.create({
      name: { en: 'Pipeline Leakage Repair', bn: 'পাইপলাইন লিকেজ মেরামত' },
      slug: 'pipeline-leakage-repair-p9',
      category: cat._id,
      description: { en: 'Pipe leak fix', bn: 'পাইপ লিকেজ মেরামত' },
      basePrice: 800,
      pricingType: 'FIXED_PRICE',
      estimatedDurationMinutes: 45,
    });
    serviceId = srv._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('1. Company Registration & Staff/Technician Management', () => {
    it('allows COMPANY_OWNER to register their organization', async () => {
      const res = await request(app)
        .post('/api/v1/companies')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Dhaka Expert Technicians Ltd',
          tradeLicense: 'TRAD-DHK-2026-9901',
          contactPhone: '01711223344',
          contactEmail: 'contact@dhakaexpert.com',
          address: 'House 45, Road 11, Banani, Dhaka',
          serviceAreas: ['banani', 'gulshan', 'uttara'],
          description: 'Top grade plumbing and maintenance company',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.organization.name).toBe('Dhaka Expert Technicians Ltd');
      orgId = res.body.data.organization._id;
    });

    it('allows company owner to add a STAFF member', async () => {
      const res = await request(app)
        .post(`/api/v1/companies/${orgId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Sadia Manager',
          email: 'sadia.manager@dhakaexpert.com',
          phone: '01899112233',
          memberRole: 'STAFF',
          password: 'Password123',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.member.memberRole).toBe('STAFF');

      staffId = res.body.data.user._id;
      const staffUser = await User.findById(staffId);
      expect(staffUser?.role).toBe('COMPANY_STAFF');

      staffToken = generateTokens({
        sub: staffId,
        role: staffUser!.role,
        email: staffUser!.email,
      }).accessToken;
    });

    it('allows company owner to add a TECHNICIAN member', async () => {
      const res = await request(app)
        .post(`/api/v1/companies/${orgId}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Kalam Master Plumber',
          email: 'kalam.plumber@dhakaexpert.com',
          phone: '01999112233',
          memberRole: 'TECHNICIAN',
          password: 'Password123',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.member.memberRole).toBe('TECHNICIAN');

      technicianId = res.body.data.user._id;
      const techUser = await User.findById(technicianId);
      expect(techUser?.role).toBe('TECHNICIAN');

      technicianToken = generateTokens({
        sub: technicianId,
        role: techUser!.role,
        email: techUser!.email,
      }).accessToken;
    });

    it('enforces multi-tenant isolation: other company owner cannot view or manage members', async () => {
      const res = await request(app)
        .get(`/api/v1/companies/${orgId}/members`)
        .set('Authorization', `Bearer ${otherOwnerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe('FORBIDDEN_ORGANIZATION_ACCESS');
    });
  });

  describe('2. Technician Dispatch & Job Assignment Workflow', () => {
    beforeAll(async () => {
      // Create a company booking
      const booking = await Booking.create({
        bookingNumber: 'BK-CMP-901',
        customer: customerId,
        service: serviceId,
        organization: orgId,
        status: 'ACCEPTED',
        problemDescription: 'Main water pipe ruptured in bathroom',
        serviceAddress: {
          area: 'banani',
          addressLine: 'House 14, Road 27, Banani',
          contactPhone: '01811223344',
          contactName: 'Jamil',
        },
        scheduledDate: new Date(),
        preferredTimeSlot: '11:00 AM - 01:00 PM',
        pricingType: 'FIXED_PRICE',
        basePrice: 800,
        finalPrice: 800,
        isPaid: false,
      });
      companyBookingId = booking._id.toString();
    });

    it('allows company staff to assign active technician to booking', async () => {
      const res = await request(app)
        .post(`/api/v1/companies/${orgId}/bookings/${companyBookingId}/assign-technician`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({
          technicianId,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.booking.status).toBe('PROVIDER_ASSIGNED');
      expect(res.body.data.booking.technician._id).toBe(technicianId);

      // Verify assignedJobsCount incremented on technician member record
      const member = await OrganizationMember.findOne({ organization: orgId, user: technicianId });
      expect(member?.assignedJobsCount).toBe(1);
    });

    it('rejects technician assignment from an unrelated user', async () => {
      const res = await request(app)
        .post(`/api/v1/companies/${orgId}/bookings/${companyBookingId}/assign-technician`)
        .set('Authorization', `Bearer ${otherOwnerToken}`)
        .send({
          technicianId,
        });

      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe('FORBIDDEN_ORGANIZATION_ACCESS');
    });
  });

  describe('3. Technician Job Execution & Lifecycle Tracking', () => {
    it('allows technician to view their assigned jobs list', async () => {
      const res = await request(app)
        .get('/api/v1/companies/technicians/my-jobs')
        .set('Authorization', `Bearer ${technicianToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bookings.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.bookings[0]._id).toBe(companyBookingId);
      expect(res.body.data.bookings[0].service.name.en).toBe('Pipeline Leakage Repair');
    });

    it('allows assigned technician to update status: PROVIDER_ASSIGNED -> ON_THE_WAY', async () => {
      const res = await request(app)
        .patch(`/api/v1/bookings/${companyBookingId}/status`)
        .set('Authorization', `Bearer ${technicianToken}`)
        .send({
          status: 'ON_THE_WAY',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.booking.status).toBe('ON_THE_WAY');
    });

    it('allows assigned technician to update status: ON_THE_WAY -> IN_PROGRESS', async () => {
      const res = await request(app)
        .patch(`/api/v1/bookings/${companyBookingId}/status`)
        .set('Authorization', `Bearer ${technicianToken}`)
        .send({
          status: 'IN_PROGRESS',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.booking.status).toBe('IN_PROGRESS');
    });

    it('allows assigned technician to complete the service: IN_PROGRESS -> COMPLETED', async () => {
      const res = await request(app)
        .patch(`/api/v1/bookings/${companyBookingId}/status`)
        .set('Authorization', `Bearer ${technicianToken}`)
        .send({
          status: 'COMPLETED',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.booking.status).toBe('COMPLETED');
    });
  });

  describe('4. Company Performance Metrics & Technician Leaderboard', () => {
    beforeAll(async () => {
      // Mark booking as paid so revenue is counted in company metrics
      await Booking.findByIdAndUpdate(companyBookingId, { isPaid: true });
    });

    it('retrieves accurate company metrics and technician statistics', async () => {
      const res = await request(app)
        .get(`/api/v1/companies/${orgId}/metrics`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.metrics.totalBookings).toBe(1);
      expect(res.body.data.metrics.completedBookings).toBe(1);
      expect(res.body.data.metrics.totalGrossRevenue).toBe(800);
      expect(res.body.data.metrics.netRevenue).toBe(720); // 90%
      expect(res.body.data.metrics.platformCommissionDue).toBe(80); // 10%
      expect(res.body.data.metrics.technicianStats.length).toBe(1);
      expect(res.body.data.metrics.technicianStats[0].technicianId).toBe(technicianId);
      expect(res.body.data.metrics.technicianStats[0].completedJobsCount).toBe(1);
    });

    it('allows company owner to update member status (e.g. INACTIVE)', async () => {
      const member = await OrganizationMember.findOne({ organization: orgId, user: technicianId });
      const res = await request(app)
        .patch(`/api/v1/companies/${orgId}/members/${member!._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          status: 'INACTIVE',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.member.status).toBe('INACTIVE');
    });
  });
});
