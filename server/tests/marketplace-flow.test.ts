import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createServer } from 'http';
import app from '../src/app.js';
import { store, createStore } from '../src/data/store.js';
import { generateAccessToken } from '../src/core/security.js';

const server = createServer(app);

// Reset store before each test
beforeEach(() => {
  Object.assign(store, createStore());
});

/**
 * Helper: log in as farmer_1 (+91 98231 44521) and return token + profile.
 */
async function loginAsFarmer() {
  // Send OTP (captured from console in dev mode; here we directly generate a token)
  const token = generateAccessToken({
    userId: 'farmer_1',
    phone: '+91 98231 44521',
    role: 'farmer',
  });
  const profileRes = await request(server)
    .get('/api/users/profile')
    .set('Authorization', `Bearer ${token}`);
  expect(profileRes.status).toBe(200);
  return { token, profile: profileRes.body.profile };
}

/**
 * Helper: log in as buyer_1 (+91 99801 88301) and return token.
 */
async function loginAsBuyer() {
  const token = generateAccessToken({
    userId: 'buyer_1',
    phone: '+91 99801 88301',
    role: 'buyer',
  });
  return { token };
}

describe('Marketplace Flow Verification — Farmer → Listing → Buyer → Order', () => {

  describe('1. Farmer creates a listing and it persists in the backend', () => {
    it('should create a new listing and return it with anonSellerId', async () => {
      const { token } = await loginAsFarmer();

      const res = await request(server)
        .post('/api/listings')
        .set('Authorization', `Bearer ${token}`)
        .send({
          crop: 'Wheat',
          variety: 'Sharbati',
          quantityKg: 1000,
          priceExpected: 22,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.crop).toBe('Wheat');
      expect(res.body.quantityKg).toBe(1000);
      expect(res.body.priceExpected).toBe(22);
      expect(res.body).toHaveProperty('anonSellerId');
      expect(res.body.status).toBe('active');
    });

    it('should persist the new listing so GET /api/listings returns it', async () => {
      const { token } = await loginAsFarmer();

      // Create listing
      await request(server)
        .post('/api/listings')
        .set('Authorization', `Bearer ${token}`)
        .send({ crop: 'Wheat', variety: 'Test', quantityKg: 500, priceExpected: 20 });

      // Verify via GET /api/listings
      const listRes = await request(server).get('/api/listings');
      expect(listRes.status).toBe(200);
      const wheatListings = listRes.body.listings.filter(
        (l: any) => l.crop === 'Wheat'
      );
      expect(wheatListings.length).toBeGreaterThanOrEqual(1);
      expect(wheatListings[0].anonSellerId).toBe('FARM-88214');
    });
  });

  describe('2. Buyer sees newly created listing in marketplace', () => {
    it('should show the new listing when buyer fetches GET /api/listings', async () => {
      const { token: farmerToken } = await loginAsFarmer();

      // Farmer creates listing
      const createRes = await request(server)
        .post('/api/listings')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ crop: 'Soybean', variety: 'Test Var', quantityKg: 800, priceExpected: 25 });
      expect(createRes.status).toBe(201);
      const newListingId = createRes.body.id;

      // Buyer fetches listings
      const { token: buyerToken } = await loginAsBuyer();
      const listRes = await request(server)
        .get('/api/listings')
        .set('Authorization', `Bearer ${buyerToken}`);
      expect(listRes.status).toBe(200);
      const listingIds = listRes.body.listings.map((l: any) => l.id);
      expect(listingIds).toContain(newListingId);
    });

    it('should show crop, quantity, price, quality, region, anonymous seller identity in listing', async () => {
      const { token: farmerToken } = await loginAsFarmer();

      const createRes = await request(server)
        .post('/api/listings')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ crop: 'Potato', variety: 'Kufri', quantityKg: 1500, priceExpected: 15 });
      expect(createRes.status).toBe(201);

      const listing = createRes.body;
      // Verify all required fields are visible to buyer
      expect(listing).toHaveProperty('crop');
      expect(listing).toHaveProperty('quantityKg');
      expect(listing).toHaveProperty('priceExpected');
      expect(listing).toHaveProperty('quality');
      expect(listing.quality).toHaveProperty('grade');
      expect(listing).toHaveProperty('district');
      expect(listing).toHaveProperty('state');
      // Seller identity is anonymous
      expect(listing).toHaveProperty('anonSellerId');
      expect(listing.anonSellerId).toMatch(/^FARM-/);
      // Farmer real name is NOT exposed
      expect(listing.farmerRealName).toBeUndefined();
    });
  });

  describe('3. Buyer places order and it persists in the backend', () => {
    it('should create an order with status pending', async () => {
      const { token: farmerToken } = await loginAsFarmer();
      const { token: buyerToken } = await loginAsBuyer();

      // Farmer creates listing
      const createRes = await request(server)
        .post('/api/listings')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ crop: 'Tomato', variety: 'Test', quantityKg: 1000, priceExpected: 20 });
      const listingId = createRes.body.id;

      // Buyer places order
      const orderRes = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          listingId,
          crop: 'Tomato',
          variety: 'Test',
          quantityKg: 200,
          agreedPricePerKg: 20,
          totalAmount: 4000,
          buyerName: 'Test Buyer',
          buyerType: 'processor',
          buyerPhone: '+91 99801 88301',
          anonSellerId: 'FARM-88214',
          deliveryAddress: 'Test Address',
        });

      expect(orderRes.status).toBe(201);
      expect(orderRes.body).toHaveProperty('id');
      // Order should be pending (NOT confirmed)
      expect(orderRes.body.status).toBe('pending');
      expect(orderRes.body.identityRevealed).toBe(false);
      // Seller identity should NOT be revealed
      expect(orderRes.body.sellerRealName).toBeUndefined();
    });

    it('should verify the order is persisted and returned by GET /api/orders', async () => {
      const { token: farmerToken } = await loginAsFarmer();
      const { token: buyerToken } = await loginAsBuyer();

      const createRes = await request(server)
        .post('/api/listings')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ crop: 'Onion', variety: 'Test', quantityKg: 1000, priceExpected: 22 });
      const listingId = createRes.body.id;

      const orderRes = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          listingId,
          crop: 'Onion',
          variety: 'Test',
          quantityKg: 200,
          agreedPricePerKg: 22,
          totalAmount: 4400,
          buyerName: 'Test Buyer',
          buyerType: 'processor',
          buyerPhone: '+91 99801 88301',
          anonSellerId: 'FARM-88214',
          deliveryAddress: 'Test',
        });
      const orderId = orderRes.body.id;

      // Buyer queries orders
      const buyerOrdersRes = await request(server)
        .get('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`);
      expect(buyerOrdersRes.status).toBe(200);
      const buyerOrders = buyerOrdersRes.body.orders.filter(
        (o: any) => o.id === orderId
      );
      expect(buyerOrders.length).toBe(1);
      expect(buyerOrders[0].status).toBe('pending');
    });
  });

  describe('4. Farmer sees incoming order after buyer places it', () => {
    it('should show the order in farmer orders after creation', async () => {
      const { token: farmerToken } = await loginAsFarmer();
      const { token: buyerToken } = await loginAsBuyer();

      const createRes = await request(server)
        .post('/api/listings')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ crop: 'Green Chilli', variety: 'Test', quantityKg: 600, priceExpected: 30 });
      const listingId = createRes.body.id;

      await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          listingId,
          crop: 'Green Chilli',
          variety: 'Test',
          quantityKg: 100,
          agreedPricePerKg: 30,
          totalAmount: 3000,
          buyerName: 'Test Buyer',
          buyerType: 'processor',
          buyerPhone: '+91 99801 88301',
          anonSellerId: 'FARM-88214',
          deliveryAddress: 'Test',
        });

      // Farmer queries orders
      const farmerOrdersRes = await request(server)
        .get('/api/orders')
        .set('Authorization', `Bearer ${farmerToken}`);
      expect(farmerOrdersRes.status).toBe(200);
      const farmerOrders = farmerOrdersRes.body.orders;
      // Farmer should see the order (anonSellerId match)
      const matchedOrders = farmerOrders.filter(
        (o: any) => o.anonSellerId === 'FARM-88214'
      );
      expect(matchedOrders.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('5. Farmer identity is NOT exposed before correct order state', () => {
    it('should keep farmer identity hidden when order is pending', async () => {
      const { token: farmerToken } = await loginAsFarmer();
      const { token: buyerToken } = await loginAsBuyer();

      const createRes = await request(server)
        .post('/api/listings')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ crop: 'Wheat', variety: 'Test', quantityKg: 1000, priceExpected: 20 });
      const listingId = createRes.body.id;

      const orderRes = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          listingId,
          crop: 'Wheat',
          variety: 'Test',
          quantityKg: 200,
          agreedPricePerKg: 20,
          totalAmount: 4000,
          buyerName: 'Test Buyer',
          buyerType: 'processor',
          buyerPhone: '+91 99801 88301',
          anonSellerId: 'FARM-88214',
          deliveryAddress: 'Test',
        });

      // Order should NOT reveal farmer real name or phone
      expect(orderRes.body).not.toHaveProperty('sellerRealName');
      expect(orderRes.body).not.toHaveProperty('sellerPhone');
      expect(orderRes.body).not.toHaveProperty('sellerVillage');
      expect(orderRes.body).not.toHaveProperty('sellerDistrict');
      expect(orderRes.body).not.toHaveProperty('sellerState');
      // Anon seller ID should be visible
      expect(orderRes.body).toHaveProperty('anonSellerId', 'FARM-88214');
    });
  });

  describe('6. Farmer confirms order — identity revealed correctly', () => {
    it('should reveal farmer identity only after farmer confirms order', async () => {
      const { token: farmerToken } = await loginAsFarmer();
      const { token: buyerToken } = await loginAsBuyer();

      const createRes = await request(server)
        .post('/api/listings')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ crop: 'Tomato', variety: 'Test', quantityKg: 1000, priceExpected: 20 });
      const listingId = createRes.body.id;

      const orderRes = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          listingId,
          crop: 'Tomato',
          variety: 'Test',
          quantityKg: 200,
          agreedPricePerKg: 20,
          totalAmount: 4000,
          buyerName: 'Test Buyer',
          buyerType: 'processor',
          buyerPhone: '+91 99801 88301',
          anonSellerId: 'FARM-88214',
          deliveryAddress: 'Test',
        });
      const orderId = orderRes.body.id;

      // Order should NOT show farmer identity while pending
      expect(orderRes.body.identityRevealed).toBe(false);
      expect(orderRes.body.sellerRealName).toBeUndefined();

      // Farmer confirms order
      const confirmRes = await request(server)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ status: 'confirmed' });
      expect(confirmRes.status).toBe(200);
      expect(confirmRes.body.status).toBe('confirmed');
      expect(confirmRes.body.identityRevealed).toBe(true);
      // Now farmer identity IS revealed
      expect(confirmRes.body).toHaveProperty('sellerRealName');
      expect(confirmRes.body.sellerRealName).toBe('Ramesh Patil');
    });
  });

  describe('7. Order ownership checks', () => {
    it('should reject order creation from farmer role', async () => {
      const { token } = await loginAsFarmer();

      const res = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ listingId: 'list_1', quantityKg: 100 });
      expect(res.status).toBe(403);
    });

    it('should reject order for non-existent listing', async () => {
      const { token: buyerToken } = await loginAsBuyer();

      const res = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: 'nonexistent', quantityKg: 100 });
      expect(res.status).toBe(404);
    });

    it('should reject order when quantity exceeds available listing quantity', async () => {
      const { token: buyerToken } = await loginAsBuyer();

      const res = await request(server)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ listingId: 'list_1', quantityKg: 99999 });
      expect(res.status).toBe(400);
    });
  });

  describe('8. Refresh both dashboards and verify listing/order is still represented', () => {
    it('should persist listing after re-fetching GET /api/listings', async () => {
      const { token: farmerToken } = await loginAsFarmer();

      // Create listing
      await request(server)
        .post('/api/listings')
        .set('Authorization', `Bearer ${farmerToken}`)
        .send({ crop: 'Mustard', variety: 'Test', quantityKg: 500, priceExpected: 18 });

      // Re-fetch listings (simulates dashboard refresh)
      const listRes = await request(server).get('/api/listings');
      const mustardListings = listRes.body.listings.filter(
        (l: any) => l.crop === 'Mustard'
      );
      expect(mustardListings.length).toBeGreaterThanOrEqual(1);
      expect(mustardListings[0].status).toBe('active');
    });
  });
});
