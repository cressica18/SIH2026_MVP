import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createServer } from 'http';
import app from '../src/app.js';
import { store, createStore } from '../src/data/store.js';

// Helper to get app as request handler
const server = createServer(app);

// Reset store before each test
beforeEach(() => {
  // Re-create store to reset data
  Object.assign(store, createStore());
});

describe('Vasundhara API', () => {
  // ---- HEALTH CHECK ----
  describe('GET /api/health', () => {
    it('should return health status ok', async () => {
      const res = await request(server).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body.service).toBe('Vasundhara API');
    });
  });

  // ---- VOICE EXTRACTION ----
  describe('POST /api/voice/extract-listing', () => {
    it('should extract crop, variety, quantity, and price from a transcript', async () => {
      const res = await request(server)
        .post('/api/voice/extract-listing')
        .send({ transcript: 'do quintal tomato, expecting 18 rupees per kg', language: 'hi' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('crop');
      expect(res.body.crop).toBe('Tomato');
      expect(res.body).toHaveProperty('quantityKg');
      expect(res.body.quantityKg).toBeGreaterThan(0);
      expect(res.body).toHaveProperty('priceExpected');
      expect(res.body).toHaveProperty('confidence');
      expect(res.body).toHaveProperty('variety');
    });

    it('should reject requests without transcript', async () => {
      const res = await request(server)
        .post('/api/voice/extract-listing')
        .send({ language: 'en' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  // ---- QUALITY ASSESSMENT ----
  describe('POST /api/quality/assess', () => {
    it('should return quality assessment for a tomato crop', async () => {
      const res = await request(server)
        .post('/api/quality/assess')
        .send({ crop: 'Tomato', image: 'data:image/png;base64,test' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('grade');
      expect(res.body.grade).toBe('A');
      expect(res.body).toHaveProperty('confidence');
      expect(res.body).toHaveProperty('freshnessLabel');
    });

    it('should reject requests without crop', async () => {
      const res = await request(server)
        .post('/api/quality/assess')
        .send({ image: 'test' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  // ---- MARKET PRICE RECOMMENDATION ----
  describe('GET /api/market/price', () => {
    it('should return price recommendation for a known crop', async () => {
      const res = await request(server).get('/api/market/price?crop=Tomato');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('min');
      expect(res.body).toHaveProperty('fair');
      expect(res.body).toHaveProperty('max');
      expect(res.body).toHaveProperty('confidence');
      expect(res.body).toHaveProperty('benchmarkMandi');
      expect(res.body).toHaveProperty('trend');
    });

    it('should return default price band for unknown crop', async () => {
      const res = await request(server).get('/api/market/price?crop=UnknownCrop');
      expect(res.status).toBe(200);
      expect(res.body.fair).toBe(20.0);
    });

    it('should reject requests without crop', async () => {
      const res = await request(server).get('/api/market/price');
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  // ---- LISTINGS ----
  describe('GET /api/listings', () => {
    it('should return all listings', async () => {
      const res = await request(server).get('/api/listings');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('listings');
      expect(res.body).toHaveProperty('total');
      expect(Array.isArray(res.body.listings)).toBe(true);
    });
  });

  describe('GET /api/listings/:id', () => {
    it('should return a specific listing', async () => {
      const res = await request(server).get('/api/listings/list_1');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', 'list_1');
      expect(res.body).toHaveProperty('crop');
    });

    it('should return 404 for non-existent listing', async () => {
      const res = await request(server).get('/api/listings/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/listings', () => {
    it('should create a new listing', async () => {
      const newListing = {
        crop: 'Wheat',
        variety: 'Test Variety',
        quantityKg: 500,
        priceExpected: 25,
        anonSellerId: 'FARM-NEW',
      };
      const res = await request(server)
        .post('/api/listings')
        .send(newListing);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.crop).toBe('Wheat');
    });

    it('should reject listing without required fields', async () => {
      const res = await request(server)
        .post('/api/listings')
        .send({ crop: 'Wheat' });
      expect(res.status).toBe(400);
    });
  });

  // ---- ORDERS ----
  describe('GET /api/orders', () => {
    it('should return all orders', async () => {
      const res = await request(server).get('/api/orders');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('orders');
      expect(Array.isArray(res.body.orders)).toBe(true);
    });
  });

  describe('POST /api/orders', () => {
    it('should create a new order', async () => {
      const newOrder = {
        listingId: 'list_1',
        crop: 'Tomato',
        variety: 'Abhinav Hybrid',
        quantityKg: 500,
        agreedPricePerKg: 18,
        totalAmount: 9000,
        buyerId: 'buyer_1',
        buyerName: 'Test Buyer',
        buyerType: 'retailer',
        buyerPhone: '+91 99999 99999',
        anonSellerId: 'FARM-88214',
        deliveryAddress: 'Test Address',
      };
      const res = await request(server)
        .post('/api/orders')
        .send(newOrder);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.status).toBe('confirmed');
      expect(res.body.identityRevealed).toBe(true);
    });

    it('should reject order without listingId', async () => {
      const res = await request(server)
        .post('/api/orders')
        .send({ crop: 'Tomato' });
      expect(res.status).toBe(400);
    });
  });

  // ---- NOTIFICATIONS ----
  describe('GET /api/notifications', () => {
    it('should return all notifications', async () => {
      const res = await request(server).get('/api/notifications');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('notifications');
      expect(Array.isArray(res.body.notifications)).toBe(true);
    });
  });

  // ---- LOGISTICS POOLS ----
  describe('GET /api/logistics/pools', () => {
    it('should return all logistics pools', async () => {
      const res = await request(server).get('/api/logistics/pools');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('pools');
      expect(Array.isArray(res.body.pools)).toBe(true);
    });
  });
});
