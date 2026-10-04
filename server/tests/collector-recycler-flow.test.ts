import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { generateAccessToken } from '../src/core/security.js';
import { Server } from 'http';

describe('Collector & Recycler Auth, Profile, and Smart Pool Flow Tests', () => {
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

  describe('OTP Auth & User Seed Roles', () => {
    it('should authenticate seeded collector user via OTP flow', async () => {
      const phone = '+91 97654 33210'; // Rajesh Kabadi (collector_1)
      const otpRes = await request(server)
        .post('/api/auth/otp/send')
        .send({ phone });
      expect(otpRes.status).toBe(200);
      const { otpChallenge } = otpRes.body;

      const verifyRes = await request(server)
        .post('/api/auth/otp/verify')
        .send({ phone, otp: '123456', otpChallenge });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.user).toHaveProperty('role', 'collector');
      expect(verifyRes.body.tokens).toHaveProperty('accessToken');
    });

    it('should authenticate seeded recycler user via OTP flow', async () => {
      const phone = '+91 98123 45678'; // EcoRecycle India Pvt Ltd (recycler_1)
      const otpRes = await request(server)
        .post('/api/auth/otp/send')
        .send({ phone });
      expect(otpRes.status).toBe(200);
      const { otpChallenge } = otpRes.body;

      const verifyRes = await request(server)
        .post('/api/auth/otp/verify')
        .send({ phone, otp: '123456', otpChallenge });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.user).toHaveProperty('role', 'recycler');
      expect(verifyRes.body.tokens).toHaveProperty('accessToken');
    });
  });

  describe('GET /api/auth/me & GET/PUT /api/users/profile', () => {
    it('should allow collector to fetch /api/auth/me and /api/users/profile', async () => {
      const token = generateAccessToken({ userId: 'collector_1', phone: '+91 97654 33210', role: 'collector' });

      const meRes = await request(server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(meRes.status).toBe(200);
      expect(meRes.body.role).toBe('collector');

      const profileRes = await request(server)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);
      expect(profileRes.status).toBe(200);
      expect(profileRes.body.profile.id).toBe('collector_1');
      expect(profileRes.body.anonCollectorId).toBeDefined();
    });

    it('should allow recycler to fetch /api/auth/me and /api/users/profile', async () => {
      const token = generateAccessToken({ userId: 'recycler_1', phone: '+91 98123 45678', role: 'recycler' });

      const meRes = await request(server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      expect(meRes.status).toBe(200);
      expect(meRes.body.role).toBe('recycler');

      const profileRes = await request(server)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);
      expect(profileRes.status).toBe(200);
      expect(profileRes.body.profile.id).toBe('recycler_1');
    });

    it('should allow a new collector to complete/update profile', async () => {
      const token = generateAccessToken({ userId: 'new_collector_100', phone: '+91 99000 11122', role: 'collector' });

      const updateRes = await request(server)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Sunil Waste Collector',
          area: 'Dharavi Sector 3',
          district: 'Mumbai',
          state: 'Maharashtra',
          primaryMaterials: ['copper', 'plastic'],
          vehicleType: 'tempo',
          collectionRadiusKm: 15,
        });

      expect(updateRes.status).toBe(201);
      expect(updateRes.body.profile.name).toBe('Sunil Waste Collector');
      expect(updateRes.body.anonCollectorId).toMatch(/^KABAD-/);

      const fetchRes = await request(server)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);
      expect(fetchRes.status).toBe(200);
      expect(fetchRes.body.profile.name).toBe('Sunil Waste Collector');
    });

    it('should allow a new recycler to complete/update profile', async () => {
      const token = generateAccessToken({ userId: 'new_recycler_200', phone: '+91 99000 33344', role: 'recycler' });

      const updateRes = await request(server)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Vikram Mehta',
          businessName: 'GreenTech Recycling Works',
          licenseNumber: 'MPCB/RO/2025/99999',
          district: 'Pune',
          state: 'Maharashtra',
          acceptedMaterials: ['metal', 'ewaste'],
          capacityKgPerDay: 10000,
        });

      expect(updateRes.status).toBe(201);
      expect(updateRes.body.profile.businessName).toBe('GreenTech Recycling Works');

      const fetchRes = await request(server)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);
      expect(fetchRes.status).toBe(200);
      expect(fetchRes.body.profile.businessName).toBe('GreenTech Recycling Works');
    });
  });

  describe('Permissions & Role Enforcement on Smart Pool & Scrap Lot Endpoints', () => {
    it('should allow collector to create a smart pool from an available lot', async () => {
      const collectorToken = generateAccessToken({ userId: 'collector_1', phone: '+91 97654 33210', role: 'collector' });

      const res = await request(server)
        .post('/api/smart-pools/create-from-lot')
        .set('Authorization', `Bearer ${collectorToken}`)
        .send({ lotId: 'lot_1' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.materialCategory).toBe('metal');
      expect(res.body.status).toBe('open');
      expect(res.body.members.length).toBeGreaterThanOrEqual(2);
    });

    it('should prevent non-collectors (e.g., recycler) from creating a scrap lot', async () => {
      const recyclerToken = generateAccessToken({ userId: 'recycler_1', phone: '+91 98123 45678', role: 'recycler' });

      const res = await request(server)
        .post('/api/scrap-lots')
        .set('Authorization', `Bearer ${recyclerToken}`)
        .send({
          materialType: 'Copper Wire',
          materialCategory: 'metal',
          estimatedWeightKg: 500,
          priceExpectedPerKg: 600,
          collectionDate: '2026-03-20',
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Insufficient permissions');
    });

    it('should prevent non-recyclers (e.g., collector) from placing a pool offer', async () => {
      const collectorToken = generateAccessToken({ userId: 'collector_1', phone: '+91 97654 33210', role: 'collector' });

      const res = await request(server)
        .post('/api/smart-pools/offers')
        .set('Authorization', `Bearer ${collectorToken}`)
        .send({
          poolId: 'pool_1',
          offeredPricePerKg: 650,
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Insufficient permissions');
    });

    it('should allow recycler to place a pool offer on an open smart pool', async () => {
      const recyclerToken = generateAccessToken({ userId: 'recycler_1', phone: '+91 98123 45678', role: 'recycler' });

      const res = await request(server)
        .post('/api/smart-pools/offers')
        .set('Authorization', `Bearer ${recyclerToken}`)
        .send({
          poolId: 'pool_1',
          offeredPricePerKg: 620,
          notes: 'High volume competitive bid',
        });

      expect(res.status).toBe(201);
      expect(res.body.offeredPricePerKg).toBe(620);
      expect(res.body.recyclerId).toBe('recycler_1');
    });

    it('should allow collector to respond to an offer for their pool', async () => {
      const collectorToken = generateAccessToken({ userId: 'collector_1', phone: '+91 97654 33210', role: 'collector' });

      const offersRes = await request(server).get('/api/smart-pools/pool_1/offers');
      expect(offersRes.status).toBe(200);
      const offerId = offersRes.body.offers[0].id;

      const respondRes = await request(server)
        .post('/api/smart-pools/offers/respond')
        .set('Authorization', `Bearer ${collectorToken}`)
        .send({
          offerId,
          action: 'accept',
        });

      expect(respondRes.status).toBe(200);
      expect(respondRes.body.offer.status).toBe('accepted');
      expect(respondRes.body.pool.status).toBe('confirmed');
    });

    it('should prevent collector from completing handover settlement', async () => {
      const collectorToken = generateAccessToken({ userId: 'collector_1', phone: '+91 97654 33210', role: 'collector' });

      const settlementsRes = await request(server).get('/api/smart-pools/settlements');
      expect(settlementsRes.status).toBe(200);
      expect(settlementsRes.body.settlements.length).toBeGreaterThan(0);
      const settlementId = settlementsRes.body.settlements[0].id;

      const res = await request(server)
        .post('/api/smart-pools/settlements/complete')
        .set('Authorization', `Bearer ${collectorToken}`)
        .send({ settlementId });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Insufficient permissions');
    });

    it('should allow recycler to complete handover settlement', async () => {
      const recyclerToken = generateAccessToken({ userId: 'recycler_1', phone: '+91 98123 45678', role: 'recycler' });

      const settlementsRes = await request(server).get('/api/smart-pools/settlements');
      expect(settlementsRes.status).toBe(200);
      expect(settlementsRes.body.settlements.length).toBeGreaterThan(0);
      const settlementId = settlementsRes.body.settlements[0].id;

      const completeRes = await request(server)
        .post('/api/smart-pools/settlements/complete')
        .set('Authorization', `Bearer ${recyclerToken}`)
        .send({ settlementId, qrCode: 'QR_HANDOVER_123' });

      expect(completeRes.status).toBe(200);
      expect(completeRes.body.status).toBe('completed');
    });
  });
});
