import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { store, createStore } from '../src/data/store';
import { SEED_BUYERS, SEED_FARMERS } from '../src/data/seedData';
import { scoreMatch } from '../src/services/matchingService';

/**
 * Helper: Full OTP flow to get an access token for a given phone number.
 */
async function getToken(phone: string): Promise<string> {
  await request(app).post('/api/auth/otp/send').send({ phone });
  // The OTP is stored in the server's in-memory otpStore. 
  // In test mode we rely on the dev bypass: if the phone is seeded and OTP matches
  // the stored one, we get a token. We need to get the OTP from the server logs.
  // Since we can't intercept logs easily, we use the same trick as api.test.ts:
  // send OTP, then immediately call verify with the known pattern.
  // Actually the existing api.test.ts shows it sends OTP first to register it, 
  // then verifies using the actual generated OTP captured via the response.
  // We need to capture it differently. Looking at api.test.ts pattern more closely...
  // The simplest approach: call send, then verify with the mock OTP.
  // But there's no fixed OTP — the server generates a random one.
  // api.test.ts captures it by checking the send response body doesn't have OTP (it logs it),
  // so we need to use the same approach: call send, then verify with any OTP—no wait,
  // that won't work. Let me look at what api.test.ts actually does again.
  // From api.test.ts line 602-607:
  //   await request(app).post('/api/auth/otp/send').send({phone})
  //   const verifyRes = await request(app).post('/api/auth/otp/verify').send({phone, otp: ???})
  // The server stores the OTP internally. We need to know it.
  // TRICK: In test, since it's the same process, we can import the otpStore... but it's not exported.
  // Alternative: Re-read api.test.ts for the actual pattern used.
  return ''; // placeholder
}

describe('Phase 13: Matching Engine API', () => {
  let buyerToken: string;
  let farmerToken: string;
  const buyer = SEED_BUYERS[0]; // buyer_1: +91 99801 88301
  const farmer = SEED_FARMERS[0]; // farmer_1: +91 98231 44521

  beforeAll(async () => {
    // Step 1: Send OTP — server generates and stores it
    await request(app).post('/api/auth/otp/send').send({ phone: buyer.phone });
    await request(app).post('/api/auth/otp/send').send({ phone: farmer.phone });

    // Step 2: Verify OTP — we need the actual OTP.
    // The server logs it but doesn't return it. We use the same workaround as api.test.ts:
    // send it again so it regenerates, then brute-force... no. 
    // Actually the safest way that mirrors api.test.ts: 
    // We import generateAccessToken from security to create tokens directly.
    const { generateAccessToken } = await import('../src/core/security.js');
    buyerToken = generateAccessToken({ userId: buyer.id, phone: buyer.phone, role: 'buyer' });
    farmerToken = generateAccessToken({ userId: farmer.id, phone: farmer.phone, role: 'farmer' });
  });

  beforeEach(() => {
    Object.assign(store, createStore());
  });

  // ── Unit tests for the scoreMatch function ──────────────────────────────

  describe('scoreMatch() deterministic unit tests', () => {
    const mockListing = store.listings.find(l => l.status === 'active')!;

    it('should return score out of 100 max', () => {
      const result = scoreMatch(mockListing, buyer);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should return all four factor scores', () => {
      const result = scoreMatch(mockListing, buyer);
      expect(result.factors).toHaveProperty('distanceScore');
      expect(result.factors).toHaveProperty('qualityScore');
      expect(result.factors).toHaveProperty('priceScore');
      expect(result.factors).toHaveProperty('reputationScore');
    });

    it('should score Grade A listing higher than Grade C on quality factor', () => {
      const gradeA = { ...mockListing, quality: { ...mockListing.quality, grade: 'A' as const } };
      const gradeC = { ...mockListing, quality: { ...mockListing.quality, grade: 'C' as const } };
      expect(scoreMatch(gradeA, buyer).factors.qualityScore).toBeGreaterThan(scoreMatch(gradeC, buyer).factors.qualityScore);
    });

    it('should score a fair-priced listing higher than an overpriced listing', () => {
      const fairListing = { ...mockListing, priceExpected: mockListing.priceAi.fair - 1 };
      const overListing = { ...mockListing, priceExpected: mockListing.priceAi.max + 10 };
      expect(scoreMatch(fairListing, buyer).factors.priceScore).toBeGreaterThan(scoreMatch(overListing, buyer).factors.priceScore);
    });

    it('should score higher reputation farmer higher', () => {
      const highRep = { ...mockListing, farmerReputation: 5.0 };
      const lowRep = { ...mockListing, farmerReputation: 1.0 };
      expect(scoreMatch(highRep, buyer).factors.reputationScore).toBeGreaterThan(scoreMatch(lowRep, buyer).factors.reputationScore);
    });

    it('should be deterministic — same inputs produce same outputs', () => {
      const r1 = scoreMatch(mockListing, buyer);
      const r2 = scoreMatch(mockListing, buyer);
      expect(r1.score).toBe(r2.score);
      expect(r1.distanceKm).toBe(r2.distanceKm);
    });
  });

  // ── API endpoint tests ──────────────────────────────────────────────────

  describe('GET /api/matching/buyer/:id', () => {
    it('should return 401 if no token provided', async () => {
      const res = await request(app).get(`/api/matching/buyer/${buyer.id}`);
      expect(res.status).toBe(401);
    });

    it('should return 403 if accessed by farmer (wrong role)', async () => {
      const res = await request(app)
        .get(`/api/matching/buyer/${buyer.id}`)
        .set('Authorization', `Bearer ${farmerToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 403 if buyer requests matches for a different buyer id', async () => {
      const otherBuyerId = SEED_BUYERS[1]?.id || 'buyer_2';
      const res = await request(app)
        .get(`/api/matching/buyer/${otherBuyerId}`)
        .set('Authorization', `Bearer ${buyerToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 200 with ranked listings for authorized buyer', async () => {
      const res = await request(app)
        .get(`/api/matching/buyer/${buyer.id}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();

      if (res.body.length > 1) {
        expect(res.body[0].matchScore).toBeGreaterThanOrEqual(res.body[1].matchScore);
      }

      if (res.body.length > 0) {
        const topMatch = res.body[0];
        expect(topMatch).toHaveProperty('matchScore');
        expect(topMatch).toHaveProperty('distanceKm');
        expect(topMatch).toHaveProperty('matchFactors');
        expect(topMatch.matchFactors).toHaveProperty('distanceScore');
        expect(topMatch.matchFactors).toHaveProperty('qualityScore');
        expect(topMatch.matchFactors).toHaveProperty('priceScore');
        expect(topMatch.matchFactors).toHaveProperty('reputationScore');
      }
    });

    it('should only include active listings', async () => {
      const res = await request(app)
        .get(`/api/matching/buyer/${buyer.id}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(res.status).toBe(200);
      res.body.forEach((l: any) => {
        expect(l.status).toBe('active');
      });
    });

    it('should return 404 if buyer id does not exist', async () => {
      // We need a token for an unknown buyer id — create one manually
      const { generateAccessToken } = await import('../src/core/security.js');
      const ghostToken = generateAccessToken({ userId: 'buyer_ghost', phone: '+91 00000 00000', role: 'buyer' });
      const res = await request(app)
        .get('/api/matching/buyer/buyer_ghost')
        .set('Authorization', `Bearer ${ghostToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/matching/listing/:id', () => {
    let testListingId: string;

    beforeAll(() => {
      const listing = store.listings.find(l => l.status === 'active');
      testListingId = listing?.id ?? 'list_1';
    });

    it('should return 401 if no token provided', async () => {
      const res = await request(app).get(`/api/matching/listing/${testListingId}`);
      expect(res.status).toBe(401);
    });

    it('should return 403 if accessed by buyer (non-farmer)', async () => {
      const res = await request(app)
        .get(`/api/matching/listing/${testListingId}`)
        .set('Authorization', `Bearer ${buyerToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 200 with ranked buyers for authorized farmer', async () => {
      const res = await request(app)
        .get(`/api/matching/listing/${testListingId}`)
        .set('Authorization', `Bearer ${farmerToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();

      if (res.body.length > 1) {
        expect(res.body[0].matchScore).toBeGreaterThanOrEqual(res.body[1].matchScore);
      }

      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('matchScore');
        expect(res.body[0]).toHaveProperty('distanceKm');
      }
    });

    it('should return 404 for unknown listing id', async () => {
      const res = await request(app)
        .get('/api/matching/listing/NONEXISTENT_ID')
        .set('Authorization', `Bearer ${farmerToken}`);
      expect(res.status).toBe(404);
    });
  });
});
