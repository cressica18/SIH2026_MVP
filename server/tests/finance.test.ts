import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { generateAccessToken } from '../src/core/security.js';
import { Server } from 'http';

describe('Finance Tests', () => {
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

  it('should fetch advances for collector', async () => {
    const token = generateAccessToken({ userId: 'collector_1', phone: '+91 97654 33210', role: 'collector' });
    const res = await request(server)
      .get('/api/finance/advances')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('advances');
  });

  it('should simulate AEPS cashout for collector advance', async () => {
    const token = generateAccessToken({ userId: 'collector_1', phone: '+91 97654 33210', role: 'collector' });
    const advRes = await request(server)
      .post('/api/finance/advances')
      .set('Authorization', `Bearer ${token}`)
      .send({ amountRequested: 5000, purpose: 'Equipment' });

    expect(advRes.status).toBe(201);
    const advanceId = advRes.body.id;

    const cashoutRes = await request(server)
      .post('/api/finance/aeps/simulate-cashout')
      .set('Authorization', `Bearer ${token}`)
      .send({ advanceId, aadhaarLast4: '1234' });

    expect(cashoutRes.status).toBe(200);
    expect(cashoutRes.body.advance.status).toBe('disbursed');
  });
});
