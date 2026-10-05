import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { generateAccessToken } from '../src/core/security.js';
import { Server } from 'http';

describe('Auth Flow Tests', () => {
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

  it('should authenticate collector via OTP flow', async () => {
    const phone = '+91 97654 33210';
    const otpRes = await request(server).post('/api/auth/otp/send').send({ phone });
    expect(otpRes.status).toBe(200);

    const verifyRes = await request(server)
      .post('/api/auth/otp/verify')
      .send({ phone, otp: '123456', otpChallenge: otpRes.body.otpChallenge });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.user.role).toBe('collector');
  });

  it('should authenticate admin via special phone', async () => {
    const phone = '+91 99999 99999';
    const otpRes = await request(server).post('/api/auth/otp/send').send({ phone });
    expect(otpRes.status).toBe(200);

    const verifyRes = await request(server)
      .post('/api/auth/otp/verify')
      .send({ phone, otp: '123456', otpChallenge: otpRes.body.otpChallenge });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.user.role).toBe('admin');
  });
});
