import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { generateAccessToken } from '../src/core/security.js';
import { Server } from 'http';

describe('Kabadiwala Connect API', () => {
  let server: Server;

  beforeAll(() => {
    return new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        resolve();
      });
    });
  });

  afterAll(() => {
    return new Promise<void>((resolve) => {
      server.close(() => {
        resolve();
      });
    });
  });

  describe('GET /api/scrap-lots', () => {
    it('should return 200 and a list of scrap lots', async () => {
      const res = await request(server).get('/api/scrap-lots');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('lots');
      expect(Array.isArray(res.body.lots)).toBe(true);
      expect(res.body.lots.length).toBeGreaterThan(0);
    });

    it('should include priceAi and quality assessment fields on scrap lots', async () => {
      const res = await request(server).get('/api/scrap-lots');
      const lot = res.body.lots[0];
      expect(lot).toHaveProperty('priceAi');
      expect(lot.priceAi).toHaveProperty('fair');
      expect(lot).toHaveProperty('quality');
      expect(lot.quality).toHaveProperty('grade');
    });
  });

  describe('POST /api/auth/otp/send', () => {
    it('should accept a valid +91 phone number', async () => {
      const res = await request(server)
        .post('/api/auth/otp/send')
        .send({ phone: '+91 97654 33210' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('otpChallenge');
    });

    it('should reject invalid phone numbers', async () => {
      const res = await request(server)
        .post('/api/auth/otp/send')
        .send({ phone: '12345' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/otp/verify', () => {
    it('should return tokens for a seeded phone after correct OTP flow', async () => {
      const phone = '+91 97654 33210';
      const otpRes = await request(server)
        .post('/api/auth/otp/send')
        .send({ phone });
      const { otpChallenge } = otpRes.body;

      const res = await request(server)
        .post('/api/auth/otp/verify')
        .send({ phone, otp: '123456', otpChallenge });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('tokens');
      expect(res.body.tokens).toHaveProperty('accessToken');
      expect(res.body.user).toHaveProperty('role', 'collector');
    });
  });

  describe('GET /api/users/profile', () => {
    it('should return user profile for collector', async () => {
      const token = generateAccessToken({ userId: 'collector_1', phone: '+91 97654 33210', role: 'collector' });
      const res = await request(server)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.profile.id).toBe('collector_1');
      expect(res.body.anonCollectorId).toBeDefined();
    });

    it('should update collector profile', async () => {
      const token = generateAccessToken({ userId: 'collector_1', phone: '+91 97654 33210', role: 'collector' });
      const res = await request(server)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Rajesh Kabadi Updated',
          area: 'Satpur Area',
          district: 'Nashik',
          state: 'Maharashtra',
        });

      expect(res.status).toBe(200);
      expect(res.body.profile.name).toBe('Rajesh Kabadi Updated');
    });
  });

  describe('GET /api/finance/risk/:farmerId', () => {
    it('should return risk profile for a collector', async () => {
      const token = generateAccessToken({ userId: 'collector_1', phone: '+91 97654 33210', role: 'collector' });
      const res = await request(server)
        .get('/api/finance/risk/collector_1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.farmerId).toBe('collector_1');
    });
  });

  describe('POST /api/finance/advances', () => {
    it('should create an advance request for collector', async () => {
      const token = generateAccessToken({ userId: 'collector_1', phone: '+91 97654 33210', role: 'collector' });
      const res = await request(server)
        .post('/api/finance/advances')
        .set('Authorization', `Bearer ${token}`)
        .send({ amountRequested: 10000, purpose: 'Equipment purchase' });

      expect(res.status).toBe(201);
      expect(res.body.amountRequested).toBe(10000);
    });
  });
});
