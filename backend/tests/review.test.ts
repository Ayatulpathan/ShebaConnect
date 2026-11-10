import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
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
import { Review } from '../src/models/Review.js';
import { ProviderProfile } from '../src/models/ProviderProfile.js';
import { generateTokens } from '../src/utils/token.js';
import { hashPassword } from '../src/utils/password.js';

describe('ShebaConnect Phase 8 — Reviews, Ratings & Reputation System Tests', () => {
  let mongoServer: MongoMemoryServer;
  let server: http.Server;
  const app = createApp();

  let customerToken: string;
  let customerId: string;

  let otherCustomerToken: string;
  let otherCustomerId: string;

  let providerToken: string;
  let providerId: string;

  let serviceId: string;
  let completedBookingId: string;
  let inProgressBookingId: string;
  let unpaidBookingId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    server = http.createServer(app);
    SocketService.init(server);

    const hashedPassword = await hashPassword('Password123');

    // 1. Customer
    const cust = await User.create({
      name: 'Rahim Customer',
      email: 'rahim.customer@example.com',
      phone: '01711000030',
      password: hashedPassword,
      role: 'CUSTOMER',
    });
    customerId = cust._id.toString();
    customerToken = generateTokens({
      sub: cust._id.toString(),
      role: cust.role,
      email: cust.email,
    }).accessToken;

    // 2. Other Customer
    const otherCust = await User.create({
      name: 'Karim Other',
      email: 'karim.other@example.com',
      phone: '01711000031',
      password: hashedPassword,
      role: 'CUSTOMER',
    });
    otherCustomerId = otherCust._id.toString();
    otherCustomerToken = generateTokens({
      sub: otherCust._id.toString(),
      role: otherCust.role,
      email: otherCust.email,
    }).accessToken;

    // 3. Provider
    const prov = await User.create({
      name: 'Salam Technician',
      email: 'salam.tech@example.com',
      phone: '01811000030',
      password: hashedPassword,
      role: 'INDIVIDUAL_PROVIDER',
    });
    providerId = prov._id.toString();
    providerToken = generateTokens({
      sub: prov._id.toString(),
      role: prov.role,
      email: prov.email,
    }).accessToken;

    await ProviderProfile.create({
      user: prov._id,
      bio: 'Expert AC Technician',
      skills: ['AC Repair', 'Cooling'],
      experienceYears: 4,
      verificationStatus: 'VERIFIED',
    });

    // 4. Category & Service
    const category = await Category.create({
      name: { en: 'AC Services', bn: 'এসি সার্ভিস' },
      slug: 'ac-services-rev',
      description: { en: 'AC repair', bn: 'এসি মেরামত' },
      icon: 'air-vent',
    });

    const srv = await Service.create({
      name: { en: 'AC Master Servicing', bn: 'এসি মাস্টার সার্ভিসিং' },
      slug: 'ac-master-servicing-rev',
      category: category._id,
      description: { en: 'Deep AC cleaning', bn: 'সম্পূর্ণ এসি ওয়াশ ও সার্ভিস' },
      basePrice: 1200,
      pricingType: 'FIXED_PRICE',
      estimatedDurationMinutes: 60,
    });
    serviceId = srv._id.toString();

    // 5. Completed & Paid Booking (Eligible for review)
    const b1 = await Booking.create({
      bookingNumber: 'BK-REV-001',
      customer: cust._id,
      service: srv._id,
      provider: prov._id,
      status: 'COMPLETED',
      problemDescription: 'AC blowing warm air',
      serviceAddress: {
        area: 'mirpur',
        addressLine: 'House 12, Road 4, Mirpur-10',
        contactPhone: '01711000030',
        contactName: 'Rahim',
      },
      scheduledDate: new Date(),
      preferredTimeSlot: '10:00 AM - 12:00 PM',
      pricingType: 'FIXED_PRICE',
      basePrice: 1200,
      finalPrice: 1200,
      isPaid: true,
      completedAt: new Date(),
    });
    completedBookingId = b1._id.toString();

    // 6. In-Progress Booking (Ineligible: not completed)
    const b2 = await Booking.create({
      bookingNumber: 'BK-REV-002',
      customer: cust._id,
      service: srv._id,
      provider: prov._id,
      status: 'IN_PROGRESS',
      problemDescription: 'AC leaking water',
      serviceAddress: {
        area: 'mirpur',
        addressLine: 'House 12, Road 4, Mirpur-10',
        contactPhone: '01711000030',
        contactName: 'Rahim',
      },
      scheduledDate: new Date(),
      preferredTimeSlot: '02:00 PM - 04:00 PM',
      pricingType: 'FIXED_PRICE',
      basePrice: 1200,
      finalPrice: 1200,
      isPaid: false,
    });
    inProgressBookingId = b2._id.toString();

    // 7. Completed but Unpaid Booking (Ineligible: not paid)
    const b3 = await Booking.create({
      bookingNumber: 'BK-REV-003',
      customer: cust._id,
      service: srv._id,
      provider: prov._id,
      status: 'COMPLETED',
      problemDescription: 'AC gas recharge',
      serviceAddress: {
        area: 'mirpur',
        addressLine: 'House 12, Road 4, Mirpur-10',
        contactPhone: '01711000030',
        contactName: 'Rahim',
      },
      scheduledDate: new Date(),
      preferredTimeSlot: '04:00 PM - 06:00 PM',
      pricingType: 'FIXED_PRICE',
      basePrice: 1500,
      finalPrice: 1500,
      isPaid: false,
      completedAt: new Date(),
    });
    unpaidBookingId = b3._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('Review Submission Eligibility & Rules', () => {
    it('rejects review if booking is not completed', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId: inProgressBookingId,
          rating: 5,
          categories: { punctuality: 5, quality: 5, behavior: 5, costTransparency: 5 },
          comment: 'Very good technician, recommended!',
        });

      expect(res.status).toBe(400);
      expect(res.body.errorCode).toBe('BOOKING_NOT_COMPLETED');
    });

    it('rejects review if booking is completed but payment is not confirmed', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId: unpaidBookingId,
          rating: 4,
          categories: { punctuality: 4, quality: 4, behavior: 4, costTransparency: 4 },
          comment: 'Good service but waiting for cash confirmation',
        });

      expect(res.status).toBe(400);
      expect(res.body.errorCode).toBe('PAYMENT_REQUIRED_BEFORE_REVIEW');
    });

    it('rejects review from a user who is not the customer of the booking', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${otherCustomerToken}`)
        .send({
          bookingId: completedBookingId,
          rating: 5,
          categories: { punctuality: 5, quality: 5, behavior: 5, costTransparency: 5 },
          comment: 'Impersonating another customer review',
        });

      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe('FORBIDDEN_REVIEW');
    });

    it('successfully submits review for eligible completed and paid booking', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId: completedBookingId,
          rating: 5,
          categories: { punctuality: 5, quality: 5, behavior: 5, costTransparency: 5 },
          comment: 'Excellent AC cleaning! Arrived on time and worked cleanly.',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.review.rating).toBe(5);
      expect(res.body.data.review.status).toBe('ACTIVE');

      // Verify rolling average updated in ProviderProfile
      const providerProfile = await ProviderProfile.findOne({ user: providerId });
      expect(providerProfile?.ratingAverage).toBe(5);
      expect(providerProfile?.ratingCount).toBe(1);
      expect(providerProfile?.totalCompletedJobs).toBe(1);

      // Verify rolling average updated in Service
      const updatedService = await Service.findById(serviceId);
      expect(updatedService?.ratingAverage).toBe(5);
      expect(updatedService?.ratingCount).toBe(1);
    });

    it('rejects duplicate review for the same booking', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          bookingId: completedBookingId,
          rating: 4,
          categories: { punctuality: 4, quality: 4, behavior: 4, costTransparency: 4 },
          comment: 'Submitting a duplicate rating attempt',
        });

      expect(res.status).toBe(409);
      expect(res.body.errorCode).toBe('REVIEW_ALREADY_EXISTS');
    });
  });

  describe('Provider Reply Feature', () => {
    let reviewId: string;

    beforeAll(async () => {
      const rev = await Review.findOne({ booking: completedBookingId });
      reviewId = rev!._id.toString();
    });

    it('rejects reply from an unrelated user', async () => {
      const res = await request(app)
        .post(`/api/v1/reviews/${reviewId}/reply`)
        .set('Authorization', `Bearer ${otherCustomerToken}`)
        .send({
          reply: 'Thank you for your business!',
        });

      expect(res.status).toBe(403);
      expect(res.body.errorCode).toBe('FORBIDDEN_REVIEW_REPLY');
    });

    it('allows assigned provider to reply politely to the review', async () => {
      const res = await request(app)
        .post(`/api/v1/reviews/${reviewId}/reply`)
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          reply: 'Thank you Rahim bhai! Happy to keep your AC cold.',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.review.providerReply).toContain('Thank you Rahim bhai');
      expect(res.body.data.review.repliedAt).toBeDefined();
    });
  });

  describe('Public Review Retrieval & Breakdown', () => {
    it('fetches reviews and statistical breakdown for a service', async () => {
      const res = await request(app).get(`/api/v1/reviews/service/${serviceId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary.totalReviews).toBe(1);
      expect(res.body.data.summary.averageRating).toBe(5);
      expect(res.body.data.summary.breakdown['5']).toBe(1);
      expect(res.body.data.reviews.length).toBe(1);
      expect(res.body.data.reviews[0].customer.name).toBe('Rahim Customer');
    });

    it('fetches review for a specific booking', async () => {
      const res = await request(app).get(`/api/v1/reviews/booking/${completedBookingId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.review).toBeDefined();
      expect(res.body.data.review.rating).toBe(5);
      expect(res.body.data.review.providerReply).toBeDefined();
    });
  });
});
