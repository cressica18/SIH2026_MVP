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

function farmerToken() {
  return generateAccessToken({ userId: 'farmer_1', phone: '+91 98231 44521', role: 'farmer' });
}

function buyerToken() {
  return generateAccessToken({ userId: 'buyer_1', phone: '+91 99801 88301', role: 'buyer' });
}

function adminToken() {
  return generateAccessToken({ userId: 'admin_1', phone: '+91 90000 00000', role: 'admin' });
}

function logisticsToken() {
  return generateAccessToken({ userId: 'logistics_1', phone: '+91 91111 22222', role: 'logistics' });
}

describe('Edge Case & Input Validation Audit', () => {

  describe('1. Listing Creation & Update Edge Cases', () => {
    it('should reject whitespace-only crop name', async () => {
      const res = await request(server)
        .post('/api/listings')
        .set('Authorization', `Bearer ${farmerToken()}`)
        .send({ crop: '   ', variety: 'Test', quantityKg: 100, priceExpected: 20 });
      expect(res.status).toBe(400);
    });

    it('should reject zero or negative quantityKg', async () => {
      const res1 = await request(server)
        .post('/api/listings')
        .set('Authorization', `Bearer ${farmerToken()}`)
        .send({ crop: 'Tomato', quantityKg: 0, priceExpected: 20 });
      expect(res1.status).toBe(400);

      const res2 = await request(server)
        .post('/api/listings')
        .set('Authorization', `Bearer ${farmerToken()}`)
        .send({ crop: 'Tomato', quantityKg: -50, priceExpected: 20 });
      expect(res2.status).toBe(400);
    });

    it('should reject negative or zero priceExpected or NaN', async () => {
      const res1 = await request(server)
        .post('/api/listings')
        .set('Authorization', `Bearer ${farmerToken()}`)
        .send({ crop: 'Tomato', quantityKg: 100, priceExpected: -10 });
      expect(res1.status).toBe(400);

      const res2 = await request(server)
        .post('/api/listings')
        .set('Authorization', `Bearer ${farmerToken()}`)
        .send({ crop: 'Tomato', quantityKg: 100, priceExpected: NaN });
      expect(res2.status).toBe(400);
    });

    it('should reject extremely large quantity or price', async () => {
      const res = await request(server)
        .post('/api/listings')
        .set('Authorization', `Bearer ${farmerToken()}`)
        .send({ crop: 'Tomato', quantityKg: 1e12, priceExpected: 20 });
      expect(res.status).toBe(400);
    });

    it('should reject updating listing status to invalid status', async () => {
      const listingId = store.listings[0].id;
      const res = await request(server)
        .patch(`/api/listings/${listingId}/status`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ status: 'invalid_status' });
      expect(res.status).toBe(400);
    });
  });

  describe('2. Order Creation Edge Cases', () => {
    it('should reject zero, negative or NaN quantityKg', async () => {
      const res1 = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken()}`)
        .send({ listingId: 'list_1', quantityKg: -100 });
      expect(res1.status).toBe(400);

      const res2 = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken()}`)
        .send({ listingId: 'list_1', quantityKg: 0 });
      expect(res2.status).toBe(400);
    });

    it('should reject whitespace listingId or non-existent listingId', async () => {
      const res1 = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken()}`)
        .send({ listingId: '   ', quantityKg: 100 });
      expect(res1.status).toBe(400);

      const res2 = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken()}`)
        .send({ listingId: 'list_nonexistent', quantityKg: 100 });
      expect(res2.status).toBe(404);
    });

    it('should handle decimal quantityKg correctly if valid', async () => {
      const res = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken()}`)
        .send({ listingId: 'list_1', quantityKg: 12.5 });
      expect(res.status).toBe(201);
      expect(res.body.quantityKg).toBe(12.5);
    });
  });

  describe('3. Order Status Transitions Edge Cases', () => {
    it('should reject transition from already settled order', async () => {
      store.orders[0].status = 'settled';
      const res = await request(server)
        .patch(`/api/orders/${store.orders[0].id}/status`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ status: 'in_transit' });
      expect(res.status).toBe(400);
    });

    it('should reject invalid status string', async () => {
      const res = await request(server)
        .patch(`/api/orders/${store.orders[0].id}/status`)
        .set('Authorization', `Bearer ${adminToken()}`)
        .send({ status: 'invalid_status' });
      expect(res.status).toBe(400);
    });
  });

  describe('4. Logistics Pool Edge Cases', () => {
    it('should reject manual pool with invalid or non-existent order IDs', async () => {
      const res = await request(server)
        .post('/api/logistics/pools')
        .set('Authorization', `Bearer ${logisticsToken()}`)
        .send({ orderIds: ['ORD-9999'] });
      expect(res.status).toBe(400);
    });

    it('should reject manual pool with duplicate order IDs', async () => {
      const validOrderId = store.orders.find(o => o.status === 'confirmed')?.id || store.orders[0].id;
      const res = await request(server)
        .post('/api/logistics/pools')
        .set('Authorization', `Bearer ${logisticsToken()}`)
        .send({ orderIds: [validOrderId, validOrderId] });
      expect(res.status).toBe(400);
    });

    it('should reject pool status transition from delivered to in_transit', async () => {
      const pool = store.pools[0];
      pool.status = 'delivered';
      const res = await request(server)
        .patch(`/api/logistics/pools/${pool.id}`)
        .set('Authorization', `Bearer ${logisticsToken()}`)
        .send({ status: 'in_transit' });
      expect(res.status).toBe(400);
    });
  });

  describe('5. Working Capital Advance & AEPS Edge Cases', () => {
    it('should reject advance request with negative amount or NaN', async () => {
      const res1 = await request(server)
        .post('/api/finance/advances')
        .set('Authorization', `Bearer ${farmerToken()}`)
        .send({ amountRequested: -5000 });
      expect(res1.status).toBe(400);

      const res2 = await request(server)
        .post('/api/finance/advances')
        .set('Authorization', `Bearer ${farmerToken()}`)
        .send({ amountRequested: 'abc' });
      expect(res2.status).toBe(400);
    });

    it('should reject AEPS cashout for already disbursed advance', async () => {
      const advance = store.advances.find(a => a.farmerId === 'farmer_1');
      if (advance) {
        advance.status = 'disbursed';
        const res = await request(server)
          .post('/api/finance/aeps/simulate-cashout')
          .set('Authorization', `Bearer ${farmerToken()}`)
          .send({ advanceId: advance.id, aadhaarLast4: '4521' });
        expect(res.status).toBe(400);
      }
    });

    it('should reject AEPS cashout with invalid Aadhaar last 4', async () => {
      const advance = store.advances.find(a => a.farmerId === 'farmer_1');
      if (advance) {
        advance.status = 'requested';
        const res = await request(server)
          .post('/api/finance/aeps/simulate-cashout')
          .set('Authorization', `Bearer ${farmerToken()}`)
          .send({ advanceId: advance.id, aadhaarLast4: '12' });
        expect(res.status).toBe(400);
      }
    });
  });

  describe('6. Voice Listing Extraction Edge Cases', () => {
    it('should reject empty or whitespace-only voice transcript', async () => {
      const res = await request(server)
        .post('/api/voice/extract-listing')
        .send({ transcript: '   ' });
      expect(res.status).toBe(400);
    });

    it('should return lower confidence when transcript has no crop or numbers', async () => {
      const res = await request(server)
        .post('/api/voice/extract-listing')
        .send({ transcript: 'hello good morning' });
      expect(res.status).toBe(200);
      expect(res.body.confidence).toBeLessThan(50);
    });
  });

  describe('7. Safety Reports Edge Cases', () => {
    it('should reject safety report with whitespace reported entity name or short description', async () => {
      const res1 = await request(server)
        .post('/api/reports')
        .set('Authorization', `Bearer ${farmerToken()}`)
        .send({
          category: 'Underpricing & Cartel',
          reportedEntityName: '   ',
          description: 'Valid description text long enough',
          isAnonymous: true,
        });
      expect(res1.status).toBe(400);

      const res2 = await request(server)
        .post('/api/reports')
        .set('Authorization', `Bearer ${farmerToken()}`)
        .send({
          category: 'Underpricing & Cartel',
          reportedEntityName: 'Mandi Trader',
          description: 'Short',
          isAnonymous: true,
        });
      expect(res2.status).toBe(400);
    });
  });
});
