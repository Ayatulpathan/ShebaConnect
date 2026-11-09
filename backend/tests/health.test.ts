import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('ShebaConnect Phase 1 — Health & System Tests', () => {
  const app = createApp();

  it('GET /health should return 200 and status UP', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'UP');
    expect(res.body).toHaveProperty('service', 'ShebaConnect API');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /api/v1/health/ping should return 200 and status UP', async () => {
    const res = await request(app).get('/api/v1/health/ping');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'UP');
  });

  it('GET /api/v1/health should return detailed health with zero-cost verification', async () => {
    const res = await request(app).get('/api/v1/health');

    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('service', 'ShebaConnect API');
    expect(res.body).toHaveProperty('version', '1.0.0');
    expect(res.body).toHaveProperty('database');
    expect(res.body).toHaveProperty('system');
    expect(res.body.system).toHaveProperty('memory');
    expect(res.body).toHaveProperty('zeroCostPolicy');
    expect(res.body.zeroCostPolicy).toEqual({
      budget: '৳0 / $0',
      cloudR2Active: false,
      paidMapAPIsActive: false,
      paidPaymentGatewayActive: false,
    });
  });

  it('GET /unknown-route should return structured 404 JSON response', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
    expect(res.body.error.message).toContain('Cannot GET /api/v1/non-existent-route');
  });
});
