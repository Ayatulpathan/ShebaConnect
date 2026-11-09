import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';
import { OrganizationMember } from '../src/models/OrganizationMember.js';
import { ProviderProfile } from '../src/models/ProviderProfile.js';
import { AvailabilitySlot } from '../src/models/AvailabilitySlot.js';
import { generateTokens } from '../src/utils/token.js';
import { hashPassword } from '../src/utils/password.js';

describe('ShebaConnect Phase 4 — Provider & Company Operations Tests', () => {
  let mongoServer: MongoMemoryServer;
  const app = createApp();

  let providerToken: string;
  let providerId: string;

  let companyOwnerTokenA: string;
  let companyOwnerIdA: string;

  let companyOwnerTokenB: string;
  let companyOwnerIdB: string;

  let customerToken: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    const hashedPassword = await hashPassword('Password123');

    // 1. Create Individual Provider
    const providerUser = await User.create({
      name: 'Salim Electrician',
      email: 'salim@example.com',
      phone: '01711111111',
      password: hashedPassword,
      role: 'INDIVIDUAL_PROVIDER',
      status: 'ACTIVE',
    });
    providerId = providerUser._id.toString();
    providerToken = generateTokens({
      sub: providerId,
      role: 'INDIVIDUAL_PROVIDER',
      email: providerUser.email,
    }).accessToken;

    // 2. Create Company Owner A
    const ownerA = await User.create({
      name: 'Dhaka Care Owner',
      email: 'ownerA@example.com',
      phone: '01722222222',
      password: hashedPassword,
      role: 'COMPANY_OWNER',
      status: 'ACTIVE',
    });
    companyOwnerIdA = ownerA._id.toString();
    companyOwnerTokenA = generateTokens({
      sub: companyOwnerIdA,
      role: 'COMPANY_OWNER',
      email: ownerA.email,
    }).accessToken;

    // 3. Create Company Owner B
    const ownerB = await User.create({
      name: 'Gulshan Services Owner',
      email: 'ownerB@example.com',
      phone: '01733333333',
      password: hashedPassword,
      role: 'COMPANY_OWNER',
      status: 'ACTIVE',
    });
    companyOwnerIdB = ownerB._id.toString();
    companyOwnerTokenB = generateTokens({
      sub: companyOwnerIdB,
      role: 'COMPANY_OWNER',
      email: ownerB.email,
    }).accessToken;

    // 4. Create Customer
    const customer = await User.create({
      name: 'Regular Customer',
      email: 'customer@example.com',
      phone: '01744444444',
      password: hashedPassword,
      role: 'CUSTOMER',
      status: 'ACTIVE',
    });
    customerToken = generateTokens({
      sub: customer._id.toString(),
      role: 'CUSTOMER',
      email: customer.email,
    }).accessToken;
  }, 180000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await Organization.deleteMany({});
    await OrganizationMember.deleteMany({});
    await ProviderProfile.deleteMany({});
    await AvailabilitySlot.deleteMany({});
  });

  describe('Provider Profile, NID Verification & Availability', () => {
    it('should update provider bio and skills', async () => {
      const res = await request(app)
        .patch('/api/v1/providers/operations/me')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          bio: '10 years experience in residential air conditioning and wiring.',
          skills: ['AC Jet Wash', 'Gas Refill', 'Circuit Troubleshooting'],
          experienceYears: 10,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile.experienceYears).toBe(10);
      expect(res.body.data.profile.skills).toContain('AC Jet Wash');
    });

    it('should submit NID verification and set status to PENDING_REVIEW', async () => {
      const res = await request(app)
        .post('/api/v1/providers/operations/verification')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          nidNumber: '1234567890', // 10 digits
          documents: [
            {
              docType: 'NID',
              documentNumber: '1234567890',
            },
          ],
        });

      expect(res.status).toBe(200);
      expect(res.body.data.profile.verificationStatus).toBe('PENDING_REVIEW');
      expect(res.body.data.profile.nidNumber).toBe('1234567890');
    });

    it('should reject invalid NID format (not 10, 13, or 17 digits)', async () => {
      const res = await request(app)
        .post('/api/v1/providers/operations/verification')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          nidNumber: '12345', // Invalid
          documents: [{ docType: 'NID', documentNumber: '12345' }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should manage weekly availability schedule and reject invalid times', async () => {
      // 1. Invalid time slot (start >= end)
      const invalidRes = await request(app)
        .put('/api/v1/providers/operations/availability')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          slots: [
            {
              dayOfWeek: 1,
              startTime: '18:00',
              endTime: '09:00', // Invalid: end before start
              isAvailable: true,
            },
          ],
        });

      expect(invalidRes.status).toBe(400);
      expect(invalidRes.body.error.code).toBe('INVALID_TIME_SLOT');

      // 2. Valid availability schedule
      const validRes = await request(app)
        .put('/api/v1/providers/operations/availability')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          slots: [
            {
              dayOfWeek: 0, // Sunday
              startTime: '09:00',
              endTime: '17:00',
              isAvailable: true,
            },
            {
              dayOfWeek: 1, // Monday
              startTime: '09:00',
              endTime: '17:00',
              isAvailable: true,
            },
          ],
        });

      expect(validRes.status).toBe(200);
      expect(validRes.body.data.slots.length).toBe(2);

      // 3. Fetch availability
      const getRes = await request(app)
        .get('/api/v1/providers/operations/availability')
        .set('Authorization', `Bearer ${providerToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.slots.length).toBe(2);
    });
  });

  describe('Company Operations & Multi-Tenant Isolation', () => {
    it('should allow COMPANY_OWNER to create company and reject CUSTOMER', async () => {
      // 1. Customer blocked from creating company
      const customerRes = await request(app)
        .post('/api/v1/companies')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Fake Company',
          tradeLicense: 'TR-12345',
          contactPhone: '01711112222',
          address: 'Mirpur, Dhaka',
          serviceAreas: ['mirpur'],
        });

      expect(customerRes.status).toBe(403);

      // 2. Company Owner creates company
      const ownerRes = await request(app)
        .post('/api/v1/companies')
        .set('Authorization', `Bearer ${companyOwnerTokenA}`)
        .send({
          name: 'Dhaka Care Facility Services',
          tradeLicense: 'TR-998877',
          contactPhone: '01722222222',
          address: 'Plot 10, Road 4, Sector 3, Uttara, Dhaka',
          serviceAreas: ['uttara', 'mirpur', 'gulshan'],
          description: 'Premier cleaning and AC repair service in northern Dhaka.',
        });

      expect(ownerRes.status).toBe(201);
      expect(ownerRes.body.data.organization.approvalStatus).toBe('PENDING_APPROVAL');
      expect(ownerRes.body.data.organization.serviceAreas).toContain('uttara');
    });

    it('should allow company owner to add and remove technicians', async () => {
      // 1. Register Company A
      const orgRes = await request(app)
        .post('/api/v1/companies')
        .set('Authorization', `Bearer ${companyOwnerTokenA}`)
        .send({
          name: 'Dhaka Care Services',
          tradeLicense: 'TR-11111',
          contactPhone: '01722222222',
          address: 'Uttara, Dhaka',
          serviceAreas: ['uttara'],
        });
      const orgId = orgRes.body.data.organization._id;

      // 2. Add Technician
      const addTechRes = await request(app)
        .post(`/api/v1/companies/${orgId}/members`)
        .set('Authorization', `Bearer ${companyOwnerTokenA}`)
        .send({
          name: 'Hasan Technician',
          email: 'hasan.tech@dhakacare.com',
          phone: '01799887766',
          memberRole: 'TECHNICIAN',
          password: 'Password123',
        });

      expect(addTechRes.status).toBe(201);
      expect(addTechRes.body.data.member.memberRole).toBe('TECHNICIAN');
      expect(addTechRes.body.data.user.role).toBe('TECHNICIAN');
      const memberId = addTechRes.body.data.member._id;

      // 3. List members
      const listRes = await request(app)
        .get(`/api/v1/companies/${orgId}/members`)
        .set('Authorization', `Bearer ${companyOwnerTokenA}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.members.length).toBe(1);

      // 4. Remove technician
      const deleteRes = await request(app)
        .delete(`/api/v1/companies/${orgId}/members/${memberId}`)
        .set('Authorization', `Bearer ${companyOwnerTokenA}`);

      expect(deleteRes.status).toBe(200);
    });

    it('should enforce strict tenant isolation: Owner B cannot access or modify Owner A company', async () => {
      // 1. Register Company A
      const orgRes = await request(app)
        .post('/api/v1/companies')
        .set('Authorization', `Bearer ${companyOwnerTokenA}`)
        .send({
          name: 'Dhaka Care Services',
          tradeLicense: 'TR-11111',
          contactPhone: '01722222222',
          address: 'Uttara, Dhaka',
          serviceAreas: ['uttara'],
        });
      const orgIdA = orgRes.body.data.organization._id;

      // 2. Owner B tries to update Company A details -> Forbidden (403)
      const updateAttemptRes = await request(app)
        .patch(`/api/v1/companies/${orgIdA}`)
        .set('Authorization', `Bearer ${companyOwnerTokenB}`)
        .send({
          name: 'Hacked Name',
        });

      expect(updateAttemptRes.status).toBe(403);
      expect(updateAttemptRes.body.error.code).toBe('FORBIDDEN_ORGANIZATION_ACCESS');

      // 3. Owner B tries to view Company A members -> Forbidden (403)
      const membersAttemptRes = await request(app)
        .get(`/api/v1/companies/${orgIdA}/members`)
        .set('Authorization', `Bearer ${companyOwnerTokenB}`);

      expect(membersAttemptRes.status).toBe(403);
      expect(membersAttemptRes.body.error.code).toBe('FORBIDDEN_ORGANIZATION_ACCESS');
    });
  });
});
