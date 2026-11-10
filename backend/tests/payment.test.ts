import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Service } from '../src/models/Service.js';
import { Category } from '../src/models/Category.js';
import { Booking } from '../src/models/Booking.js';
import { CashPayment } from '../src/models/CashPayment.js';
import { CommissionEntry } from '../src/models/CommissionEntry.js';
import { CommissionSettlement } from '../src/models/CommissionSettlement.js';
import { generateTokens } from '../src/utils/token.js';
import { hashPassword } from '../src/utils/password.js';

describe('ShebaConnect Phase 6 — Cash Payment & Commission Engine Tests', () => {
  let mongoServer: MongoMemoryServer;
  const app = createApp();

  let customerToken: string;
  let customerId: string;

  let customerTokenB: string;
  let customerIdB: string;

  let providerToken: string;
  let providerId: string;

  let adminToken: string;
  let adminId: string;

  let serviceId: string;
  let categoryId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    const hashedPassword = await hashPassword('Password123');

    // 1. Customer A
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

    // 2. Customer B
    const custB = await User.create({
      name: 'Karim Other Customer',
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

    // 3. Provider
    const prov = await User.create({
      name: 'Hasan Technician',
      email: 'hasan@example.com',
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

    // 4. Admin
    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@shebaconnect.com',
      phone: '01711000099',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    });
    adminId = admin._id.toString();
    adminToken = generateTokens({
      sub: adminId,
      role: 'ADMIN',
      email: admin.email,
    }).accessToken;

    // Category and Service
    const cat = await Category.create({
      slug: 'ac-repair',
      name: { en: 'AC Repair', bn: 'এসি মেরামত' },
      description: { en: 'AC services', bn: 'এসি সেবা' },
      icon: 'air-conditioner',
      displayOrder: 1,
      isActive: true,
    });
    categoryId = cat._id.toString();

    const srv = await Service.create({
      slug: 'ac-master-service',
      category: cat._id,
      name: { en: 'AC Master Service', bn: 'এসি মাস্টার সার্ভিস' },
      description: { en: 'Complete AC wash', bn: 'সম্পূর্ণ এসি ওয়াশ' },
      basePrice: 1200,
      pricingType: 'FIXED_PRICE',
      estimatedDurationHours: 2,
      isActive: true,
    });
    serviceId = srv._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Booking.deleteMany({});
    await CashPayment.deleteMany({});
    await CommissionEntry.deleteMany({});
    await CommissionSettlement.deleteMany({});
  });

  it('1. Provider records cash collection for completed booking', async () => {
    const booking = await Booking.create({
      bookingNumber: 'SC-2611-TEST01',
      customer: customerId,
      service: serviceId,
      provider: providerId,
      status: 'COMPLETED',
      problemDescription: 'AC cooling issue resolved',
      serviceAddress: {
        area: 'mirpur',
        addressLine: 'Mirpur-10, Dhaka',
        contactPhone: '01711000001',
        contactName: 'Rahim Customer',
      },
      scheduledDate: new Date(),
      preferredTimeSlot: 'Morning',
      pricingType: 'FIXED_PRICE',
      basePrice: 1200,
      finalPrice: 1200,
      isPaid: false,
    });

    const res = await request(app)
      .post(`/api/v1/payments/bookings/${booking._id}/collect`)
      .set('Authorization', `Bearer ${providerToken}`)
      .send({
        amountCollected: 1200,
        notes: 'Cash received from customer in full',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.payment.amountCollected).toBe(1200);
    expect(res.body.data.payment.status).toBe('COLLECTED_BY_PROVIDER');
    expect(res.body.data.payment.receiptNumber).toMatch(/^RCP-\d{4}-[A-Z0-9]+$/);
  });

  it('2. Prevents unauthorized provider from recording cash collection', async () => {
    const booking = await Booking.create({
      bookingNumber: 'SC-2611-TEST02',
      customer: customerId,
      service: serviceId,
      provider: new mongoose.Types.ObjectId(), // Different provider
      status: 'COMPLETED',
      problemDescription: 'Fan fixing',
      serviceAddress: {
        area: 'dhanmondi',
        addressLine: 'Road 27, Dhanmondi',
        contactPhone: '01711000001',
        contactName: 'Rahim',
      },
      scheduledDate: new Date(),
      preferredTimeSlot: 'Afternoon',
      pricingType: 'FIXED_PRICE',
      basePrice: 800,
      finalPrice: 800,
      isPaid: false,
    });

    const res = await request(app)
      .post(`/api/v1/payments/bookings/${booking._id}/collect`)
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ amountCollected: 800 });

    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe('FORBIDDEN_PAYMENT_COLLECTION');
  });

  it('3. Customer confirms cash handover and generates accurate 10% commission entry', async () => {
    const booking = await Booking.create({
      bookingNumber: 'SC-2611-TEST03',
      customer: customerId,
      service: serviceId,
      provider: providerId,
      status: 'COMPLETED',
      problemDescription: 'AC Cleaning',
      serviceAddress: {
        area: 'gulshan',
        addressLine: 'Gulshan 2, Dhaka',
        contactPhone: '01711000001',
        contactName: 'Rahim',
      },
      scheduledDate: new Date(),
      preferredTimeSlot: 'Morning',
      pricingType: 'FIXED_PRICE',
      basePrice: 1200,
      finalPrice: 1200,
      isPaid: false,
    });

    // Provider first records cash
    await request(app)
      .post(`/api/v1/payments/bookings/${booking._id}/collect`)
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ amountCollected: 1200 });

    // Customer confirms cash payment
    const res = await request(app)
      .post(`/api/v1/payments/bookings/${booking._id}/confirm`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ notes: 'Handed 1200 BDT cash to technician Hasan' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.payment.status).toBe('CONFIRMED');

    // Booking is now paid
    const updatedBooking = await Booking.findById(booking._id);
    expect(updatedBooking?.isPaid).toBe(true);

    // Commission entry verified: 10% of 1200 = 120 BDT platform, 1080 BDT provider net
    const commission = res.body.data.commissionEntry;
    expect(commission).toBeDefined();
    expect(commission.totalAmount).toBe(1200);
    expect(commission.commissionAmount).toBe(120);
    expect(commission.providerEarnings).toBe(1080);
    expect(commission.status).toBe('PENDING_SETTLEMENT');
  });

  it('4. Prevents an unrelated customer from confirming payment', async () => {
    const booking = await Booking.create({
      bookingNumber: 'SC-2611-TEST04',
      customer: customerId,
      service: serviceId,
      provider: providerId,
      status: 'COMPLETED',
      problemDescription: 'AC Cleaning',
      serviceAddress: {
        area: 'gulshan',
        addressLine: 'Gulshan 2, Dhaka',
        contactPhone: '01711000001',
        contactName: 'Rahim',
      },
      scheduledDate: new Date(),
      preferredTimeSlot: 'Morning',
      pricingType: 'FIXED_PRICE',
      basePrice: 1200,
      finalPrice: 1200,
      isPaid: false,
    });

    const res = await request(app)
      .post(`/api/v1/payments/bookings/${booking._id}/confirm`)
      .set('Authorization', `Bearer ${customerTokenB}`)
      .send({});

    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe('FORBIDDEN_PAYMENT_CONFIRMATION');
  });

  it('5. Allows flagging payment dispute', async () => {
    const booking = await Booking.create({
      bookingNumber: 'SC-2611-TEST05',
      customer: customerId,
      service: serviceId,
      provider: providerId,
      status: 'COMPLETED',
      problemDescription: 'AC issue',
      serviceAddress: {
        area: 'uttara',
        addressLine: 'Sector 3, Uttara',
        contactPhone: '01711000001',
        contactName: 'Rahim',
      },
      scheduledDate: new Date(),
      preferredTimeSlot: 'Morning',
      pricingType: 'FIXED_PRICE',
      basePrice: 1500,
      finalPrice: 1500,
      isPaid: false,
    });

    const res = await request(app)
      .post(`/api/v1/payments/bookings/${booking._id}/dispute`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ reason: 'Provider asked for extra 500 BDT cash beyond quotation' });

    expect(res.status).toBe(200);
    expect(res.body.data.payment.status).toBe('DISPUTED');
    expect(res.body.data.payment.disputeReason).toContain('extra 500 BDT');
  });

  it('6. Provider earnings summary calculates gross, net, and pending commission due', async () => {
    // Create 2 completed & confirmed bookings
    for (let i = 1; i <= 2; i++) {
      const b = await Booking.create({
        bookingNumber: `SC-2611-SUMM${i}`,
        customer: customerId,
        service: serviceId,
        provider: providerId,
        status: 'COMPLETED',
        problemDescription: `Job ${i}`,
        serviceAddress: {
          area: 'banani',
          addressLine: 'Banani',
          contactPhone: '01711000001',
          contactName: 'Rahim',
        },
        scheduledDate: new Date(),
        preferredTimeSlot: 'Morning',
        pricingType: 'FIXED_PRICE',
        basePrice: 1000,
        finalPrice: 1000,
        isPaid: false,
      });

      await request(app)
        .post(`/api/v1/payments/bookings/${b._id}/collect`)
        .set('Authorization', `Bearer ${providerToken}`)
        .send({ amountCollected: 1000 });

      await request(app)
        .post(`/api/v1/payments/bookings/${b._id}/confirm`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({});
    }

    const res = await request(app)
      .get('/api/v1/payments/provider/summary')
      .set('Authorization', `Bearer ${providerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalBookings).toBe(2);
    expect(res.body.data.totalGrossRevenue).toBe(2000);
    expect(res.body.data.totalPlatformCommission).toBe(200); // 10% of 2000
    expect(res.body.data.totalNetEarnings).toBe(1800);
    expect(res.body.data.pendingCommissionDue).toBe(200);
    expect(res.body.data.settledCommission).toBe(0);
  });

  it('7. Admin records manual commission settlement and updates ledger', async () => {
    // 1 completed confirmed booking with 150 BDT commission
    const booking = await Booking.create({
      bookingNumber: 'SC-2611-SETTLE01',
      customer: customerId,
      service: serviceId,
      provider: providerId,
      status: 'COMPLETED',
      problemDescription: 'Wiring setup',
      serviceAddress: {
        area: 'tejgaon',
        addressLine: 'Tejgaon Industrial Area',
        contactPhone: '01711000001',
        contactName: 'Rahim',
      },
      scheduledDate: new Date(),
      preferredTimeSlot: 'Morning',
      pricingType: 'FIXED_PRICE',
      basePrice: 1500,
      finalPrice: 1500,
      isPaid: false,
    });

    await request(app)
      .post(`/api/v1/payments/bookings/${booking._id}/collect`)
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ amountCollected: 1500 });

    const confirmRes = await request(app)
      .post(`/api/v1/payments/bookings/${booking._id}/confirm`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({});

    const entryId = confirmRes.body.data.commissionEntry._id;

    // Admin records settlement
    const settleRes = await request(app)
      .post('/api/v1/payments/admin/settle')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        providerId,
        entryIds: [entryId],
        amountSettled: 150,
        settlementMethod: 'OFFLINE_CASH_AT_HUB',
        paymentReference: 'VOUCHER-DHAKA-001',
        notes: 'Received 150 BDT cash at regional support desk',
      });

    expect(settleRes.status).toBe(201);
    expect(settleRes.body.success).toBe(true);
    expect(settleRes.body.data.settlement.settlementNumber).toMatch(/^SETTLE-\d{4}-[A-Z0-9]+$/);
    expect(settleRes.body.data.settledCount).toBe(1);

    // Verify provider summary now reflects settled commission
    const summaryRes = await request(app)
      .get('/api/v1/payments/provider/summary')
      .set('Authorization', `Bearer ${providerToken}`);

    expect(summaryRes.body.data.pendingCommissionDue).toBe(0);
    expect(summaryRes.body.data.settledCommission).toBe(150);
  });

  it('8. Structured receipt returns valid BDT and Bengali bilingual details', async () => {
    const booking = await Booking.create({
      bookingNumber: 'SC-2611-RCP01',
      customer: customerId,
      service: serviceId,
      provider: providerId,
      status: 'COMPLETED',
      problemDescription: 'AC Gas Refill',
      serviceAddress: {
        area: 'dhanmondi',
        addressLine: 'Dhanmondi 32',
        contactPhone: '01711000001',
        contactName: 'Rahim Customer',
      },
      scheduledDate: new Date(),
      preferredTimeSlot: 'Evening',
      pricingType: 'FIXED_PRICE',
      basePrice: 2000,
      finalPrice: 2000,
      isPaid: false,
    });

    await request(app)
      .post(`/api/v1/payments/bookings/${booking._id}/collect`)
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ amountCollected: 2000 });

    await request(app)
      .post(`/api/v1/payments/bookings/${booking._id}/confirm`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({});

    const res = await request(app)
      .get(`/api/v1/payments/bookings/${booking._id}/receipt`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const receipt = res.body.data.receipt;
    expect(receipt.currency).toBe('BDT');
    expect(receipt.currencySymbol).toBe('৳');
    expect(receipt.amountCollected).toBe(2000);
    expect(receipt.bookingNumber).toBe('SC-2611-RCP01');
    expect(receipt.paymentMethod).toContain('Cash After Service');
    expect(receipt.customer.name).toBe('Rahim Customer');
  });

  it('9. Admin financial report aggregates GMV and commission correctly', async () => {
    const res = await request(app)
      .get('/api/v1/payments/admin/report')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalConfirmedPayments');
    expect(res.body.data).toHaveProperty('totalGrossVolumeBDT');
    expect(res.body.data).toHaveProperty('totalCommissionEarnedBDT');
  });
});
