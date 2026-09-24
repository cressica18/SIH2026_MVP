import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createServer } from 'http';
import app from '../src/app.js';
import { store, createStore } from '../src/data/store.js';
import { generateAccessToken } from '../src/core/security.js';

const server = createServer(app);

beforeEach(() => {
  Object.assign(store, createStore());
});

describe('Role Boundaries & Authorization Access Controls', () => {
  const farmer1Token = generateAccessToken({ userId: 'farmer_1', phone: '+91 98231 44521', role: 'farmer' });
  const farmer2Token = generateAccessToken({ userId: 'farmer_2', phone: '+91 94481 22910', role: 'farmer' });
  const buyer1Token = generateAccessToken({ userId: 'buyer_1', phone: '+91 99801 88301', role: 'buyer' });
  const buyer2Token = generateAccessToken({ userId: 'buyer_2', phone: '+91 99801 88302', role: 'buyer' });
  const logistics1Token = generateAccessToken({ userId: 'logistics_1', phone: '+91 98224 55198', role: 'logistics' });
  const adminToken = generateAccessToken({ userId: 'admin_1', phone: '+91 99999 99999', role: 'admin' });

  describe('1. Role Boundaries: Admin Actions Restricted to Admin', () => {
    it('should allow admin to access admin reports and reject normal users', async () => {
      const adminRes = await request(server)
        .get('/api/reports/admin')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.status).toBe(200);

      const farmerRes = await request(server)
        .get('/api/reports/admin')
        .set('Authorization', `Bearer ${farmer1Token}`);
      expect(farmerRes.status).toBe(403);

      const buyerRes = await request(server)
        .get('/api/reports/admin')
        .set('Authorization', `Bearer ${buyer1Token}`);
      expect(buyerRes.status).toBe(403);

      const logisticsRes = await request(server)
        .get('/api/reports/admin')
        .set('Authorization', `Bearer ${logistics1Token}`);
      expect(logisticsRes.status).toBe(403);
    });

    it('should reject non-admins from creating admin notifications', async () => {
      const res = await request(server)
        .post('/api/notifications/admin')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({ title: 'Test', message: 'Test', roleTarget: 'farmer', type: 'order' });
      expect(res.status).toBe(403);
    });
  });

  describe('2. Order Access Scoping and URL ID Parameter Tampering', () => {
    it('should limit GET /api/orders for farmer to only their own orders', async () => {
      // Create order for farmer_1 (FARM-88214)
      const orderRes = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyer1Token}`)
        .send({ listingId: 'list_1', crop: 'Tomato', quantityKg: 100 });
      expect(orderRes.status).toBe(201);

      // Farmer 1 fetches orders
      const f1Res = await request(server)
        .get('/api/orders')
        .set('Authorization', `Bearer ${farmer1Token}`);
      expect(f1Res.status).toBe(200);
      expect(f1Res.body.orders.every((o: any) => o.anonSellerId === 'FARM-88214')).toBe(true);

      // Farmer 2 fetches orders — should not see farmer 1 orders
      const f2Res = await request(server)
        .get('/api/orders')
        .set('Authorization', `Bearer ${farmer2Token}`);
      expect(f2Res.status).toBe(200);
      expect(f2Res.body.orders.some((o: any) => o.anonSellerId === 'FARM-88214')).toBe(false);
    });

    it('should enforce GET /api/orders/:id access boundary and require auth', async () => {
      // Unauthenticated request should be rejected
      const unauthRes = await request(server).get('/api/orders/ORD-1092');
      expect(unauthRes.status).toBe(401);

      // Create an order owned by buyer_1 and farmer_1
      const orderRes = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyer1Token}`)
        .send({ listingId: 'list_1', crop: 'Tomato', quantityKg: 50 });
      const orderId = orderRes.body.id;

      // Buyer 1 can access
      const b1Res = await request(server)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${buyer1Token}`);
      expect(b1Res.status).toBe(200);

      // Buyer 2 cannot access buyer 1's order
      const b2Res = await request(server)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${buyer2Token}`);
      expect(b2Res.status).toBe(403);

      // Farmer 2 cannot access farmer 1's order
      const f2Res = await request(server)
        .get(`/api/orders/${orderId}`)
        .set('Authorization', `Bearer ${farmer2Token}`);
      expect(f2Res.status).toBe(403);
    });

    it('should reject state transitions from non-owner farmers or buyers', async () => {
      // Create pending order for farmer_1
      const orderRes = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyer1Token}`)
        .send({ listingId: 'list_1', crop: 'Tomato', quantityKg: 50 });
      const orderId = orderRes.body.id;

      // Farmer 2 attempts to confirm farmer 1's order
      const confirmFail = await request(server)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${farmer2Token}`)
        .send({ status: 'confirmed' });
      expect(confirmFail.status).toBe(400);

      // Farmer 1 successfully confirms
      const confirmSuccess = await request(server)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({ status: 'confirmed' });
      expect(confirmSuccess.status).toBe(200);

      // Logistics moves to in_transit and delivered
      await request(server)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${logistics1Token}`)
        .send({ status: 'in_transit' });
      await request(server)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${logistics1Token}`)
        .send({ status: 'delivered' });

      // Buyer 2 attempts to settle Buyer 1's order
      const settleFail = await request(server)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${buyer2Token}`)
        .send({ status: 'settled' });
      expect(settleFail.status).toBe(400);

      // Buyer 1 successfully settles
      const settleSuccess = await request(server)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${buyer1Token}`)
        .send({ status: 'settled' });
      expect(settleSuccess.status).toBe(200);
    });
  });

  describe('3. Matching Engine & Anonymous Identity Protection', () => {
    it('should scrub farmer real name and phone from buyer matches response', async () => {
      const matchRes = await request(server)
        .get(`/api/matching/buyer/buyer_1`)
        .set('Authorization', `Bearer ${buyer1Token}`);
      expect(matchRes.status).toBe(200);
      expect(matchRes.body.length).toBeGreaterThan(0);
      for (const listing of matchRes.body) {
        expect(listing.farmerRealName).toBeUndefined();
        expect(listing.farmerPhone).toBeUndefined();
        expect(listing.anonSellerId).toBeDefined();
      }
    });

    it('should reject farmer viewing buyer matches for a listing they do not own', async () => {
      // list_1 belongs to farmer_1 (FARM-88214)
      const f2Res = await request(server)
        .get('/api/matching/listing/list_1')
        .set('Authorization', `Bearer ${farmer2Token}`);
      expect(f2Res.status).toBe(403);

      const f1Res = await request(server)
        .get('/api/matching/listing/list_1')
        .set('Authorization', `Bearer ${farmer1Token}`);
      expect(f1Res.status).toBe(200);
    });
  });

  describe('4. Reputation Rating Ownership', () => {
    it('should reject rating an order the user was not part of', async () => {
      // Setup a settled order between buyer_1 and farmer_1
      const orderRes = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyer1Token}`)
        .send({ listingId: 'list_1', quantityKg: 50 });
      const orderId = orderRes.body.id;

      await request(server).patch(`/api/orders/${orderId}/status`).set('Authorization', `Bearer ${farmer1Token}`).send({ status: 'confirmed' });
      await request(server).patch(`/api/orders/${orderId}/status`).set('Authorization', `Bearer ${logistics1Token}`).send({ status: 'in_transit' });
      await request(server).patch(`/api/orders/${orderId}/status`).set('Authorization', `Bearer ${logistics1Token}`).send({ status: 'delivered' });
      await request(server).patch(`/api/orders/${orderId}/status`).set('Authorization', `Bearer ${buyer1Token}`).send({ status: 'settled' });

      // Buyer 2 attempts to rate
      const b2Rating = await request(server)
        .post('/api/reputation/events')
        .set('Authorization', `Bearer ${buyer2Token}`)
        .send({ orderId, targetUserId: 'farmer_1', eventType: 'buyer_rating', scoreImpact: 5 });
      expect(b2Rating.status).toBe(403);

      // Buyer 1 rates successfully
      const b1Rating = await request(server)
        .post('/api/reputation/events')
        .set('Authorization', `Bearer ${buyer1Token}`)
        .send({ orderId, targetUserId: 'farmer_1', eventType: 'buyer_rating', scoreImpact: 5 });
      expect(b1Rating.status).toBe(201);
    });
  });

  describe('5. Notifications Read Authorization', () => {
    it('should allow marking broadcast notifications read and reject unauthorized user notifications', async () => {
      // Create notification for buyer_1
      const adminNotifRes = await request(server)
        .post('/api/notifications/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Alert', message: 'Test message', roleTarget: 'buyer', targetUserId: 'buyer_1', type: 'order' });
      expect(adminNotifRes.status).toBe(201);
      const notifId = adminNotifRes.body.id;

      // Buyer 2 cannot mark Buyer 1's notification as read
      const b2Res = await request(server)
        .patch(`/api/notifications/${notifId}/read`)
        .set('Authorization', `Bearer ${buyer2Token}`);
      expect(b2Res.status).toBe(403);

      // Buyer 1 can mark as read
      const b1Res = await request(server)
        .patch(`/api/notifications/${notifId}/read`)
        .set('Authorization', `Bearer ${buyer1Token}`);
      expect(b1Res.status).toBe(200);
      expect(b1Res.body.read).toBe(true);
    });
  });
});
