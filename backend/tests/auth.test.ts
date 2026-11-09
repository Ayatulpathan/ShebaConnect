import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { User } from '../src/models/User.js';

describe('ShebaConnect Phase 2 — Authentication & RBAC Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  const app = createApp();

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  }, 180000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('User Registration (POST /api/v1/auth/register)', () => {
    it('should register a new CUSTOMER successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Rahim Ahmed',
          email: 'rahim@example.com',
          phone: '01712345678',
          password: 'Password123',
          role: 'CUSTOMER',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe('Rahim Ahmed');
      expect(res.body.data.user.email).toBe('rahim@example.com');
      expect(res.body.data.user.role).toBe('CUSTOMER');
      expect(res.body.data.user.password).toBeUndefined(); // Password must never be exposed
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');

      // Verify user persisted in database with Argon2id hash
      const dbUser = await User.findOne({ email: 'rahim@example.com' }).select('+password');
      expect(dbUser).not.toBeNull();
      expect(dbUser?.password).toMatch(/^\$argon2id\$/);
    });

    it('should allow registering as INDIVIDUAL_PROVIDER and COMPANY_OWNER', async () => {
      const providerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Karim Electrician',
          email: 'karim@example.com',
          phone: '01812345678',
          password: 'Password123',
          role: 'INDIVIDUAL_PROVIDER',
        });
      expect(providerRes.status).toBe(201);
      expect(providerRes.body.data.user.role).toBe('INDIVIDUAL_PROVIDER');

      const companyRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Dhaka Care Ltd Owner',
          email: 'owner@dhakacare.com',
          phone: '01912345678',
          password: 'Password123',
          role: 'COMPANY_OWNER',
        });
      expect(companyRes.status).toBe(201);
      expect(companyRes.body.data.user.role).toBe('COMPANY_OWNER');
    });

    it('should reject registration attempting to claim ADMIN role (Privilege Escalation Prevention)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Hacker',
          email: 'admin_attempt@example.com',
          phone: '01700000000',
          password: 'Password123',
          role: 'ADMIN',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject registration with invalid Bangladesh phone number', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Invalid Phone',
          email: 'badphone@example.com',
          phone: '123456', // Invalid format
          password: 'Password123',
          role: 'CUSTOMER',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject duplicate email or phone numbers', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'First User',
          email: 'duplicate@example.com',
          phone: '01711112222',
          password: 'Password123',
        });

      const duplicateEmailRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Second User',
          email: 'duplicate@example.com',
          phone: '01799998888',
          password: 'Password123',
        });
      expect(duplicateEmailRes.status).toBe(409);
      expect(duplicateEmailRes.body.error.code).toBe('EMAIL_EXISTS');

      const duplicatePhoneRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Third User',
          email: 'unique@example.com',
          phone: '01711112222',
          password: 'Password123',
        });
      expect(duplicatePhoneRes.status).toBe(409);
      expect(duplicatePhoneRes.body.error.code).toBe('PHONE_EXISTS');
    });
  });

  describe('User Login (POST /api/v1/auth/login)', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test Customer',
          email: 'login@example.com',
          phone: '01733334444',
          password: 'CorrectPassword123',
          role: 'CUSTOMER',
        });
    });

    it('should log in successfully with valid email and password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'login@example.com',
          password: 'CorrectPassword123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('login@example.com');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
    });

    it('should log in successfully with valid BD phone number', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: '01733334444',
          password: 'CorrectPassword123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.phone).toBe('01733334444');
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: 'login@example.com',
          password: 'WrongPassword999',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('Current User & Address Management (Protected Routes)', () => {
    let accessToken: string;

    beforeEach(async () => {
      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Address Tester',
          email: 'address@example.com',
          phone: '01755556666',
          password: 'Password123',
        });
      accessToken = registerRes.body.data.accessToken;
    });

    it('GET /api/v1/auth/me should return authenticated user profile', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('address@example.com');
    });

    it('GET /api/v1/auth/me should fail with 401 without Bearer token', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_TOKEN_MISSING');
    });

    it('should add, list, and delete Dhaka addresses', async () => {
      // 1. Add Address
      const addRes = await request(app)
        .post('/api/v1/users/addresses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          label: 'Home',
          area: 'mirpur',
          addressLine: 'House 12, Road 5, Block C, Mirpur-2, Dhaka',
          isDefault: true,
        });

      expect(addRes.status).toBe(201);
      expect(addRes.body.data.addresses.length).toBe(1);
      expect(addRes.body.data.addresses[0].area).toBe('mirpur');
      expect(addRes.body.data.addresses[0].isDefault).toBe(true);

      const addressId = addRes.body.data.addresses[0]._id;

      // 2. Fetch Addresses
      const listRes = await request(app)
        .get('/api/v1/users/addresses')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.addresses.length).toBe(1);

      // 3. Delete Address
      const deleteRes = await request(app)
        .delete(`/api/v1/users/addresses/${addressId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.data.addresses.length).toBe(0);
    });
  });

  describe('Token Refresh & Token Rotation', () => {
    it('should issue new tokens and rotate refresh token', async () => {
      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Refresh Tester',
          email: 'refresh@example.com',
          phone: '01777778888',
          password: 'Password123',
        });

      const initialRefreshToken = registerRes.body.data.refreshToken;

      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: initialRefreshToken });

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.success).toBe(true);
      expect(refreshRes.body.data).toHaveProperty('accessToken');
      expect(refreshRes.body.data).toHaveProperty('refreshToken');
      expect(refreshRes.body.data.refreshToken).not.toBe(initialRefreshToken);

      // Reuse detection: Old refresh token should now be rejected
      const reusedRes = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: initialRefreshToken });

      expect(reusedRes.status).toBe(401);
      expect(reusedRes.body.error.code).toBe('TOKEN_REUSE_DETECTED');
    });
  });
});
