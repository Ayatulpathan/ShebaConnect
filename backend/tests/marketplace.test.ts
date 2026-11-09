import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Category } from '../src/models/Category.js';
import { Service } from '../src/models/Service.js';
import { ProviderServiceListing } from '../src/models/ProviderServiceListing.js';
import { generateTokens } from '../src/utils/token.js';
import { hashPassword } from '../src/utils/password.js';

describe('ShebaConnect Phase 3 — Marketplace Engine Tests', () => {
  let mongoServer: MongoMemoryServer;
  const app = createApp();

  let adminToken: string;
  let customerToken: string;
  let providerToken: string;
  let providerId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    const hashedPassword = await hashPassword('Password123');

    // Create Admin User
    const adminUser = await User.create({
      name: 'Super Admin',
      email: 'admin@shebaconnect.com',
      phone: '01700000001',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    });
    adminToken = generateTokens({
      sub: adminUser._id.toString(),
      role: 'ADMIN',
      email: adminUser.email,
    }).accessToken;

    // Create Customer User
    const customerUser = await User.create({
      name: 'Customer One',
      email: 'customer@example.com',
      phone: '01700000002',
      password: hashedPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    });
    customerToken = generateTokens({
      sub: customerUser._id.toString(),
      role: 'CUSTOMER',
      email: customerUser.email,
    }).accessToken;

    // Create Provider User
    const providerUser = await User.create({
      name: 'Mirpur AC Technician',
      email: 'provider@example.com',
      phone: '01700000003',
      password: hashedPassword,
      role: 'INDIVIDUAL_PROVIDER',
      status: 'ACTIVE',
      isVerified: true,
    });
    providerId = providerUser._id.toString();
    providerToken = generateTokens({
      sub: providerId,
      role: 'INDIVIDUAL_PROVIDER',
      email: providerUser.email,
    }).accessToken;
  }, 180000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await Category.deleteMany({});
    await Service.deleteMany({});
    await ProviderServiceListing.deleteMany({});
  });

  describe('Categories Management & Public Discovery', () => {
    it('should allow ADMIN to create a category and prevent non-admin from creating', async () => {
      // 1. Non-admin attempt should be forbidden (403)
      const nonAdminRes = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: { en: 'AC Servicing', bn: 'এসি সার্ভিসিং' },
          slug: 'ac-servicing',
          description: { en: 'AC repair in Dhaka', bn: 'ঢাকায় এসি মেরামত' },
        });

      expect(nonAdminRes.status).toBe(403);

      // 2. Admin creation should succeed (201)
      const adminRes = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: { en: 'AC Servicing and Repair', bn: 'এসি সার্ভিসিং ও মেরামত' },
          slug: 'ac-servicing',
          description: { en: 'Complete AC cooling repair', bn: 'সম্পূর্ণ এসি মেরামত' },
          icon: 'Wind',
          order: 1,
        });

      expect(adminRes.status).toBe(201);
      expect(adminRes.body.success).toBe(true);
      expect(adminRes.body.data.category.slug).toBe('ac-servicing');
    });

    it('should list all active categories publicly without authentication', async () => {
      await Category.create({
        name: { en: 'Plumbing', bn: 'প্লাম্বিং' },
        slug: 'plumbing',
        description: { en: 'Pipe leak fix', bn: 'পাইপ লিকেজ মেরামত' },
      });

      const res = await request(app).get('/api/v1/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.categories.length).toBe(1);
      expect(res.body.data.categories[0].slug).toBe('plumbing');
    });
  });

  describe('Services Management & Pricing Types', () => {
    let categoryId: string;

    beforeEach(async () => {
      const cat = await Category.create({
        name: { en: 'Electrical', bn: 'ইলেকট্রিক্যাল' },
        slug: 'electrical',
        description: { en: 'Electrical repairs', bn: 'বৈদ্যুতিক মেরামত' },
      });
      categoryId = cat._id.toString();
    });

    it('should create a service with valid pricing type in BDT', async () => {
      const res = await request(app)
        .post('/api/v1/services')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: { en: 'Ceiling Fan Installation', bn: 'সিলিং ফ্যান ইনস্টলেশন' },
          slug: 'fan-installation',
          category: categoryId,
          description: { en: 'Safe mounting of ceiling fans', bn: 'নিরাপদভাবে সিলিং ফ্যান লাগানো' },
          basePrice: 350, // ৳350 BDT
          pricingType: 'FIXED_PRICE',
          estimatedDurationMinutes: 45,
          requirements: ['Ladder', 'Ceiling hook ready'],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.service.basePrice).toBe(350);
      expect(res.body.data.service.pricingType).toBe('FIXED_PRICE');
    });

    it('should reject invalid pricing types', async () => {
      const res = await request(app)
        .post('/api/v1/services')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: { en: 'Test Service', bn: 'টেস্ট সার্ভিস' },
          slug: 'test-service',
          category: categoryId,
          description: { en: 'Description', bn: 'বর্ণনা' },
          basePrice: 500,
          pricingType: 'INVALID_PRICING_TYPE', // Invalid
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Marketplace Search & Dhaka Location Discovery', () => {
    let serviceId: string;

    beforeEach(async () => {
      const cat = await Category.create({
        name: { en: 'AC Servicing', bn: 'এসি সার্ভিসিং' },
        slug: 'ac-servicing',
        description: { en: 'AC services', bn: 'এসি সেবা' },
      });

      const srv = await Service.create({
        name: { en: 'Master AC Jet Wash', bn: 'মাস্টার এসি জেট ওয়াশ' },
        slug: 'ac-jet-wash',
        category: cat._id,
        description: { en: 'Deep outdoor and indoor cleaning', bn: 'ডিপ ইনডোর ও আউটডোর পরিষ্কার' },
        basePrice: 1200, // ৳1,200 BDT
        pricingType: 'STARTING_PRICE',
        isActive: true,
      });
      serviceId = srv._id.toString();

      // Provider lists this service in Mirpur and Dhanmondi
      await ProviderServiceListing.create({
        provider: providerId,
        service: serviceId,
        serviceAreas: ['mirpur', 'dhanmondi'],
        customPrice: 1100,
        isActive: true,
      });
    });

    it('should search services by Bangla query term', async () => {
      const res = await request(app).get('/api/v1/services/search?q=জেট');

      expect(res.status).toBe(200);
      expect(res.body.data.services.length).toBe(1);
      expect(res.body.data.services[0].name.bn).toContain('জেট ওয়াশ');
    });

    it('should filter services by Dhaka area (Mirpur)', async () => {
      // Searching in Mirpur should return the service
      const mirpurRes = await request(app).get('/api/v1/services/search?area=mirpur');
      expect(mirpurRes.status).toBe(200);
      expect(mirpurRes.body.data.services.length).toBe(1);

      // Searching in Uttara (where no provider listed it yet) should return 0
      const uttaraRes = await request(app).get('/api/v1/services/search?area=uttara');
      expect(uttaraRes.status).toBe(200);
      expect(uttaraRes.body.data.services.length).toBe(0);
    });

    it('should filter services by price range in BDT', async () => {
      const cheapRes = await request(app).get('/api/v1/services/search?maxPrice=500');
      expect(cheapRes.body.data.services.length).toBe(0);

      const affordableRes = await request(app).get(
        '/api/v1/services/search?minPrice=1000&maxPrice=1500'
      );
      expect(affordableRes.body.data.services.length).toBe(1);
    });
  });

  describe('Provider Listings & Area Validation', () => {
    let serviceId: string;

    beforeEach(async () => {
      const cat = await Category.create({
        name: { en: 'Cleaning', bn: 'ক্লিনিং' },
        slug: 'cleaning',
        description: { en: 'Home cleaning', bn: 'বাসা পরিষ্কার' },
      });
      const srv = await Service.create({
        name: { en: 'Kitchen Deep Cleaning', bn: 'কিচেন ডিপ ক্লিনিং' },
        slug: 'kitchen-cleaning',
        category: cat._id,
        description: { en: 'Kitchen degreasing', bn: 'কিচেন পরিষ্কার' },
        basePrice: 800,
        pricingType: 'FIXED_PRICE',
      });
      serviceId = srv._id.toString();
    });

    it('should allow INDIVIDUAL_PROVIDER to list service with valid Dhaka areas', async () => {
      const res = await request(app)
        .post('/api/v1/providers/listings')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          serviceId,
          serviceAreas: ['mirpur', 'gulshan', 'banani'],
          experienceYears: 4,
          customPrice: 750,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.listing.serviceAreas).toEqual(['mirpur', 'gulshan', 'banani']);
    });

    it('should reject provider listing with invalid area not in Dhaka dataset', async () => {
      const res = await request(app)
        .post('/api/v1/providers/listings')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          serviceId,
          serviceAreas: ['sylhet', 'chittagong'], // Outside Dhaka launch scope
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_SERVICE_AREA');
    });

    it('should prevent CUSTOMER from creating provider service listings', async () => {
      const res = await request(app)
        .post('/api/v1/providers/listings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          serviceId,
          serviceAreas: ['mirpur'],
        });

      expect(res.status).toBe(403);
    });
  });
});
