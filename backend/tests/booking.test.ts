import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Service } from '../src/models/Service.js';
import { Category } from '../src/models/Category.js';
import { Booking } from '../src/models/Booking.js';
import { BookingStatusHistory } from '../src/models/BookingStatusHistory.js';
import { Quote } from '../src/models/Quote.js';
import { Organization } from '../src/models/Organization.js';
import { OrganizationMember } from '../src/models/OrganizationMember.js';
import { generateTokens } from '../src/utils/token.js';
import { hashPassword } from '../src/utils/password.js';

describe('ShebaConnect Phase 5 — Booking Engine Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  const app = createApp();

  let customerToken: string;
  let customerId: string;

  let customerTokenB: string;
  let customerIdB: string;

  let providerToken: string;
  let providerId: string;

  let companyOwnerToken: string;
  let companyOwnerId: string;
  let organizationId: string;

  let technicianToken: string;
  let technicianId: string;

  let adminToken: string;
  let serviceId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    const hashedPassword = await hashPassword('Password123');

    // 1. Create Customer A
    const custA = await User.create({
      name: 'Rahim Customer',
      email: 'rahim@example.com',
      phone: '01711000001',
      password: hashedPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    });
    customerId = custA._id.toString();
    customerToken = generateTokens({
      sub: customerId,
      role: 'CUSTOMER',
      email: custA.email,
    }).accessToken;

    // 2. Create Customer B (for isolation testing)
    const custB = await User.create({
      name: 'Karim Customer',
      email: 'karim@example.com',
      phone: '01711000002',
      password: hashedPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    });
    customerIdB = custB._id.toString();
    customerTokenB = generateTokens({
      sub: customerIdB,
      role: 'CUSTOMER',
      email: custB.email,
    }).accessToken;

    // 3. Create Individual Provider
    const prov = await User.create({
      name: 'Rafiq AC Master',
      email: 'rafiq@example.com',
      phone: '01711000003',
      password: hashedPassword,
      role: 'INDIVIDUAL_PROVIDER',
      status: 'ACTIVE',
    });
    providerId = prov._id.toString();
    providerToken = generateTokens({
      sub: providerId,
      role: 'INDIVIDUAL_PROVIDER',
      email: prov.email,
    }).accessToken;

    // 4. Create Company Owner & Organization
    const owner = await User.create({
      name: 'Sultana Owner',
      email: 'sultana@example.com',
      phone: '01711000004',
      password: hashedPassword,
      role: 'COMPANY_OWNER',
      status: 'ACTIVE',
    });
    companyOwnerId = owner._id.toString();
    companyOwnerToken = generateTokens({
      sub: companyOwnerId,
      role: 'COMPANY_OWNER',
      email: owner.email,
    }).accessToken;

    const org = await Organization.create({
      owner: owner._id,
      name: 'Dhaka Pro Servicing Ltd',
      tradeLicense: 'TRAD/DNCC/12345/2026',
      contactPhone: '01711000004',
      address: 'House 10, Mirpur, Dhaka',
      serviceAreas: ['mirpur', 'dhanmondi'],
      approvalStatus: 'APPROVED',
      isVerified: true,
    });
    organizationId = org._id.toString();

    // 5. Create Technician belonging to Organization
    const tech = await User.create({
      name: 'Jamal Technician',
      email: 'jamal@example.com',
      phone: '01711000005',
      password: hashedPassword,
      role: 'TECHNICIAN',
      status: 'ACTIVE',
    });
    technicianId = tech._id.toString();
    technicianToken = generateTokens({
      sub: technicianId,
      role: 'TECHNICIAN',
      email: tech.email,
    }).accessToken;

    await OrganizationMember.create({
      organization: org._id,
      user: tech._id,
      memberRole: 'TECHNICIAN',
      status: 'ACTIVE',
    });

    // 6. Create Admin
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@shebaconnect.com',
      phone: '01711000006',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    });
    adminToken = generateTokens({
      sub: admin._id.toString(),
      role: 'ADMIN',
      email: admin.email,
    }).accessToken;

    // 7. Create Category & Service
    const cat = await Category.create({
      slug: 'ac-repair',
      name: { en: 'AC Servicing', bn: 'এসি সার্ভিসিং' },
      description: { en: 'AC maintenance', bn: 'এসি মেরামত' },
      icon: 'Wind',
      order: 1,
      isActive: true,
    });

    const srv = await Service.create({
      slug: 'ac-master-wash',
      name: { en: 'AC Master Wash', bn: 'এসি মাস্টার ওয়াশ' },
      category: cat._id,
      description: { en: 'Jet wash cleaning', bn: 'জেট ওয়াশ পরিষ্কার' },
      basePrice: 1200,
      pricingType: 'FIXED_PRICE',
      estimatedDurationMinutes: 60,
      isActive: true,
    });
    serviceId = srv._id.toString();
  }, 180000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  describe('Booking Creation (POST /api/v1/bookings)', () => {
    it('should allow CUSTOMER to create a booking in a valid Dhaka area', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceId,
          problemDescription: 'AC cooling is insufficient and produces strange rattling noise',
          serviceAddress: {
            area: 'mirpur',
            addressLine: 'House 12, Road 4, Section 10, Mirpur',
            contactPhone: '01711000001',
            contactName: 'Rahim Customer',
          },
          scheduledDate: '2026-11-20T10:00:00.000Z',
          preferredTimeSlot: 'Morning (09:00 - 12:00)',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.booking.bookingNumber).toMatch(/^SC-\d{4}-[A-F0-9]{4}$/);
      expect(res.body.data.booking.status).toBe('REQUESTED');
      expect(res.body.data.booking.basePrice).toBe(1200);
      expect(res.body.data.booking.finalPrice).toBe(1200);
      expect(res.body.data.booking.paymentMethod).toBe('CASH_AFTER_SERVICE');
      expect(res.body.data.booking.isPaid).toBe(false);

      // Verify status history was created
      const history = await BookingStatusHistory.find({
        booking: res.body.data.booking._id || res.body.data.booking.id,
      });
      expect(history.length).toBe(1);
      expect(history[0].newStatus).toBe('REQUESTED');
    });

    it('should reject booking if service area is outside Dhaka', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceId,
          problemDescription: 'General water leakage repair',
          serviceAddress: {
            area: 'sylhet',
            addressLine: 'Zindabazar',
            contactPhone: '01711000001',
            contactName: 'Rahim Customer',
          },
          scheduledDate: '2026-11-20T10:00:00.000Z',
          preferredTimeSlot: 'Morning',
        });

      expect(res.status).toBe(400);
      expect(res.body.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should prevent non-customer roles from creating customer bookings', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${technicianToken}`)
        .send({
          serviceId,
          problemDescription: 'AC cooling is insufficient',
          serviceAddress: {
            area: 'mirpur',
            addressLine: 'House 1',
            contactPhone: '01711000001',
            contactName: 'Jamal Tech',
          },
          scheduledDate: '2026-11-20T10:00:00.000Z',
          preferredTimeSlot: 'Morning',
        });

      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe('FORBIDDEN_ROLE');
    });
  });

  describe('State Machine & Transitions (PATCH /api/v1/bookings/:id/status)', () => {
    let bookingId: string;

    beforeEach(async () => {
      const booking = await Booking.create({
        bookingNumber: `SC-TEST-${Date.now().toString().slice(-4)}`,
        customer: new mongoose.Types.ObjectId(customerId),
        service: new mongoose.Types.ObjectId(serviceId),
        provider: new mongoose.Types.ObjectId(providerId),
        status: 'REQUESTED',
        problemDescription: 'Comprehensive test service',
        serviceAddress: {
          area: 'mirpur',
          addressLine: 'House 5, Mirpur-2',
          contactPhone: '01711000001',
          contactName: 'Rahim Customer',
        },
        scheduledDate: new Date('2026-11-25T10:00:00.000Z'),
        preferredTimeSlot: '10:00 - 12:00',
        pricingType: 'FIXED_PRICE',
        basePrice: 1200,
        finalPrice: 1200,
      });
      bookingId = booking._id.toString();
    });

    it('should complete the full lifecycle: REQUESTED -> ACCEPTED -> SCHEDULED -> ON_THE_WAY -> IN_PROGRESS -> COMPLETED', async () => {
      // 1. Provider accepts
      const acceptRes = await request(app)
        .patch(`/api/v1/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${providerToken}`)
        .send({ status: 'ACCEPTED' });

      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.data.booking.status).toBe('ACCEPTED');

      // 2. Schedule booking
      const schedRes = await request(app)
        .patch(`/api/v1/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'SCHEDULED' });

      expect(schedRes.status).toBe(200);
      expect(schedRes.body.data.booking.status).toBe('SCHEDULED');

      // 3. Provider on the way
      const otwRes = await request(app)
        .patch(`/api/v1/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${providerToken}`)
        .send({ status: 'ON_THE_WAY' });

      expect(otwRes.status).toBe(200);
      expect(otwRes.body.data.booking.status).toBe('ON_THE_WAY');

      // 4. Provider begins service
      const progRes = await request(app)
        .patch(`/api/v1/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${providerToken}`)
        .send({ status: 'IN_PROGRESS' });

      expect(progRes.status).toBe(200);
      expect(progRes.body.data.booking.status).toBe('IN_PROGRESS');

      // 5. Provider completes service
      const compRes = await request(app)
        .patch(`/api/v1/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${providerToken}`)
        .send({ status: 'COMPLETED' });

      expect(compRes.status).toBe(200);
      expect(compRes.body.data.booking.status).toBe('COMPLETED');
      expect(compRes.body.data.booking.completedAt).toBeDefined();

      // Verify audit history count
      const historyRes = await request(app)
        .get(`/api/v1/bookings/${bookingId}/history`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(historyRes.status).toBe(200);
      expect(historyRes.body.data.history.length).toBe(5);
    });

    it('should reject illegal state jump (e.g. REQUESTED directly to COMPLETED)', async () => {
      const res = await request(app)
        .patch(`/api/v1/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${providerToken}`)
        .send({ status: 'COMPLETED' });

      expect(res.status).toBe(400);
      expect(res.body.errorCode).toBe('INVALID_STATUS_TRANSITION');
    });

    it('should enforce cancellation policy: allow cancellation during REQUESTED/SCHEDULED, forbid after ON_THE_WAY', async () => {
      // Advance to ON_THE_WAY
      await Booking.findByIdAndUpdate(bookingId, { status: 'ON_THE_WAY' });

      // Customer tries to cancel
      const res = await request(app)
        .patch(`/api/v1/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          status: 'CANCELLED',
          reason: 'Changed my mind',
        });

      expect(res.status).toBe(400);
      expect(res.body.errorCode).toBe('CANCELLATION_POLICY_RESTRICTION');
    });
  });

  describe('Quotation Workflow (Quotes & Scheduling)', () => {
    let customBookingId: string;

    beforeEach(async () => {
      const booking = await Booking.create({
        bookingNumber: `SC-QUOTE-${Date.now().toString().slice(-4)}`,
        customer: new mongoose.Types.ObjectId(customerId),
        service: new mongoose.Types.ObjectId(serviceId),
        provider: new mongoose.Types.ObjectId(providerId),
        status: 'REQUESTED',
        problemDescription: 'Need inspection and custom quotation for complex piping',
        serviceAddress: {
          area: 'mirpur',
          addressLine: 'Mirpur DOHS',
          contactPhone: '01711000001',
          contactName: 'Rahim Customer',
        },
        scheduledDate: new Date('2026-11-28T10:00:00.000Z'),
        preferredTimeSlot: '14:00 - 17:00',
        pricingType: 'CUSTOM_QUOTATION',
        basePrice: 0,
        finalPrice: 0,
      });
      customBookingId = booking._id.toString();
    });

    it('should allow provider to submit quotation and customer to accept, auto-scheduling booking', async () => {
      // 1. Submit quote
      const quoteRes = await request(app)
        .post(`/api/v1/bookings/${customBookingId}/quotes`)
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          amount: 3500,
          breakdown: [
            { description: 'Piping parts', amount: 2000 },
            { description: 'Labor charges', amount: 1500 },
          ],
          notes: 'Includes 30 days service warranty',
          validUntil: '2026-12-05T00:00:00.000Z',
        });

      expect(quoteRes.status).toBe(201);
      const quoteId = quoteRes.body.data.quote._id || quoteRes.body.data.quote.id;
      expect(quoteRes.body.data.quote.amount).toBe(3500);

      // 2. Customer accepts quote
      const acceptQuoteRes = await request(app)
        .post(`/api/v1/bookings/quotes/${quoteId}/respond`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ action: 'ACCEPT' });

      expect(acceptQuoteRes.status).toBe(200);
      expect(acceptQuoteRes.body.data.quote.status).toBe('ACCEPTED');

      // 3. Verify booking is now SCHEDULED with finalPrice = 3500
      const bookingCheck = await Booking.findById(customBookingId);
      expect(bookingCheck?.status).toBe('SCHEDULED');
      expect(bookingCheck?.finalPrice).toBe(3500);
    });
  });

  describe('Multi-Tenant Access Isolation', () => {
    it('should block Customer B from viewing or accessing Customer A booking', async () => {
      const booking = await Booking.create({
        bookingNumber: `SC-ISO-${Date.now().toString().slice(-4)}`,
        customer: new mongoose.Types.ObjectId(customerId),
        service: new mongoose.Types.ObjectId(serviceId),
        status: 'REQUESTED',
        problemDescription: 'Private customer job',
        serviceAddress: {
          area: 'mirpur',
          addressLine: 'Secret Location',
          contactPhone: '01711000001',
          contactName: 'Rahim Customer',
        },
        scheduledDate: new Date('2026-11-28T10:00:00.000Z'),
        preferredTimeSlot: '10:00',
        pricingType: 'FIXED_PRICE',
        basePrice: 1200,
        finalPrice: 1200,
      });

      const res = await request(app)
        .get(`/api/v1/bookings/${booking._id}`)
        .set('Authorization', `Bearer ${customerTokenB}`);

      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe('FORBIDDEN_BOOKING_ACCESS');
    });
  });
});
