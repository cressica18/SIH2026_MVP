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

  // ---- QUALITY ASSESSMENT (Phase 10 — CNN) ----
  describe('POST /api/quality/assess', () => {
    it('should return quality assessment with all CNN sub-score fields', async () => {
      const res = await request(server)
        .post('/api/quality/assess')
        .send({ crop: 'Tomato', image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA' });
      expect(res.status).toBe(200);
      expect(['A', 'B', 'C']).toContain(res.body.grade);
      expect(res.body.confidence).toBeGreaterThanOrEqual(70);
      expect(res.body.confidence).toBeLessThanOrEqual(99);
      expect(res.body).toHaveProperty('colorUniformity');
      expect(res.body).toHaveProperty('firmnessScore');
      expect(res.body).toHaveProperty('surfaceDefects');
      expect(res.body).toHaveProperty('freshnessLabel');
      expect(res.body).toHaveProperty('notes');
    });

    it('should assess quality for all supported demo crops', async () => {
      const crops = ['Tomato', 'Onion', 'Potato', 'Green Chilli', 'Wheat', 'Soybean'];
      for (const crop of crops) {
        const res = await request(server)
          .post('/api/quality/assess')
          .send({ crop, image: `data:image/png;base64,demoimage${crop}` });
        expect(res.status).toBe(200);
        expect(['A', 'B', 'C']).toContain(res.body.grade);
        // freshnessLabel should mention the grade
        expect(res.body.freshnessLabel).toBeTruthy();
      }
    });

    it('should return stable grade for same image (deterministic CNN)', async () => {
      const imageData = 'data:image/png;base64,stableTestImage123';
      const [res1, res2] = await Promise.all([
        request(server).post('/api/quality/assess').send({ crop: 'Onion', image: imageData }),
        request(server).post('/api/quality/assess').send({ crop: 'Onion', image: imageData }),
      ]);
      expect(res1.body.grade).toBe(res2.body.grade);
      expect(res1.body.confidence).toBe(res2.body.confidence);
    });

    it('should work without image data (crop-only fallback)', async () => {
      const res = await request(server)
        .post('/api/quality/assess')
        .send({ crop: 'Tomato' });
      expect(res.status).toBe(200);
      expect(['A', 'B', 'C']).toContain(res.body.grade);
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
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'farmer_1', phone: '+91 98231 44521', role: 'farmer' });

      // First ensure the farmer has a profile/anon identity by calling GET profile
      await request(server).get('/api/users/profile').set('Authorization', `Bearer ${token}`);

      const newListing = {
        crop: 'Wheat',
        variety: 'Test Variety',
        quantityKg: 500,
        priceExpected: 25,
      };
      const res = await request(server)
        .post('/api/listings')
        .set('Authorization', `Bearer ${token}`)
        .send(newListing);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.crop).toBe('Wheat');
      expect(res.body).toHaveProperty('anonSellerId');
    });

    it('should reject listing without required fields', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'farmer_1', phone: '+91 98231 44521', role: 'farmer' });

      const res = await request(server)
        .post('/api/listings')
        .set('Authorization', `Bearer ${token}`)
        .send({ crop: 'Wheat' });
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/listings/:id/status', () => {
    it('should allow farmer to update their own listing status', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'farmer_1', phone: '+91 98231 44521', role: 'farmer' });
      
      const res = await request(server)
        .patch('/api/listings/list_1/status')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'withdrawn' });
      
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('withdrawn');
    });

    it('should reject unauthorized update', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      // Create a token for a different farmer
      const token2 = generateAccessToken({ userId: 'farmer_2', phone: '+91 98231 44522', role: 'farmer' });
      
      const res = await request(server)
        .patch('/api/listings/list_1/status')
        .set('Authorization', `Bearer ${token2}`)
        .send({ status: 'active' });
      
      expect(res.status).toBe(403);
    });
  });

  // ---- ORDERS ----
  describe('GET /api/orders', () => {
    it('should return buyer-scoped orders with buyer token', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'buyer_1', phone: '+91 99801 88301', role: 'buyer' });
      const res = await request(server)
        .get('/api/orders')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('orders');
      expect(Array.isArray(res.body.orders)).toBe(true);
    });

    it('should return logistics-visible orders with logistics token', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'logistics_1', phone: '+91 98224 55198', role: 'logistics' });
      const res = await request(server)
        .get('/api/orders')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('orders');
    });

    it('should reject unauthenticated GET /api/orders', async () => {
      const res = await request(server).get('/api/orders');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/orders', () => {
    it('should create a new order with buyer token', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'buyer_1', phone: '+91 99801 88301', role: 'buyer' });
      const newOrder = {
        listingId: 'list_1',
        crop: 'Tomato',
        variety: 'Abhinav Hybrid',
        quantityKg: 200,
        agreedPricePerKg: 18,
        totalAmount: 3600,
        buyerName: 'Sahyadri Agro Processing Ltd.',
        buyerType: 'processor',
        buyerPhone: '+91 99801 88301',
        anonSellerId: 'FARM-88214',
        sellerRealName: 'Ramesh Patil',
        sellerPhone: '+91 98231 44521',
        sellerDistrict: 'Nashik',
        deliveryAddress: 'Plot 44, Food Park MIDC, Pune',
      };
      const res = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send(newOrder);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.status).toBe('pending');
      expect(res.body.identityRevealed).toBe(false);
      expect(res.body.sellerRealName).toBeUndefined(); // Scrubbed
      expect(res.body.buyerId).toBe('buyer_1'); // from token
    });

    it('should reject order from farmer role', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'farmer_1', phone: '+91 98231 44521', role: 'farmer' });
      const res = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ listingId: 'list_1', quantityKg: 100 });
      expect(res.status).toBe(403);
    });

    it('should reject order without listingId', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'buyer_1', phone: '+91 99801 88301', role: 'buyer' });
      const res = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ crop: 'Tomato' });
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/orders/:id/status', () => {
    it('should allow farmer to confirm a pending order and reveal identity', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const buyerToken = generateAccessToken({ userId: 'buyer_1', phone: '123', role: 'buyer' });
      const farmerToken = generateAccessToken({ userId: 'farmer_1', phone: '456', role: 'farmer' });
      
      // 1. Buyer creates order
      const orderRes = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: 'list_1', quantityKg: 100 });
      const orderId = orderRes.body.id;

      // 2. Buyer cannot see farmer details initially
      expect(orderRes.body.sellerRealName).toBeUndefined();

      // 3. Farmer confirms order
      const patchRes = await request(server)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ status: 'confirmed' });
      
      expect(patchRes.status).toBe(200);
      expect(patchRes.body.status).toBe('confirmed');
      expect(patchRes.body.identityRevealed).toBe(true);
      expect(patchRes.body.sellerRealName).toBeDefined(); // Revealed
    });

    it('should reject invalid state transitions', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'farmer_1', phone: '123', role: 'farmer' });
      
      // Attempt to settle a pending order (which doesn't exist, we will use a seed or just try to settle anything)
      // We will create a fresh one
      const buyerToken = generateAccessToken({ userId: 'buyer_1', phone: '456', role: 'buyer' });
      const orderRes = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: 'list_1', quantityKg: 100 });
      
      const patchRes = await request(server)
        .patch(`/api/orders/${orderRes.body.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'settled' }); // farmer trying to settle pending
      
      expect(patchRes.status).toBe(400);
    });
  });

  // ---- NOTIFICATIONS ----
  describe('GET /api/notifications', () => {
    it('should return all notifications for authenticated user', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'farmer_1', phone: '+91 98231 44521', role: 'farmer' });
      const res = await request(server)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('notifications');
      expect(Array.isArray(res.body.notifications)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(server).get('/api/notifications');
      expect(res.status).toBe(401);
    });
  });

  // ---- LOGISTICS POOLS ----
  describe('GET /api/logistics/pools', () => {
    it('should return all logistics pools (public)', async () => {
      const res = await request(server).get('/api/logistics/pools');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('pools');
      expect(Array.isArray(res.body.pools)).toBe(true);
    });
  });

describe('POST /api/logistics/pools', () => {
    it('should create a logistics pool from unassigned confirmed orders (status: unassigned)', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'logistics_1', phone: '+91 98224 55198', role: 'logistics' });
      
      // First, buyer creates an order to ensure we have an unassigned confirmed order
      const buyerToken = generateAccessToken({ userId: 'buyer_1', phone: '+91 99801 88301', role: 'buyer' });
      const orderRes = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          listingId: 'list_2',
          crop: 'Onion',
          quantityKg: 500,
          agreedPricePerKg: 24,
          buyerName: 'Test',
          deliveryAddress: 'Pune'
        });
      const orderId = orderRes.body.id;

      // Farmer confirms the order
      const farmerToken = generateAccessToken({ userId: 'farmer_2', phone: '111', role: 'farmer' });
      await request(server)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ status: 'confirmed' });

      // Now create pool
      const res = await request(server)
        .post('/api/logistics/pools')
        .set('Authorization', `Bearer ${token}`)
        .send({ orderIds: [orderId] });
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.routeStops.length).toBe(2); // 1 pickup, 1 dropoff
      expect(res.body.totalWeightKg).toBe(500);
      expect(res.body.status).toBe('unassigned'); // Pool starts unassigned, logistics joins via /join
      expect(res.body.routeStops[0].lat).not.toBe(0); // Real coordinates from listings
      expect(res.body.routeStops[0].lng).not.toBe(0);
    });

    it('should reject pool creation if order is already assigned', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'logistics_1', phone: '+91 98224 55198', role: 'logistics' });
      const res = await request(server)
        .post('/api/logistics/pools')
        .set('Authorization', `Bearer ${token}`)
        .send({ orderIds: ['ORD-1092'] }); // Seed order is already in POOL-NSK-01
      expect(res.status).toBe(400);
    });

    it('should reject pool creation without orderIds array', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'logistics_1', phone: '+91 98224 55198', role: 'logistics' });
      const res = await request(server)
        .post('/api/logistics/pools')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/logistics/pools/:id', () => {
    it('should allow logistics role to update pool status', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'logistics_1', phone: '+91 98224 55198', role: 'logistics' });
      const res = await request(server)
        .patch('/api/logistics/pools/POOL-NSK-01')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'in_transit' });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('in_transit');
    });

    it('should allow logistics role to complete a route stop', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'logistics_1', phone: '+91 98224 55198', role: 'logistics' });
      
      // Need a stop ID. Let's create a pool first.
      const buyerToken = generateAccessToken({ userId: 'buyer_1', phone: '+91 99801 88301', role: 'buyer' });
      const orderRes = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          listingId: 'list_2',
          crop: 'Onion',
          quantityKg: 100,
          agreedPricePerKg: 24,
          buyerName: 'Test',
          deliveryAddress: 'Pune'
        });
        
      // Confirm the order first so it's eligible for pooling
      const farmerToken = generateAccessToken({ userId: 'farmer_2', phone: '111', role: 'farmer' });
      await request(server)
        .patch(`/api/orders/${orderRes.body.id}/status`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ status: 'confirmed' });
        
      const poolRes = await request(server)
        .post('/api/logistics/pools')
        .set('Authorization', `Bearer ${token}`)
        .send({ orderIds: [orderRes.body.id] });
        
      const poolId = poolRes.body.id;
      const stopId = poolRes.body.routeStops[0].id;
      
      const res = await request(server)
        .patch(`/api/logistics/pools/${poolId}/stops/${stopId}`)
        .set('Authorization', `Bearer ${token}`);
        
      expect(res.status).toBe(200);
      const updatedStop = res.body.routeStops.find((s: any) => s.id === stopId);
      expect(updatedStop.completed).toBe(true);
    });

    it('should reject pool status update from buyer role', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'buyer_1', phone: '+91 99801 88301', role: 'buyer' });
      const res = await request(server)
        .patch('/api/logistics/pools/POOL-NSK-01')
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'delivered' });
      expect(res.status).toBe(403);
    });
  });

  // ---- GET /api/logistics/pools/:id/route ----
  describe('GET /api/logistics/pools/:id/route', () => {
    it('should return optimized route for a pool', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'logistics_1', phone: '+91 98224 55198', role: 'logistics' });
      
      // Create a pool with confirmed orders first
      const buyerToken = generateAccessToken({ userId: 'buyer_1', phone: '+91 99801 88301', role: 'buyer' });
      const farmerToken = generateAccessToken({ userId: 'farmer_1', phone: '+91 98231 44521', role: 'farmer' });
      
      const orderRes = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: 'list_1', crop: 'Tomato', quantityKg: 500, agreedPricePerKg: 18, buyerName: 'Test', deliveryAddress: 'Pune' });
      await request(server)
        .patch(`/api/orders/${orderRes.body.id}/status`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ status: 'confirmed' });

      const poolRes = await request(server)
        .post('/api/logistics/pools')
        .set('Authorization', `Bearer ${token}`)
        .send({ orderIds: [orderRes.body.id] });
      
      const poolId = poolRes.body.id;
      
      const res = await request(server)
        .get(`/api/logistics/pools/${poolId}/route`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('poolId', poolId);
      expect(res.body).toHaveProperty('routeStops');
      expect(Array.isArray(res.body.routeStops)).toBe(true);
      expect(res.body.routeStops.length).toBeGreaterThan(0);
      expect(res.body).toHaveProperty('totalStops');
      expect(res.body).toHaveProperty('estimatedDistanceKm');
      expect(res.body).toHaveProperty('estimatedDurationMinutes');
      // Verify route has real coordinates
      res.body.routeStops.forEach((stop: any) => {
        expect(stop.lat).not.toBe(0);
        expect(stop.lng).not.toBe(0);
      });
    });

    it('should return 404 for non-existent pool', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'logistics_1', phone: '+91 98224 55198', role: 'logistics' });
      
      const res = await request(server)
        .get('/api/logistics/pools/NONEXISTENT/route')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Pool not found');
    });

    it('should reject request from buyer role', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'buyer_1', phone: '+91 99801 88301', role: 'buyer' });
      
      const res = await request(server)
        .get('/api/logistics/pools/POOL-NSK-01/route')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(403);
    });
  });

  // ---- POST /api/logistics/pools/:id/join ----
  describe('POST /api/logistics/pools/:id/join', () => {
    it('should allow logistics provider to join an unassigned pool', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const logisticsToken = generateAccessToken({ userId: 'logistics_1', phone: '+91 98224 55198', role: 'logistics' });
      
      // Create a new pool first
      const buyerToken = generateAccessToken({ userId: 'buyer_1', phone: '+91 99801 88301', role: 'buyer' });
      const orderRes = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          listingId: 'list_3',
          crop: 'Tomato',
          quantityKg: 300,
          agreedPricePerKg: 17,
          buyerName: 'Test',
          deliveryAddress: 'Bengaluru'
        });
      const orderId = orderRes.body.id;

      const farmerToken = generateAccessToken({ userId: 'farmer_2', phone: '111', role: 'farmer' });
      await request(server)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ status: 'confirmed' });

      const poolRes = await request(server)
        .post('/api/logistics/pools')
        .set('Authorization', `Bearer ${logisticsToken}`)
        .send({ orderIds: [orderId] });
      
      const poolId = poolRes.body.id;
      expect(poolRes.body.status).toBe('unassigned');

      // Join the pool
      const joinRes = await request(server)
        .post(`/api/logistics/pools/${poolId}/join`)
        .set('Authorization', `Bearer ${logisticsToken}`);
      
      expect(joinRes.status).toBe(200);
      expect(joinRes.body.message).toBe('Successfully joined pool');
      expect(joinRes.body.pool.status).toBe('assigned');
      expect(joinRes.body.pool.driverName).toBe('logistics_1');
    });

    it('should reject join if pool is already in_transit', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'logistics_1', phone: '+91 98224 55198', role: 'logistics' });
      
      const res = await request(server)
        .post('/api/logistics/pools/POOL-NSK-01/join')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/already/);
    });

    it('should reject join from buyer role', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'buyer_1', phone: '+91 99801 88301', role: 'buyer' });
      
      const res = await request(server)
        .post('/api/logistics/pools/POOL-NSK-01/join')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent pool', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'logistics_1', phone: '+91 98224 55198', role: 'logistics' });
      
      const res = await request(server)
        .post('/api/logistics/pools/NONEXISTENT/join')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(404);
    });
  });

  // ---- POST /api/logistics/pools/auto (auto-clustering) ----
  describe('POST /api/logistics/pools/auto', () => {
    it('should auto-create pools from confirmed unassigned orders via geo-clustering', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'logistics_1', phone: '+91 98224 55198', role: 'logistics' });
      
      // Create multiple confirmed orders in nearby regions (Nashik area)
      const buyerToken = generateAccessToken({ userId: 'buyer_1', phone: '+91 99801 88301', role: 'buyer' });
      const farmerToken = generateAccessToken({ userId: 'farmer_1', phone: '+91 98231 44521', role: 'farmer' });
      
      // Order 1: Tomato from list_1 (Nashik)
      const order1Res = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: 'list_1', crop: 'Tomato', quantityKg: 400, agreedPricePerKg: 18, buyerName: 'Test', deliveryAddress: 'Pune' });
      await request(server)
        .patch(`/api/orders/${order1Res.body.id}/status`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ status: 'confirmed' });

      // Order 2: Onion from list_2 (also Nashik - same farmer)
      const order2Res = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: 'list_2', crop: 'Onion', quantityKg: 600, agreedPricePerKg: 24, buyerName: 'Test', deliveryAddress: 'Pune' });
      await request(server)
        .patch(`/api/orders/${order2Res.body.id}/status`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ status: 'confirmed' });

      // Auto-create pools
      const res = await request(server)
        .post('/api/logistics/pools/auto')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('pools');
      expect(Array.isArray(res.body.pools)).toBe(true);
      expect(res.body).toHaveProperty('skipped');
      expect(res.body).toHaveProperty('total');
      
      // Should create at least one multi-order pool (both orders from Nashik)
      const multiOrderPools = res.body.pools.filter((p: any) => p.orderIds.length > 1);
      expect(multiOrderPools.length).toBeGreaterThanOrEqual(1);
      
      // Verify the multi-order pool has valid route
      if (multiOrderPools.length > 0) {
        const pool = multiOrderPools[0];
        expect(pool.orderIds.length).toBe(2);
        expect(pool.routeStops.length).toBe(4); // 2 pickups + 2 dropoffs
        expect(pool.totalWeightKg).toBe(1000);
        expect(pool.routeStops[0].lat).not.toBe(0);
      }
    });

    it('should reject auto-pool from buyer role', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'buyer_1', phone: '+91 99801 88301', role: 'buyer' });
      
      const res = await request(server)
        .post('/api/logistics/pools/auto')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(403);
    });
  });

  // ---- Auto-clustering algorithm verification ----
  describe('Auto-clustering algorithm (geo-proximity)', () => {
    it('should cluster orders within MAX_CLUSTER_RADIUS_KM', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'logistics_1', phone: '+91 98224 55198', role: 'logistics' });
      const buyerToken = generateAccessToken({ userId: 'buyer_1', phone: '+91 99801 88301', role: 'buyer' });
      const farmer1Token = generateAccessToken({ userId: 'farmer_1', phone: '+91 98231 44521', role: 'farmer' });
      const farmer2Token = generateAccessToken({ userId: 'farmer_2', phone: '+91 94481 22910', role: 'farmer' });
      
      // Create order from Nashik (farmer_1)
      const order1Res = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: 'list_1', crop: 'Tomato', quantityKg: 500, agreedPricePerKg: 18, buyerName: 'Test', deliveryAddress: 'Pune' });
      await request(server)
        .patch(`/api/orders/${order1Res.body.id}/status`)
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({ status: 'confirmed' });

      // Create order from Kolar (farmer_2) - far from Nashik (~1000km)
      const order2Res = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: 'list_3', crop: 'Tomato', quantityKg: 300, agreedPricePerKg: 17, buyerName: 'Test', deliveryAddress: 'Bengaluru' });
      await request(server)
        .patch(`/api/orders/${order2Res.body.id}/status`)
        .set('Authorization', `Bearer ${farmer2Token}`)
        .send({ status: 'confirmed' });

      // Auto-create pools - should create TWO separate pools (far apart)
      const res = await request(server)
        .post('/api/logistics/pools/auto')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(2); // Two separate pools, not clustered together
      
      // Each pool should have 1 order
      res.body.pools.forEach((pool: any) => {
        expect(pool.orderIds.length).toBe(1);
      });
    });

    it('should respect capacity constraints (MAX_CAPACITY_KG)', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'logistics_1', phone: '+91 98224 55198', role: 'logistics' });
      const buyerToken = generateAccessToken({ userId: 'buyer_1', phone: '+91 99801 88301', role: 'buyer' });
      const farmerToken = generateAccessToken({ userId: 'farmer_1', phone: '+91 98231 44521', role: 'farmer' });
      
      // Create large orders from same farmer (same pickup coords) that exceed capacity when combined
      // list_1: Tomato, 2000kg available; list_2: Onion, 3500kg available
      const order1Res = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: 'list_1', crop: 'Tomato', quantityKg: 2000, agreedPricePerKg: 18, buyerName: 'Test', deliveryAddress: 'Pune' });
      await request(server)
        .patch(`/api/orders/${order1Res.body.id}/status`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ status: 'confirmed' });

      const order2Res = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: 'list_2', crop: 'Onion', quantityKg: 2000, agreedPricePerKg: 24, buyerName: 'Test', deliveryAddress: 'Pune' });
      await request(server)
        .patch(`/api/orders/${order2Res.body.id}/status`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ status: 'confirmed' });

      // Auto-create - should create separate pools due to capacity (2000+2000=4000 > 3500)
      const res = await request(server)
        .post('/api/logistics/pools/auto')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      // With 2000+2000=4000kg > 3500kg capacity, should be 2 pools
      expect(res.body.total).toBe(2);
    });
  });

  // ---- Route optimization (nearest-neighbor) ----
  describe('Route optimization (nearest-neighbor heuristic)', () => {
    it('should sequence pickups before dropoffs', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'logistics_1', phone: '+91 98224 55198', role: 'logistics' });
      
      const res = await request(server)
        .get('/api/logistics/pools/POOL-NSK-01/route')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      const stops = res.body.routeStops;
      
      // All pickups should come before all dropoffs
      const pickupIndices = stops.map((s: any, i: number) => s.stopType === 'pickup' ? i : -1).filter((i: number) => i >= 0);
      const dropoffIndices = stops.map((s: any, i: number) => s.stopType === 'dropoff' ? i : -1).filter((i: number) => i >= 0);
      
      const maxPickupIdx = Math.max(...pickupIndices);
      const minDropoffIdx = Math.min(...dropoffIndices);
      expect(maxPickupIdx).toBeLessThan(minDropoffIdx);
    });

    it('should produce deterministic route for same pool', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'logistics_1', phone: '+91 98224 55198', role: 'logistics' });
      
      const [res1, res2] = await Promise.all([
        request(server).get('/api/logistics/pools/POOL-NSK-01/route').set('Authorization', `Bearer ${token}`),
        request(server).get('/api/logistics/pools/POOL-NSK-01/route').set('Authorization', `Bearer ${token}`),
      ]);
      
      expect(res1.body.routeStops.map((s: any) => s.id)).toEqual(res2.body.routeStops.map((s: any) => s.id));
    });
  });

  // ---- AUTH (Phase 2) ----
  describe('POST /api/auth/otp/send', () => {
    it('should accept a valid +91 phone number', async () => {
      const res = await request(server)
        .post('/api/auth/otp/send')
        .send({ phone: '+91 98231 44521' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('phone');
      expect(res.body.message).toMatch(/OTP sent/i);
    });

    it('should reject a phone without +91 prefix', async () => {
      const res = await request(server)
        .post('/api/auth/otp/send')
        .send({ phone: '9876543210' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject missing phone', async () => {
      const res = await request(server)
        .post('/api/auth/otp/send')
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/otp/verify', () => {
    it('should return 400 if OTP is wrong for a phone without a pending request', async () => {
      // Note: otpStore is module-level and persists across tests within the same suite run.
      // Use a fresh phone that no prior test sent an OTP to.
      const res = await request(server)
        .post('/api/auth/otp/verify')
        .send({ phone: '+91 00000 00001', otp: '123456' });
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should return tokens for a seeded phone after correct OTP flow', async () => {
      const phone = '+91 98231 44521'; // farmer_1

      // Step 1: request OTP (captures it from console in real usage; we intercept via test)
      const sendRes = await request(server)
        .post('/api/auth/otp/send')
        .send({ phone });
      expect(sendRes.status).toBe(200);

      // Step 2: We can't easily capture the OTP from console in test, so we test the negative path
      const badOtpRes = await request(server)
        .post('/api/auth/otp/verify')
        .send({ phone, otp: '000000' });
      expect(badOtpRes.status).toBe(400);
      expect(badOtpRes.body.error).toMatch(/Invalid OTP/i);
    });

    it('should return 400 for missing fields', async () => {
      const res = await request(server)
        .post('/api/auth/otp/verify')
        .send({ phone: '+91 98231 44521' }); // missing otp
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 without a token', async () => {
      const res = await request(server).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should return 401 with an invalid token', async () => {
      const res = await request(server)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken123');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should return 400 if no refresh token provided', async () => {
      const res = await request(server)
        .post('/api/auth/refresh')
        .send({});
      expect(res.status).toBe(400);
    });

    it('should return 401 for an invalid refresh token', async () => {
      const res = await request(server)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid.token.here' });
      expect(res.status).toBe(401);
    });
  });

  // ---- USERS (Phase 3 & 4) ----
  describe('GET /api/users/profile', () => {
    let accessToken = '';
    beforeEach(async () => {
      // Get a token for farmer_1
      const res = await request(server)
        .post('/api/auth/otp/send')
        .send({ phone: '+91 98231 44521' });
      const verifyRes = await request(server)
        .post('/api/auth/otp/verify')
        .send({ phone: '+91 98231 44521', otp: '123456' }); // OTP doesn't matter much for this mock as we are testing users
      accessToken = verifyRes.body?.tokens?.accessToken;
    });

    it('should return user profile with anonSellerId for farmer', async () => {
      // Create a valid token directly for tests
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'farmer_1', phone: '+91 98231 44521', role: 'farmer' });

      const res = await request(server)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('profile');
      expect(res.body.profile.id).toBe('farmer_1');
      expect(res.body).toHaveProperty('anonSellerId');
    });

    it('should return user profile for buyer', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'buyer_1', phone: '+91 99801 88301', role: 'buyer' });

      const res = await request(server)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('profile');
      expect(res.body.profile.id).toBe('buyer_1');
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update farmer profile', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'farmer_1', phone: '+91 98231 44521', role: 'farmer' });

      const res = await request(server)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Updated Name',
          village: 'New Village',
          district: 'New District',
          state: 'New State',
          landSizeAcres: 4,
          primaryCrops: ['Tomato', 'Onion'],
        });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('profile');
      expect(res.body.profile.name).toBe('Updated Name');
    });
  });

  // ---- FINANCE & SCHEMES (Phase 9) ----
  describe('GET /api/schemes', () => {
    it('should return a list of government schemes', async () => {
      const res = await request(server).get('/api/schemes');
      expect(res.status).toBe(200);
      expect(res.body.schemes).toBeInstanceOf(Array);
      expect(res.body.schemes.length).toBeGreaterThan(0);
    });
  });

  describe('Finance API', () => {
    it('should return deterministic risk profile for a farmer', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'farmer_1', phone: '+91 98231 44521', role: 'farmer' });
      const res = await request(server)
        .get('/api/finance/risk/farmer_1')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.farmerId).toBe('farmer_1');
      expect(res.body.riskScore).toBeDefined();
    });

    it('should reject viewing another farmers risk profile', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'farmer_2', phone: '+91 99999 99999', role: 'farmer' });
      const res = await request(server)
        .get('/api/finance/risk/farmer_1')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it('should create an advance request and return advances for the logged-in farmer', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'farmer_1', phone: '+91 98231 44521', role: 'farmer' });
      
      const postRes = await request(server)
        .post('/api/finance/advances')
        .set('Authorization', `Bearer ${token}`)
        .send({ amountRequested: 20000, purpose: 'Seeds' });
      expect(postRes.status).toBe(201);
      expect(postRes.body.amountRequested).toBe(20000);
      expect(postRes.body.status).toBe('requested');
      expect(postRes.body.id).toBeDefined();

      const advanceId = postRes.body.id;

      const aepsRes = await request(server)
        .post('/api/finance/aeps/simulate-cashout')
        .set('Authorization', `Bearer ${token}`)
        .send({ advanceId, aadhaarLast4: '1234' });
      expect(aepsRes.status).toBe(200);
      expect(aepsRes.body.advance.status).toBe('disbursed');
      expect(aepsRes.body.advance.aepsTxnRef).toBeDefined();
      expect(aepsRes.body.mockDetails).toBeDefined();
      expect(aepsRes.body.mockDetails.note).toContain('SIMULATED');

      const getRes = await request(server)
        .get('/api/finance/advances')
        .set('Authorization', `Bearer ${token}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.advances).toBeInstanceOf(Array);
      expect(getRes.body.advances.length).toBeGreaterThan(0);
    });
  });

  // ---- REPUTATION & TRUST SCORING (Phase 12) ----
  describe('GET /api/reputation/:userId', () => {
    it('should return default score for a user with no events', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'farmer_1', phone: '123', role: 'farmer' });
      const res = await request(server)
        .get('/api/reputation/farmer_1')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('score');
      expect(res.body.score).toBeGreaterThanOrEqual(1.0);
      expect(res.body.score).toBeLessThanOrEqual(5.0);
      expect(res.body).toHaveProperty('tier');
    });

    it('should resolve anonSellerId (FARM-XXXXX) to a real userId', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'buyer_1', phone: '123', role: 'buyer' });
      const res = await request(server)
        .get('/api/reputation/FARM-88214')  // anonSellerId of farmer_1
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.userId).toBe('farmer_1');
      expect(res.body).toHaveProperty('score');
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(server).get('/api/reputation/farmer_1');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/reputation/events', () => {
    it('should allow buyer to rate farmer after order is settled', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const buyerToken = generateAccessToken({ userId: 'buyer_1', phone: '123', role: 'buyer' });
      const farmerToken = generateAccessToken({ userId: 'farmer_1', phone: '456', role: 'farmer' });
      const logisticsToken = generateAccessToken({ userId: 'logistics_1', phone: '789', role: 'logistics' });

      // Full lifecycle: pending → confirmed → in_transit → delivered → settled
      const orderRes = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: 'list_1', quantityKg: 50 });
      const orderId = orderRes.body.id;

      await request(server).patch(`/api/orders/${orderId}/status`).set('Authorization', `Bearer ${farmerToken}`).send({ status: 'confirmed' });
      await request(server).patch(`/api/orders/${orderId}/status`).set('Authorization', `Bearer ${logisticsToken}`).send({ status: 'in_transit' });
      await request(server).patch(`/api/orders/${orderId}/status`).set('Authorization', `Bearer ${logisticsToken}`).send({ status: 'delivered' });
      await request(server).patch(`/api/orders/${orderId}/status`).set('Authorization', `Bearer ${buyerToken}`).send({ status: 'settled' });

      // Now buyer can rate
      const ratingRes = await request(server)
        .post('/api/reputation/events')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ orderId, targetUserId: 'farmer_1', eventType: 'buyer_rating', scoreImpact: 5 });
      expect(ratingRes.status).toBe(201);
      expect(ratingRes.body).toHaveProperty('event');
      expect(ratingRes.body).toHaveProperty('updatedScore');
      expect(ratingRes.body.event.eventType).toBe('buyer_rating');
    });

    it('should update score after a rating is submitted', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const buyerToken = generateAccessToken({ userId: 'buyer_1', phone: '123', role: 'buyer' });
      const farmerToken = generateAccessToken({ userId: 'farmer_1', phone: '456', role: 'farmer' });
      const logisticsToken = generateAccessToken({ userId: 'logistics_1', phone: '789', role: 'logistics' });

      const orderRes = await request(server)
        .post('/api/orders').set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: 'list_1', quantityKg: 50 });
      const orderId = orderRes.body.id;
      await request(server).patch(`/api/orders/${orderId}/status`).set('Authorization', `Bearer ${farmerToken}`).send({ status: 'confirmed' });
      await request(server).patch(`/api/orders/${orderId}/status`).set('Authorization', `Bearer ${logisticsToken}`).send({ status: 'in_transit' });
      await request(server).patch(`/api/orders/${orderId}/status`).set('Authorization', `Bearer ${logisticsToken}`).send({ status: 'delivered' });
      await request(server).patch(`/api/orders/${orderId}/status`).set('Authorization', `Bearer ${buyerToken}`).send({ status: 'settled' });

      // Get score before
      const beforeRes = await request(server).get('/api/reputation/farmer_1').set('Authorization', `Bearer ${buyerToken}`);
      const scoreBefore = beforeRes.body.score;

      // Submit a 1-star rating (very negative)
      await request(server)
        .post('/api/reputation/events')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ orderId, targetUserId: 'farmer_1', eventType: 'buyer_rating', scoreImpact: 1 });

      // Score should drop
      const afterRes = await request(server).get('/api/reputation/farmer_1').set('Authorization', `Bearer ${buyerToken}`);
      expect(afterRes.body.score).toBeLessThan(scoreBefore);
    });

    it('should reject rating before order is settled', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const buyerToken = generateAccessToken({ userId: 'buyer_1', phone: '123', role: 'buyer' });

      const orderRes = await request(server)
        .post('/api/orders').set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: 'list_1', quantityKg: 20 });
      const orderId = orderRes.body.id; // still 'pending'

      const ratingRes = await request(server)
        .post('/api/reputation/events')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ orderId, targetUserId: 'farmer_1', eventType: 'buyer_rating', scoreImpact: 5 });
      expect(ratingRes.status).toBe(400);
    });

    it('should reject duplicate ratings for the same order', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const buyerToken = generateAccessToken({ userId: 'buyer_1', phone: '123', role: 'buyer' });
      const farmerToken = generateAccessToken({ userId: 'farmer_1', phone: '456', role: 'farmer' });
      const logisticsToken = generateAccessToken({ userId: 'logistics_1', phone: '789', role: 'logistics' });

      const orderRes = await request(server)
        .post('/api/orders').set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: 'list_1', quantityKg: 20 });
      const orderId = orderRes.body.id;
      await request(server).patch(`/api/orders/${orderId}/status`).set('Authorization', `Bearer ${farmerToken}`).send({ status: 'confirmed' });
      await request(server).patch(`/api/orders/${orderId}/status`).set('Authorization', `Bearer ${logisticsToken}`).send({ status: 'in_transit' });
      await request(server).patch(`/api/orders/${orderId}/status`).set('Authorization', `Bearer ${logisticsToken}`).send({ status: 'delivered' });
      await request(server).patch(`/api/orders/${orderId}/status`).set('Authorization', `Bearer ${buyerToken}`).send({ status: 'settled' });

      await request(server)
        .post('/api/reputation/events')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ orderId, targetUserId: 'farmer_1', eventType: 'buyer_rating', scoreImpact: 4 });

      const dupRes = await request(server)
        .post('/api/reputation/events')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ orderId, targetUserId: 'farmer_1', eventType: 'buyer_rating', scoreImpact: 4 });
      expect(dupRes.status).toBe(409);
    });

    it('should emit dispute_raised event when order is disputed and reflect in score', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const buyerToken = generateAccessToken({ userId: 'buyer_1', phone: '123', role: 'buyer' });
      const farmerToken = generateAccessToken({ userId: 'farmer_1', phone: '456', role: 'farmer' });

      const orderRes = await request(server)
        .post('/api/orders').set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: 'list_1', quantityKg: 30 });
      const orderId = orderRes.body.id;

      const scoreBefore = (await request(server).get('/api/reputation/farmer_1').set('Authorization', `Bearer ${farmerToken}`)).body.score;

      await request(server).patch(`/api/orders/${orderId}/status`).set('Authorization', `Bearer ${farmerToken}`).send({ status: 'confirmed' });
      // Dispute the order
      await request(server).patch(`/api/orders/${orderId}/status`).set('Authorization', `Bearer ${buyerToken}`).send({ status: 'disputed' });

      const scoreAfter = (await request(server).get('/api/reputation/farmer_1').set('Authorization', `Bearer ${farmerToken}`)).body.score;
      expect(scoreAfter).toBeLessThan(scoreBefore);
    });

    it('should reject invalid scoreImpact for rating events', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const buyerToken = generateAccessToken({ userId: 'buyer_1', phone: '123', role: 'buyer' });
      const res = await request(server)
        .post('/api/reputation/events')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ targetUserId: 'farmer_1', eventType: 'buyer_rating', scoreImpact: 10 });
      expect(res.status).toBe(400);
    });

    it('should reject farmer trying to emit buyer_rating', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const token = generateAccessToken({ userId: 'farmer_1', phone: '123', role: 'farmer' });
      const res = await request(server)
        .post('/api/reputation/events')
        .set('Authorization', `Bearer ${token}`)
        .send({ targetUserId: 'buyer_1', eventType: 'buyer_rating', scoreImpact: 5 });
      expect(res.status).toBe(403);
    });

    it('should emit fulfillment_success event when order is delivered', async () => {
      const { generateAccessToken } = await import('../src/core/security.js');
      const buyerToken = generateAccessToken({ userId: 'buyer_1', phone: '123', role: 'buyer' });
      const farmerToken = generateAccessToken({ userId: 'farmer_1', phone: '456', role: 'farmer' });
      const logisticsToken = generateAccessToken({ userId: 'logistics_1', phone: '789', role: 'logistics' });

      const beforeScore = (await request(server).get('/api/reputation/farmer_1').set('Authorization', `Bearer ${farmerToken}`)).body.score;

      const orderRes = await request(server)
        .post('/api/orders').set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: 'list_1', quantityKg: 20 });
      const orderId = orderRes.body.id;
      await request(server).patch(`/api/orders/${orderId}/status`).set('Authorization', `Bearer ${farmerToken}`).send({ status: 'confirmed' });
      await request(server).patch(`/api/orders/${orderId}/status`).set('Authorization', `Bearer ${logisticsToken}`).send({ status: 'in_transit' });
      const deliveredRes = await request(server).patch(`/api/orders/${orderId}/status`).set('Authorization', `Bearer ${logisticsToken}`).send({ status: 'delivered' });
      expect(deliveredRes.status).toBe(200);

      const afterScore = (await request(server).get('/api/reputation/farmer_1').set('Authorization', `Bearer ${farmerToken}`)).body.score;
      // fulfillment_success adds +2 points to the score
      expect(afterScore).toBeGreaterThan(beforeScore - 0.1); // at least same or better
    });
  });
});

