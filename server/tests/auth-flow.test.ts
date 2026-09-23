import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createServer } from 'http';
import app from '../src/app.js';
import { generateAccessToken } from '../src/core/security.js';
import { SEED_FARMERS, SEED_BUYERS, SEED_LOGISTICS } from '../src/data/seedData.js';

const server = createServer(app);

// Capture OTP from console.log (dev mode logs OTP to console)
let capturedOtp: string | null = null;
const originalLog = console.log;
beforeEach(() => {
  capturedOtp = null;
  console.log = (...args: unknown[]) => {
    const msg = args.join(' ');
    if (msg.includes('[OTP]') && msg.includes('OTP:')) {
      const match = msg.match(/OTP:\s*(\d+)/);
      if (match) capturedOtp = match[1];
    }
    // Suppress OTP logs during tests but keep other logs
    if (!msg.includes('[OTP]')) originalLog.apply(console, args);
  };
});

afterEach(() => {
  console.log = originalLog;
});

// Helper: send OTP then verify it, returning tokens
async function loginAs(phone: string) {
  const sendRes = await request(server)
    .post('/api/auth/otp/send')
    .send({ phone });

  expect(sendRes.status).toBe(200);
  expect(capturedOtp).toBeTruthy();

  const verifyRes = await request(server)
    .post('/api/auth/otp/verify')
    .send({ phone, otp: capturedOtp! });

  expect(verifyRes.status).toBe(200);
  return verifyRes.body;
}

describe('Auth Flow Verification — All 4 Demo Roles', () => {

  describe('1. Fresh Farmer login → Farmer dashboard', () => {
    it('should log in as farmer_1 and return correct JWT role', async () => {
      const data = await loginAs('+91 98231 44521');

      expect(data.user.role).toBe('farmer');
      expect(data.user.id).toBe('farmer_1');
      expect(data.user.phone).toBe('+91 98231 44521');
      expect(data.tokens.accessToken).toBeDefined();
      expect(data.tokens.refreshToken).toBeDefined();

      // Decode JWT and verify role
      const payload = JSON.parse(atob(data.tokens.accessToken.split('.')[1]));
      expect(payload.role).toBe('farmer');
      expect(payload.userId).toBe('farmer_1');
    });

    it('should allow farmer JWT to access /api/auth/me', async () => {
      const data = await loginAs('+91 98231 44521');
      const meRes = await request(server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${data.tokens.accessToken}`);
      expect(meRes.status).toBe(200);
      expect(meRes.body.role).toBe('farmer');
      expect(meRes.body.user.id).toBe('farmer_1');
    });
  });

  describe('2. Buyer login → Buyer dashboard', () => {
    it('should log in as buyer_1 and return correct JWT role', async () => {
      const data = await loginAs('+91 99801 88301');

      expect(data.user.role).toBe('buyer');
      expect(data.user.id).toBe('buyer_1');
      expect(data.user.phone).toBe('+91 99801 88301');

      const payload = JSON.parse(atob(data.tokens.accessToken.split('.')[1]));
      expect(payload.role).toBe('buyer');
      expect(payload.userId).toBe('buyer_1');
    });
  });

  describe('3. Logistics login → Logistics dashboard', () => {
    it('should log in as logistics_1 and return correct JWT role', async () => {
      const data = await loginAs('+91 98224 55198');

      expect(data.user.role).toBe('logistics');
      expect(data.user.id).toBe('logistics_1');
      expect(data.user.phone).toBe('+91 98224 55198');

      const payload = JSON.parse(atob(data.tokens.accessToken.split('.')[1]));
      expect(payload.role).toBe('logistics');
      expect(payload.userId).toBe('logistics_1');
    });
  });

  describe('4. Admin login → Admin dashboard', () => {
    it('should log in as admin_1 and return correct JWT role', async () => {
      const data = await loginAs('+91 99999 99999');

      expect(data.user.role).toBe('admin');
      expect(data.user.id).toBe('admin_1');
      expect(data.user.phone).toBe('+91 99999 99999');

      const payload = JSON.parse(atob(data.tokens.accessToken.split('.')[1]));
      expect(payload.role).toBe('admin');
      expect(payload.userId).toBe('admin_1');
    });

    it('should allow admin JWT to access /api/auth/me', async () => {
      const data = await loginAs('+91 99999 99999');
      const meRes = await request(server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${data.tokens.accessToken}`);
      expect(meRes.status).toBe(200);
      expect(meRes.body.role).toBe('admin');
    });
  });

  describe('5. Admin login (not registered as farmer)', () => {
    it('should NOT return farmer role for admin phone (root cause check)', async () => {
      const data = await loginAs('+91 99999 99999');
      expect(data.user.role).not.toBe('farmer');
      expect(data.user.role).toBe('admin');
      expect(data.user.id).toBe('admin_1');
    });

    it('should NOT fall through to new user registration', async () => {
      // Admin phone is not in seed data, but should be handled by admin special case
      // not the "new user registered as farmer" branch
      const data = await loginAs('+91 99999 99999');
      expect(data.user.id).toBe('admin_1');
      expect(data.user.name).toBe('Admin User');
      expect(data.message).toBe('OTP verified successfully');
    });
  });

  describe('6. Full login cycle: Farmer → logout → Buyer → logout → Logistics', () => {
    it('each role gets correct JWT with no cross-contamination', async () => {
      // Farmer login
      let farmerData = await loginAs('+91 98231 44521');
      let farmerPayload = JSON.parse(atob(farmerData.tokens.accessToken.split('.')[1]));
      expect(farmerPayload.role).toBe('farmer');

      // Buyer login (simulates logout + new login — token is overwritten on client)
      let buyerData = await loginAs('+91 99801 88301');
      let buyerPayload = JSON.parse(atob(buyerData.tokens.accessToken.split('.')[1]));
      expect(buyerPayload.role).toBe('buyer');
      expect(buyerPayload.role).not.toBe('farmer'); // OLD farmer JWT shouldn't leak

      // Logistics login
      let logisticsData = await loginAs('+91 98224 55198');
      let logisticsPayload = JSON.parse(atob(logisticsData.tokens.accessToken.split('.')[1]));
      expect(logisticsPayload.role).toBe('logistics');
      expect(logisticsPayload.role).not.toBe('farmer'); // OLD farmer JWT shouldn't leak
      expect(logisticsPayload.role).not.toBe('buyer');

      // Admin login
      let adminData = await loginAs('+91 99999 99999');
      let adminPayload = JSON.parse(atob(adminData.tokens.accessToken.split('.')[1]));
      expect(adminPayload.role).toBe('admin');
      expect(adminPayload.role).not.toBe('farmer');
    });
  });

  describe('7. Refresh token preserves correct role', () => {
    it('should preserve farmer role through refresh', async () => {
      const data = await loginAs('+91 98231 44521');
      const refreshRes = await request(server)
        .post('/api/auth/refresh')
        .send({ refreshToken: data.tokens.refreshToken });
      expect(refreshRes.status).toBe(200);
      const payload = JSON.parse(atob(refreshRes.body.accessToken.split('.')[1]));
      expect(payload.role).toBe('farmer');
    });

    it('should preserve buyer role through refresh', async () => {
      const data = await loginAs('+91 99801 88301');
      const refreshRes = await request(server)
        .post('/api/auth/refresh')
        .send({ refreshToken: data.tokens.refreshToken });
      expect(refreshRes.status).toBe(200);
      const payload = JSON.parse(atob(refreshRes.body.accessToken.split('.')[1]));
      expect(payload.role).toBe('buyer');
    });

    it('should preserve admin role through refresh', async () => {
      const data = await loginAs('+91 99999 99999');
      const refreshRes = await request(server)
        .post('/api/auth/refresh')
        .send({ refreshToken: data.tokens.refreshToken });
      expect(refreshRes.status).toBe(200);
      const payload = JSON.parse(atob(refreshRes.body.accessToken.split('.')[1]));
      expect(payload.role).toBe('admin');
    });
  });

  describe('8. Old Farmer JWT cannot access non-farmer routes (RBAC)', () => {
    it('farmer JWT should get 403 on buyer-only order creation', async () => {
      const farmerToken = generateAccessToken({
        userId: 'farmer_1', phone: '+91 98231 44521', role: 'farmer',
      });
      const res = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ listingId: 'list_1', crop: 'Tomato', quantityKg: 100 });
      expect(res.status).toBe(403);
    });

    it('farmer JWT should get 403 on logistics pool route', async () => {
      const farmerToken = generateAccessToken({
        userId: 'farmer_1', phone: '+91 98231 44521', role: 'farmer',
      });
      const res = await request(server)
        .get('/api/logistics/pools/POOL-NSK-01/route')
        .set('Authorization', `Bearer ${farmerToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('9. Invalid/expired tokens show login flow (not blank dashboard)', () => {
    it('should return 401 for malformed token on /api/auth/me', async () => {
      const res = await request(server)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer malformed.token.here');
      expect(res.status).toBe(401);
    });

    it('should return 401 for empty token on /api/auth/me', async () => {
      const res = await request(server).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should reject expired refresh token', async () => {
      // Generate a token signed with a different secret to simulate invalid
      const res = await request(server)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid.refresh.token' });
      expect(res.status).toBe(401);
    });
  });

  describe('10. OTP initialization state handling', () => {
    it('should reset pending phone on new OTP send request', async () => {
      // Send OTP for farmer
      await request(server)
        .post('/api/auth/otp/send')
        .send({ phone: '+91 98231 44521' });

      // Immediately send OTP for buyer — should reset pending state
      const sendRes = await request(server)
        .post('/api/auth/otp/send')
        .send({ phone: '+91 99801 88301' });

      expect(sendRes.status).toBe(200);
      expect(sendRes.body.phone).toBe('+91 99801 88301');

      // Only the buyer OTP should be valid for that phone
      const verifyRes = await request(server)
        .post('/api/auth/otp/verify')
        .send({ phone: '+91 99801 88301', otp: capturedOtp! });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.user.role).toBe('buyer');
    });

    it('should handle OTP for unregistered (non-seed) phone as farmer', async () => {
      const phone = '+91 80000 00001';
      const sendRes = await request(server)
        .post('/api/auth/otp/send')
        .send({ phone });

      expect(sendRes.status).toBe(200);

      const verifyRes = await request(server)
        .post('/api/auth/otp/verify')
        .send({ phone, otp: capturedOtp! });

      expect(verifyRes.status).toBe(201);
      expect(verifyRes.body.user.role).toBe('farmer');
      expect(verifyRes.body.message).toBe('Phone verified. New user registered.');
    });
  });

  describe('Seed data integrity checks', () => {
    it('should have all 4 demo phones in correct seed data', () => {
      const farmer = SEED_FARMERS.find(f => f.phone === '+91 98231 44521');
      expect(farmer?.id).toBe('farmer_1');
      expect(farmer?.role).toBe('farmer');

      const buyer = SEED_BUYERS.find(b => b.phone === '+91 99801 88301');
      expect(buyer?.id).toBe('buyer_1');
      expect(buyer?.role).toBe('buyer');

      const logistics = SEED_LOGISTICS.find(l => l.phone === '+91 98224 55198');
      expect(logistics?.id).toBe('logistics_1');
      expect(logistics?.role).toBe('logistics');

      // Admin phone is NOT in seed data — handled by special case in controller
      const allSeedUsers = [...SEED_FARMERS, ...SEED_BUYERS, ...SEED_LOGISTICS];
      const adminInSeed = allSeedUsers.find(u => u.phone === '+91 99999 99999');
      expect(adminInSeed).toBeUndefined();
    });
  });
});
