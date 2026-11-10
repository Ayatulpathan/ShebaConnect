import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import http from 'http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { createApp } from '../src/app.js';
import { SocketService } from '../src/services/socket.service.js';
import { User } from '../src/models/User.js';
import { Service } from '../src/models/Service.js';
import { Category } from '../src/models/Category.js';
import { Booking } from '../src/models/Booking.js';
import { Notification } from '../src/models/Notification.js';
import { ChatMessage } from '../src/models/ChatMessage.js';
import { generateTokens } from '../src/utils/token.js';
import { hashPassword } from '../src/utils/password.js';

describe('ShebaConnect Phase 7 — Real-Time Communication & Notifications Tests', () => {
  let mongoServer: MongoMemoryServer;
  let server: http.Server;
  let serverPort: number;
  const app = createApp();

  let customerToken: string;
  let customerId: string;

  let customerTokenB: string;
  let customerIdB: string;

  let providerToken: string;
  let providerId: string;

  let bookingId: string;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    server = http.createServer(app);
    SocketService.init(server);

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address();
        if (typeof addr === 'object' && addr !== null) {
          serverPort = addr.port;
        }
        resolve();
      });
    });

    const hashedPassword = await hashPassword('Password123');

    // 1. Customer A
    const custA = await User.create({
      name: 'Tanvir Customer',
      email: 'tanvir@example.com',
      phone: '01711000010',
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

    // 2. Customer B (Unrelated)
    const custB = await User.create({
      name: 'Kamal Other',
      email: 'kamal@example.com',
      phone: '01711000011',
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
      name: 'Salim Electrician',
      email: 'salim@example.com',
      phone: '01711000012',
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

    // Category and Service
    const cat = await Category.create({
      slug: 'electrical-help',
      name: { en: 'Electrical', bn: 'বৈদ্যুতিক' },
      description: { en: 'Wiring & switches', bn: 'ওয়্যারিং' },
      icon: 'zap',
      displayOrder: 2,
      isActive: true,
    });

    const srv = await Service.create({
      slug: 'switch-repair',
      category: cat._id,
      name: { en: 'Switch Repair', bn: 'সুইচ মেরামত' },
      description: { en: 'Switch socket replacement', bn: 'সুইচ সকেট পরিবর্তন' },
      basePrice: 500,
      pricingType: 'FIXED_PRICE',
      estimatedDurationHours: 1,
      isActive: true,
    });

    // Booking between Customer A and Provider
    const b = await Booking.create({
      bookingNumber: 'SC-2611-COMM01',
      customer: customerId,
      service: srv._id,
      provider: providerId,
      status: 'SCHEDULED',
      problemDescription: 'Main circuit breaker tripping',
      serviceAddress: {
        area: 'mirpur',
        addressLine: 'Mirpur 12',
        contactPhone: '01711000010',
        contactName: 'Tanvir Customer',
      },
      scheduledDate: new Date(),
      preferredTimeSlot: 'Morning',
      pricingType: 'FIXED_PRICE',
      basePrice: 500,
      finalPrice: 500,
      isPaid: false,
    });
    bookingId = b._id.toString();
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Notification.deleteMany({});
    await ChatMessage.deleteMany({});
  });

  it('1. Lists notifications and tracks unread count accurately', async () => {
    // Seed 2 notifications for Customer A
    await Notification.create([
      {
        recipient: customerId,
        title: { en: 'Booking Confirmed', bn: 'বুকিং নিশ্চিত হয়েছে' },
        message: { en: 'Your booking has been scheduled', bn: 'আপনার বুকিং নির্ধারিত হয়েছে' },
        type: 'BOOKING_STATUS_CHANGED',
        isRead: false,
      },
      {
        recipient: customerId,
        title: { en: 'New Offer', bn: 'নতুন অফার' },
        message: { en: 'Seasonal home discount', bn: 'হোম ডিসকাউন্ট' },
        type: 'SYSTEM_ALERT',
        isRead: false,
      },
    ]);

    // Unread count check
    const countRes = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(countRes.status).toBe(200);
    expect(countRes.body.data.unreadCount).toBe(2);

    // List notifications
    const listRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.notifications.length).toBe(2);
    expect(listRes.body.data.total).toBe(2);
  });

  it('2. Marks single notification and all notifications as read', async () => {
    const notif = await Notification.create({
      recipient: customerId,
      title: { en: 'Booking Update', bn: 'বুকিং আপডেট' },
      message: { en: 'Provider is on the way', bn: 'প্রোভাইডার রওনা দিয়েছেন' },
      type: 'BOOKING_STATUS_CHANGED',
      isRead: false,
    });

    // Mark single as read
    const readRes = await request(app)
      .patch(`/api/v1/notifications/${notif._id}/read`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(readRes.status).toBe(200);
    expect(readRes.body.data.notification.isRead).toBe(true);

    // Create another unread
    await Notification.create({
      recipient: customerId,
      title: { en: 'Alert', bn: 'বিজ্ঞপ্তি' },
      message: { en: 'Test', bn: 'পরীক্ষা' },
      type: 'SYSTEM_ALERT',
      isRead: false,
    });

    // Mark all as read
    const allRes = await request(app)
      .patch('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(allRes.status).toBe(200);
    expect(allRes.body.data.modifiedCount).toBe(1);

    const countRes = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(countRes.body.data.unreadCount).toBe(0);
  });

  it('3. Sends chat message via HTTP fallback and creates in-app notification for recipient', async () => {
    const res = await request(app)
      .post(`/api/v1/chat/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ content: 'Hello, please arrive around 10:30 AM.' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message.content).toBe('Hello, please arrive around 10:30 AM.');
    expect(res.body.data.message.sender.name).toBe('Tanvir Customer');

    // Verify offline fallback notification was generated for the provider
    const notif = await Notification.findOne({
      recipient: providerId,
      type: 'NEW_CHAT_MESSAGE',
    });
    expect(notif).toBeDefined();
    expect(notif?.message.en).toContain('Hello, please arrive');
  });

  it('4. Retrieves message history and allows marking messages as read', async () => {
    // Send 1 message from Customer
    await request(app)
      .post(`/api/v1/chat/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ content: 'I am at home waiting for the service.' });

    // Send 1 reply from Provider
    await request(app)
      .post(`/api/v1/chat/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ content: 'Understood, I have the required replacement breaker.' });

    // Provider fetches message history
    const historyRes = await request(app)
      .get(`/api/v1/chat/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${providerToken}`);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.data.messages.length).toBe(2);

    // Provider marks messages as read
    const readRes = await request(app)
      .patch(`/api/v1/chat/bookings/${bookingId}/read`)
      .set('Authorization', `Bearer ${providerToken}`);

    expect(readRes.status).toBe(200);
    expect(readRes.body.data.modifiedCount).toBeGreaterThanOrEqual(1);
  });

  it('5. Strictly rejects unauthorized user from viewing or sending chat messages', async () => {
    // Customer B attempts to send message to Customer A's booking
    const sendRes = await request(app)
      .post(`/api/v1/chat/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${customerTokenB}`)
      .send({ content: 'Unauthorized intrusion attempt' });

    expect(sendRes.status).toBe(403);
    expect(sendRes.body.errorCode).toBe('FORBIDDEN_CHAT_ACCESS');

    // Customer B attempts to view message history
    const viewRes = await request(app)
      .get(`/api/v1/chat/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${customerTokenB}`);

    expect(viewRes.status).toBe(403);
    expect(viewRes.body.errorCode).toBe('FORBIDDEN_CHAT_ACCESS');
  });

  it('6. Socket.IO connection rejects unauthenticated clients and accepts valid JWT tokens', async () => {
    const serverUrl = `http://localhost:${serverPort}`;

    // 1. Connection without token -> rejected
    const unauthSocket: ClientSocketType = ClientSocket(serverUrl, {
      transports: ['websocket'],
      autoConnect: false,
    });

    const connError = await new Promise<string>((resolve) => {
      unauthSocket.on('connect_error', (err) => {
        resolve(err.message);
      });
      unauthSocket.connect();
    });

    expect(connError).toBe('AUTH_TOKEN_MISSING');
    unauthSocket.disconnect();

    // 2. Connection with valid token -> connects
    const authSocket: ClientSocketType = ClientSocket(serverUrl, {
      transports: ['websocket'],
      auth: { token: customerToken },
      autoConnect: false,
    });

    const isConnected = await new Promise<boolean>((resolve) => {
      authSocket.on('connect', () => {
        resolve(true);
      });
      authSocket.connect();
    });

    expect(isConnected).toBe(true);
    authSocket.disconnect();
  });

  it('7. Real-time chat: Authorized client joins booking room and broadcasts message', async () => {
    const serverUrl = `http://localhost:${serverPort}`;

    // Client A (Customer)
    const socketA: ClientSocketType = ClientSocket(serverUrl, {
      transports: ['websocket'],
      auth: { token: customerToken },
    });

    // Client B (Provider)
    const socketB: ClientSocketType = ClientSocket(serverUrl, {
      transports: ['websocket'],
      auth: { token: providerToken },
    });

    await Promise.all([
      new Promise<void>((res) => socketA.on('connect', () => res())),
      new Promise<void>((res) => socketB.on('connect', () => res())),
    ]);

    // Both join the booking room
    socketA.emit('join_booking_chat', { bookingId });
    socketB.emit('join_booking_chat', { bookingId });

    await new Promise<void>((res) => {
      socketA.on('joined_booking_chat', (data) => {
        expect(data.bookingId).toBe(bookingId);
        res();
      });
    });

    // Client B listens for incoming real-time message
    const messagePromise = new Promise<any>((resolve) => {
      socketB.on('new_message', (msg) => {
        resolve(msg);
      });
    });

    // Client A sends message via WebSocket
    socketA.emit('send_message', {
      bookingId,
      content: 'Live WebSocket chat test message',
    });

    const receivedMessage = await messagePromise;
    expect(receivedMessage.content).toBe('Live WebSocket chat test message');
    expect(receivedMessage.booking.toString()).toBe(bookingId);

    socketA.disconnect();
    socketB.disconnect();
  });
});
