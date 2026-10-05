import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { generateAccessToken } from '../src/core/security.js';
import { Server } from 'http';

describe('Role Boundaries & Authorization Access Controls', () => {
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

  it('should allow admin to access admin reports and reject normal users', async () => {
    const adminToken = generateAccessToken({ userId: 'admin_1', phone: '+91 99999 99999', role: 'admin' });
    const collectorToken = generateAccessToken({ userId: 'collector_1', phone: '+91 97654 33210', role: 'collector' });

    const adminRes = await request(server)
      .get('/api/reports/admin')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminRes.status).toBe(200);

    const collectorRes = await request(server)
      .get('/api/reports/admin')
      .set('Authorization', `Bearer ${collectorToken}`);
    expect(collectorRes.status).toBe(403);
  });
});
