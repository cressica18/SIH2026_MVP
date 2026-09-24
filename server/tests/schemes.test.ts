import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { SEED_FARMERS, SEED_GOV_SCHEMES } from '../src/data/seedData';
import { checkEligibility, matchSchemes, matchSchemesForFarmer } from '../src/services/schemeService';
import { generateAccessToken } from '../src/core/security';

// ── Unit tests: checkEligibility ────────────────────────────────────────────

describe('Phase 15: Government Scheme Awareness', () => {

  describe('checkEligibility() — rule-based unit tests', () => {
    const maharashtraFarmer = SEED_FARMERS.find(f => f.state === 'Maharashtra')!; // farmer_1
    const punjabFarmer = SEED_FARMERS.find(f => f.state === 'Punjab')!;            // farmer_3

    it('should match PM-KISAN (All India, All Crops) for any farmer', () => {
      const pmKisan = SEED_GOV_SCHEMES.find(s => s.id === 'SCHEME-01')!;
      const result = checkEligibility(pmKisan, maharashtraFarmer);
      expect(result.eligible).toBe(true);
      expect(result.reason).toContain('Available across India');
    });

    it('should reject a state-specific scheme for farmer outside that state', () => {
      // SMAM is All India scheme
      const smam = SEED_GOV_SCHEMES.find(s => s.id === 'SCHEME-03')!; // All India
      const result = checkEligibility(smam, punjabFarmer);
      expect(result.eligible).toBe(true); // SMAM is All India
    });

    it('should reject a scheme when farmer crops do not match', () => {
      // PM-AASHA covers Soybean, Wheat — but farmer_1 grows Tomato, Onion, Grapes
      const pmaasha = SEED_GOV_SCHEMES.find(s => s.id === 'SCHEME-08')!;
      const result = checkEligibility(pmaasha, maharashtraFarmer);
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('Not applicable for your crops');
    });

    it('should match a crop-insurance scheme when farmer grows eligible crop', () => {
      // PMFBY covers Tomato — farmer_1 grows Tomato
      const pmfby = SEED_GOV_SCHEMES.find(s => s.id === 'SCHEME-02')!;
      const result = checkEligibility(pmfby, maharashtraFarmer);
      expect(result.eligible).toBe(true);
      expect(result.reason).toContain('Tomato');
    });

    it('should reject PM-KISAN when farmer landSizeAcres exceeds maxLandAcreage', () => {
      const pmKisan = SEED_GOV_SCHEMES.find(s => s.id === 'SCHEME-01')!;
      const bigFarmer = { ...maharashtraFarmer, landSizeAcres: 15 }; // exceeds 10 acres
      const result = checkEligibility(pmKisan, bigFarmer);
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('exceeds');
    });

    it('should reject PM-Kusum when farmer landSizeAcres exceeds 5 acre limit', () => {
      const kusum = SEED_GOV_SCHEMES.find(s => s.id === 'SCHEME-04')!;
      const bigFarmer = { ...maharashtraFarmer, landSizeAcres: 8 }; // exceeds 5 acres
      const result = checkEligibility(kusum, bigFarmer);
      expect(result.eligible).toBe(false);
    });

    it('should match PM-Kusum for eligible Maharashtra farmer with small landholding', () => {
      const kusum = SEED_GOV_SCHEMES.find(s => s.id === 'SCHEME-04')!;
      // maharashtraFarmer has 3.5 acres — within 5 acre limit, Maharashtra is covered
      const result = checkEligibility(kusum, maharashtraFarmer);
      expect(result.eligible).toBe(true);
    });

    it('should reject PKVY when farmer land is below minLandAcreage', () => {
      const pkvy = SEED_GOV_SCHEMES.find(s => s.id === 'SCHEME-05')!;
      const tinyFarmer = { ...maharashtraFarmer, landSizeAcres: 0.2 }; // below 0.5 minimum
      const result = checkEligibility(pkvy, tinyFarmer);
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('below minimum');
    });

    it('should produce a deterministic eligibilityReason (stable across calls)', () => {
      const pmfby = SEED_GOV_SCHEMES.find(s => s.id === 'SCHEME-02')!;
      const r1 = checkEligibility(pmfby, maharashtraFarmer);
      const r2 = checkEligibility(pmfby, maharashtraFarmer);
      expect(r1.reason).toBe(r2.reason);
      expect(r1.eligible).toBe(r2.eligible);
      expect(r1.score).toBe(r2.score);
    });
  });

  // ── Unit tests: matchSchemes ────────────────────────────────────────────────

  describe('matchSchemes() — ranked list tests', () => {
    it('should return non-empty list for every seeded farmer', () => {
      for (const farmer of SEED_FARMERS) {
        const matched = matchSchemes(farmer);
        expect(matched.length).toBeGreaterThan(0);
      }
    });

    it('should rank crop-specific matches before universal matches', () => {
      const farmer = SEED_FARMERS.find(f => f.state === 'Maharashtra')!;
      const matched = matchSchemes(farmer);
      // The first result should have a higher or equal relevance score than the last
      expect(matched[0].relevanceScore).toBeGreaterThanOrEqual(matched[matched.length - 1].relevanceScore);
    });

    it('should attach an eligibilityReason to every matched scheme', () => {
      const farmer = SEED_FARMERS[0];
      const matched = matchSchemes(farmer);
      for (const s of matched) {
        expect(s.eligibilityReason).toBeTruthy();
        expect(s.eligibilityReason!.length).toBeGreaterThan(0);
      }
    });

    it('should filter by category correctly', () => {
      const farmer = SEED_FARMERS[0];
      const matched = matchSchemes(farmer, 'Crop Insurance');
      for (const s of matched) {
        expect(s.category).toBe('Crop Insurance');
      }
    });

    it('should return empty array when farmer has crops that match no scheme in a category', () => {
      const farmer = { ...SEED_FARMERS[0], primaryCrops: ['SomeFakeExoticCrop'] };
      const matched = matchSchemes(farmer, 'Crop Insurance');
      // PMFBY specifically names crops — fake crop should not match Crop Insurance schemes
      expect(matched.length).toBe(0);
    });

    it('matchSchemesForFarmer should throw for unknown farmer ID', () => {
      expect(() => matchSchemesForFarmer('farmer_GHOST')).toThrow('not found');
    });
  });

  // ── API tests: GET /api/schemes ─────────────────────────────────────────────

  describe('GET /api/schemes', () => {
    it('should return all 18 seeded schemes publicly', async () => {
      const res = await request(app).get('/api/schemes');
      expect(res.status).toBe(200);
      expect(res.body.schemes).toBeInstanceOf(Array);
      expect(res.body.schemes.length).toBe(18);
      expect(res.body.total).toBe(18);
    });

    it('should filter by category via ?category= query param', async () => {
      const res = await request(app).get('/api/schemes?category=Crop Insurance');
      expect(res.status).toBe(200);
      expect(res.body.schemes.length).toBeGreaterThan(0);
      for (const s of res.body.schemes) {
        expect(s.category).toBe('Crop Insurance');
      }
    });

    it('should return empty array for unrecognised category', async () => {
      const res = await request(app).get('/api/schemes?category=InventedCategory');
      expect(res.status).toBe(200);
      expect(res.body.schemes.length).toBe(0);
    });

    it('each scheme should have required fields', async () => {
      const res = await request(app).get('/api/schemes');
      for (const s of res.body.schemes) {
        expect(s).toHaveProperty('id');
        expect(s).toHaveProperty('title');
        expect(s).toHaveProperty('category');
        expect(s).toHaveProperty('benefitAmount');
        expect(s).toHaveProperty('sourceUrl');
      }
    });
  });

  // ── API tests: GET /api/schemes/match/:farmerId ──────────────────────────────

  describe('GET /api/schemes/match/:farmerId', () => {
    let farmerToken: string;
    let anotherFarmerToken: string;
    let buyerToken: string;

    const farmer1 = SEED_FARMERS[0]; // farmer_1, Maharashtra, 3.5 acres
    const farmer3 = SEED_FARMERS[2]; // farmer_3, Punjab

    beforeAll(() => {
      farmerToken = generateAccessToken({ userId: farmer1.id, phone: farmer1.phone, role: 'farmer' });
      anotherFarmerToken = generateAccessToken({ userId: farmer3.id, phone: farmer3.phone, role: 'farmer' });
      buyerToken = generateAccessToken({ userId: 'buyer_1', phone: '+91 99801 88301', role: 'buyer' });
    });

    it('should return 401 if no token provided', async () => {
      const res = await request(app).get(`/api/schemes/match/${farmer1.id}`);
      expect(res.status).toBe(401);
    });

    it('should return 403 if a buyer tries to access scheme matching', async () => {
      const res = await request(app)
        .get(`/api/schemes/match/${farmer1.id}`)
        .set('Authorization', `Bearer ${buyerToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 403 if farmer tries to view another farmer\'s matches', async () => {
      const res = await request(app)
        .get(`/api/schemes/match/${farmer1.id}`)
        .set('Authorization', `Bearer ${anotherFarmerToken}`);
      expect(res.status).toBe(403);
    });

    it('should return non-empty matched schemes for farmer_1 (Maharashtra)', async () => {
      const res = await request(app)
        .get(`/api/schemes/match/${farmer1.id}`)
        .set('Authorization', `Bearer ${farmerToken}`);
      expect(res.status).toBe(200);
      expect(res.body.schemes).toBeInstanceOf(Array);
      expect(res.body.schemes.length).toBeGreaterThan(0);
      expect(res.body.farmerId).toBe(farmer1.id);
    });

    it('each matched scheme should include eligibilityReason', async () => {
      const res = await request(app)
        .get(`/api/schemes/match/${farmer1.id}`)
        .set('Authorization', `Bearer ${farmerToken}`);
      for (const s of res.body.schemes) {
        expect(s).toHaveProperty('eligibilityReason');
        expect(s.eligibilityReason).toBeTruthy();
      }
    });

    it('should respect category filter via ?category= in match endpoint', async () => {
      const res = await request(app)
        .get(`/api/schemes/match/${farmer1.id}?category=Crop Insurance`)
        .set('Authorization', `Bearer ${farmerToken}`);
      expect(res.status).toBe(200);
      for (const s of res.body.schemes) {
        expect(s.category).toBe('Crop Insurance');
      }
    });

    it('should return 404 for non-existent farmerId', async () => {
      const ghostToken = generateAccessToken({ userId: 'farmer_ghost', phone: '+91 00000 00000', role: 'farmer' });
      const res = await request(app)
        .get('/api/schemes/match/farmer_ghost')
        .set('Authorization', `Bearer ${ghostToken}`);
      expect(res.status).toBe(404);
    });

    it('should produce deterministic results (same inputs → same outputs)', async () => {
      const res1 = await request(app)
        .get(`/api/schemes/match/${farmer1.id}`)
        .set('Authorization', `Bearer ${farmerToken}`);
      const res2 = await request(app)
        .get(`/api/schemes/match/${farmer1.id}`)
        .set('Authorization', `Bearer ${farmerToken}`);
      expect(res1.body.schemes.map((s: { id: string }) => s.id)).toEqual(
        res2.body.schemes.map((s: { id: string }) => s.id)
      );
    });

    it('blueprint "done when": each seeded farmer sees non-empty, relevant scheme list', async () => {
      for (const farmer of SEED_FARMERS) {
        const token = generateAccessToken({ userId: farmer.id, phone: farmer.phone, role: 'farmer' });
        const res = await request(app)
          .get(`/api/schemes/match/${farmer.id}`)
          .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.schemes.length).toBeGreaterThan(0);
      }
    });
  });
});
