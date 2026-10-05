import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { generateAccessToken } from '../src/core/security.js';
import { Server } from 'http';

describe('End-to-End SIH Demo Path Flow Test', () => {
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

  it('should run end to end collector -> smart pool -> offer -> settlement flow', async () => {
    const collectorToken = generateAccessToken({ userId: 'collector_1', phone: '+91 97654 33210', role: 'collector' });
    const recyclerToken = generateAccessToken({ userId: 'recycler_1', phone: '+91 98123 45678', role: 'recycler' });

    // 1. Collector creates smart pool
    const poolRes = await request(server)
      .post('/api/smart-pools/create-from-lot')
      .set('Authorization', `Bearer ${collectorToken}`)
      .send({ lotId: 'lot_1' });
    expect(poolRes.status).toBe(201);
    const poolId = poolRes.body.id;

    // 2. Recycler places offer
    const offerRes = await request(server)
      .post('/api/smart-pools/offers')
      .set('Authorization', `Bearer ${recyclerToken}`)
      .send({ poolId, offeredPricePerKg: 630 });
    expect(offerRes.status).toBe(201);
    const offerId = offerRes.body.id;

    // 3. Collector accepts offer
    const respondRes = await request(server)
      .post('/api/smart-pools/offers/respond')
      .set('Authorization', `Bearer ${collectorToken}`)
      .send({ offerId, action: 'accept' });
    expect(respondRes.status).toBe(200);

    // 4. Recycler completes handover
    const settlementsRes = await request(server).get('/api/smart-pools/settlements');
    expect(settlementsRes.status).toBe(200);
    const settlementId = settlementsRes.body.settlements[0].id;

    const completeRes = await request(server)
      .post('/api/smart-pools/settlements/complete')
      .set('Authorization', `Bearer ${recyclerToken}`)
      .send({ settlementId, qrCode: 'QR_DEMO_123' });

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.status).toBe('completed');
  });
});
