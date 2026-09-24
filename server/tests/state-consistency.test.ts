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

describe('State Consistency & Error Handling Regression Tests', () => {

  describe('Notification Read State Persistence (PATCH /api/notifications/:id/read)', () => {
    it('should mark a notification as read and persist state on backend', async () => {
      const token = generateAccessToken({ userId: 'farmer_1', phone: '+91 98231 44521', role: 'farmer' });

      // Get initial notifications
      const initialRes = await request(server)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);
      expect(initialRes.status).toBe(200);
      expect(initialRes.body.notifications.length).toBeGreaterThan(0);

      const targetNotif = initialRes.body.notifications[0];
      const notifId = targetNotif.id;

      // Mark notification as read
      const patchRes = await request(server)
        .patch(`/api/notifications/${notifId}/read`)
        .set('Authorization', `Bearer ${token}`);
      expect(patchRes.status).toBe(200);
      expect(patchRes.body.read).toBe(true);

      // Verify subsequent GET returns read: true (persisted backend state)
      const afterRes = await request(server)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);
      const updatedNotif = afterRes.body.notifications.find((n: any) => n.id === notifId);
      expect(updatedNotif).toBeDefined();
      expect(updatedNotif.read).toBe(true);
    });

    it('should return 404 when marking non-existent notification', async () => {
      const token = generateAccessToken({ userId: 'farmer_1', phone: '+91 98231 44521', role: 'farmer' });

      const res = await request(server)
        .patch('/api/notifications/non_existent_notif_999/read')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Notification not found');
    });
  });

  describe('Reputation Rating Error Prevention & Rollback Guard', () => {
    it('should reject rating an unsettled order and leave reputation score intact', async () => {
      const buyerToken = generateAccessToken({ userId: 'buyer_1', phone: '+91 99801 88301', role: 'buyer' });
      const farmerToken = generateAccessToken({ userId: 'farmer_1', phone: '+91 98231 44521', role: 'farmer' });

      // Get farmer score before
      const scoreBeforeRes = await request(server)
        .get('/api/reputation/farmer_1')
        .set('Authorization', `Bearer ${buyerToken}`);
      const initialScore = scoreBeforeRes.body.score;

      // Create an order (status: pending)
      const orderRes = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: 'list_1', quantityKg: 50 });
      const orderId = orderRes.body.id;

      // Confirm order (status: confirmed) - still not settled
      await request(server)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ status: 'confirmed' });

      // Attempt to rate farmer on an unsettled order
      const ratingRes = await request(server)
        .post('/api/reputation/events')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ orderId, targetUserId: 'farmer_1', eventType: 'buyer_rating', scoreImpact: 5 });

      expect(ratingRes.status).toBe(400);

      // Verify farmer reputation score was NOT modified
      const scoreAfterRes = await request(server)
        .get('/api/reputation/farmer_1')
        .set('Authorization', `Bearer ${buyerToken}`);
      expect(scoreAfterRes.body.score).toBe(initialScore);
    });
  });

  describe('Order & Listing Error State Guards', () => {
    it('should reject order creation with invalid quantity or missing listingId', async () => {
      const buyerToken = generateAccessToken({ userId: 'buyer_1', phone: '+91 99801 88301', role: 'buyer' });

      const resMissing = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ crop: 'Tomato', quantityKg: 100 });
      expect(resMissing.status).toBe(400);

      const resZeroQty = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: 'list_1', quantityKg: 0 });
      expect(resZeroQty.status).toBe(400);
    });
  });

  describe('Logistics Waypoint Completion & Auto Order Delivery Sync', () => {
    it('should automatically sync all order statuses to delivered when all pool stops complete', async () => {
      const buyerToken = generateAccessToken({ userId: 'buyer_1', phone: '+91 99801 88301', role: 'buyer' });
      const farmerToken = generateAccessToken({ userId: 'farmer_1', phone: '+91 98231 44521', role: 'farmer' });
      const logisticsToken = generateAccessToken({ userId: 'logistics_1', phone: '+91 98224 55198', role: 'logistics' });

      // Create & confirm order
      const orderRes = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          listingId: 'list_1',
          crop: 'Tomato',
          quantityKg: 100,
          agreedPricePerKg: 18,
          deliveryAddress: 'Plot 44, Food Park MIDC, Pune, Maharashtra'
        });
      const orderId = orderRes.body.id;

      await request(server)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ status: 'confirmed' });

      // Create pool
      const poolRes = await request(server)
        .post('/api/logistics/pools')
        .set('Authorization', `Bearer ${logisticsToken}`)
        .send({ orderIds: [orderId] });
      const poolId = poolRes.body.id;
      const stops = poolRes.body.routeStops;

      // Complete both stops
      for (const stop of stops) {
        const stopRes = await request(server)
          .patch(`/api/logistics/pools/${poolId}/stops/${stop.id}`)
          .set('Authorization', `Bearer ${logisticsToken}`);
        expect(stopRes.status).toBe(200);
      }

      // Pool status should now be delivered
      const getPoolRes = await request(server).get(`/api/logistics/pools/${poolId}`);
      expect(getPoolRes.body.status).toBe('delivered');

      // Order status should be synced to delivered
      const getOrdersRes = await request(server)
        .get('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`);
      const orderObj = getOrdersRes.body.orders.find((o: any) => o.id === orderId);
      expect(orderObj).toBeDefined();
      expect(orderObj.status).toBe('delivered');
    });
  });

});
