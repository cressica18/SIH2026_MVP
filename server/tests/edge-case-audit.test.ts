import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { generateAccessToken } from '../src/core/security.js';
import { Server } from 'http';

describe('Edge Case & Input Validation Audit', () => {
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

  it('should reject advance request with negative amount or NaN', async () => {
    const token = generateAccessToken({ userId: 'collector_1', phone: '+91 97654 33210', role: 'collector' });
    const res = await request(server)
      .post('/api/finance/advances')
      .set('Authorization', `Bearer ${token}`)
      .send({ amountRequested: -500 });

    expect(res.status).toBe(400);
  });
});
