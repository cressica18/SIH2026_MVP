import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { generateAccessToken } from '../src/core/security.js';
import { Server } from 'http';

describe('State Consistency Tests', () => {
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

  it('should mark notification as read', async () => {
    const token = generateAccessToken({ userId: 'collector_1', phone: '+91 97654 33210', role: 'collector' });
    const res = await request(server)
      .patch('/api/notifications/NOTIF-01/read')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.read).toBe(true);
  });
});
