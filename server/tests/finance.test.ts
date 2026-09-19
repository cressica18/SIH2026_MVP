import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { generateAccessToken } from '../src/core/security';
import { SEED_FARMERS } from '../src/data/seedData';
import { assessRisk, calculatePriceVolatilityIndex, calculateFulfillmentRate, calculateAvgQualityGrade, calculateRiskScore, getRiskTier, calculateEligibleAdvance } from '../src/services/riskService';
import { store, createStore } from '../src/data/store';

describe('Phase 16: Financial Inclusion - Risk Scoring + AEPS Simulation', () => {
  let farmer1Token: string;
  let farmer2Token: string;
  let farmer3Token: string;
  let adminToken: string;

  beforeAll(() => {
    const farmer1 = SEED_FARMERS[0]; // farmer_1, Maharashtra, 3.5 acres, rep 4.9, 38 fulfilled
    const farmer2 = SEED_FARMERS[1]; // farmer_2, Karnataka, 2.2 acres, rep 4.8, 24 fulfilled
    const farmer3 = SEED_FARMERS[2]; // farmer_3, Punjab, 5.0 acres, rep 4.7, 19 fulfilled, 1 dispute
    farmer1Token = generateAccessToken({ userId: farmer1.id, phone: farmer1.phone, role: 'farmer' });
    farmer2Token = generateAccessToken({ userId: farmer2.id, phone: farmer2.phone, role: 'farmer' });
    farmer3Token = generateAccessToken({ userId: farmer3.id, phone: farmer3.phone, role: 'farmer' });
    adminToken = generateAccessToken({ userId: 'admin_1', phone: '+91 99999 99999', role: 'admin' });
  });

  beforeEach(() => {
    Object.assign(store, createStore());
  });

  // ── Unit tests: Risk factor calculations ────────────────────────────────────

  describe('Risk factor calculations — unit tests', () => {
    it('calculatePriceVolatilityIndex should return Low/Moderate/High based on listing price variance', () => {
      const vol1 = calculatePriceVolatilityIndex('farmer_1');
      expect(['Low', 'Moderate', 'High']).toContain(vol1);
    });

    it('calculateFulfillmentRate should return percentage string for farmer with orders', () => {
      const rate = calculateFulfillmentRate('farmer_1');
      expect(rate).toMatch(/^\d+%$/);
      expect(parseInt(rate)).toBeGreaterThanOrEqual(0);
      expect(parseInt(rate)).toBeLessThanOrEqual(100);
    });

    it('calculateFulfillmentRate should return N/A for farmer with no relevant orders', () => {
      const rate = calculateFulfillmentRate('farmer_ghost');
      expect(rate).toBe('N/A');
    });

    it('calculateAvgQualityGrade should return Grade A/B/C based on listings', () => {
      const grade = calculateAvgQualityGrade('farmer_1');
      expect(['Grade A', 'Grade B', 'Grade C', 'N/A']).toContain(grade);
    });

    it('calculateRiskScore should produce score 0-100', () => {
      const factors = {
        priceVolatilityIndex: 'Low' as const,
        fulfillmentRate: '100%',
        avgQualityGrade: 'Grade A',
        reputationScore: 4.9,
        landHoldingWeight: '3.5 Acres'
      };
      const score = calculateRiskScore(factors);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('calculateRiskScore should give lower score for better factors', () => {
      const goodFactors = {
        priceVolatilityIndex: 'Low' as const,
        fulfillmentRate: '100%',
        avgQualityGrade: 'Grade A',
        reputationScore: 4.9,
        landHoldingWeight: '5.0 Acres'
      };
      const badFactors = {
        priceVolatilityIndex: 'High' as const,
        fulfillmentRate: '50%',
        avgQualityGrade: 'Grade C',
        reputationScore: 2.0,
        landHoldingWeight: '0.5 Acres'
      };
      expect(calculateRiskScore(goodFactors)).toBeLessThan(calculateRiskScore(badFactors));
    });

    it('getRiskTier should classify scores correctly', () => {
      expect(getRiskTier(15)).toBe('Low Risk');
      expect(getRiskTier(30)).toBe('Low Risk');
      expect(getRiskTier(40)).toBe('Moderate Risk');
      expect(getRiskTier(60)).toBe('Moderate Risk');
      expect(getRiskTier(65)).toBe('High Risk');
      expect(getRiskTier(90)).toBe('High Risk');
    });

    it('calculateEligibleAdvance should return amount based on tier, reputation, land', () => {
      const lowRiskAdvance = calculateEligibleAdvance('Low Risk', 5.0, 5.0);
      const moderateAdvance = calculateEligibleAdvance('Moderate Risk', 4.0, 2.0);
      const highRiskAdvance = calculateEligibleAdvance('High Risk', 3.0, 1.0);
      
      expect(lowRiskAdvance).toBeGreaterThan(moderateAdvance);
      expect(moderateAdvance).toBeGreaterThan(highRiskAdvance);
      expect(highRiskAdvance).toBe(0);
    });

    it('calculateEligibleAdvance should round to nearest 1000', () => {
      const advance = calculateEligibleAdvance('Low Risk', 4.5, 3.0);
      expect(advance % 1000).toBe(0);
    });
  });

  // ── Unit tests: assessRisk deterministic behavior ──────────────────────────

  describe('assessRisk() — deterministic end-to-end risk assessment', () => {
    it('should return seeded risk for farmer_1', () => {
      const risk = assessRisk('farmer_1');
      expect(risk.farmerId).toBe('farmer_1');
      expect(risk.riskScore).toBe(16);
      expect(risk.riskTier).toBe('Low Risk');
      expect(risk.eligibleAdvanceAmount).toBe(45000);
      expect(risk.factors).toBeDefined();
      expect(risk.explanation).toBeTruthy();
    });

    it('should compute deterministic risk for farmer_2 (no seed)', () => {
      const risk1 = assessRisk('farmer_2');
      const risk2 = assessRisk('farmer_2');
      expect(risk1.riskScore).toBe(risk2.riskScore);
      expect(risk1.riskTier).toBe(risk2.riskTier);
      expect(risk1.eligibleAdvanceAmount).toBe(risk2.eligibleAdvanceAmount);
      expect(risk1.factors).toEqual(risk2.factors);
    });

    it('should compute deterministic risk for farmer_3 (with dispute)', () => {
      const risk1 = assessRisk('farmer_3');
      const risk2 = assessRisk('farmer_3');
      expect(risk1.riskScore).toBe(risk2.riskScore);
      expect(risk1.riskTier).toBe(risk2.riskTier);
    });

    it('should throw for unknown farmer', () => {
      expect(() => assessRisk('farmer_ghost')).toThrow('not found');
    });

    it('should include all required factor fields', () => {
      const risk = assessRisk('farmer_2');
      expect(risk.factors).toHaveProperty('priceVolatilityIndex');
      expect(risk.factors).toHaveProperty('fulfillmentRate');
      expect(risk.factors).toHaveProperty('avgQualityGrade');
      expect(risk.factors).toHaveProperty('reputationScore');
      expect(risk.factors).toHaveProperty('landHoldingWeight');
    });

    it('should produce explanation mentioning all factors', () => {
      const risk = assessRisk('farmer_2');
      expect(risk.explanation).toContain('Price volatility index');
      expect(risk.explanation).toContain('Order fulfillment rate');
      expect(risk.explanation).toContain('Average produce quality grade');
      expect(risk.explanation).toContain('Trust reputation score');
      expect(risk.explanation).toContain('Land holding');
    });
  });

  // ── API tests: GET /api/finance/risk/:farmerId ────────────────────────────

  describe('GET /api/finance/risk/:farmerId', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/finance/risk/farmer_1');
      expect(res.status).toBe(401);
    });

    it('should return 403 if farmer tries to view another farmer risk', async () => {
      const res = await request(app)
        .get('/api/finance/risk/farmer_1')
        .set('Authorization', `Bearer ${farmer2Token}`);
      expect(res.status).toBe(403);
    });

    it('should allow admin to view any farmer risk', async () => {
      const res = await request(app)
        .get('/api/finance/risk/farmer_1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.farmerId).toBe('farmer_1');
    });

    it('should allow farmer to view own risk', async () => {
      const res = await request(app)
        .get('/api/finance/risk/farmer_1')
        .set('Authorization', `Bearer ${farmer1Token}`);
      expect(res.status).toBe(200);
      expect(res.body.farmerId).toBe('farmer_1');
      expect(res.body.riskScore).toBeDefined();
      expect(res.body.riskTier).toBeDefined();
      expect(res.body.eligibleAdvanceAmount).toBeDefined();
    });

    it('should return 404 for non-existent farmer', async () => {
      const res = await request(app)
        .get('/api/finance/risk/farmer_ghost')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });

    it('should produce deterministic results across calls', async () => {
      const res1 = await request(app)
        .get('/api/finance/risk/farmer_2')
        .set('Authorization', `Bearer ${farmer2Token}`);
      const res2 = await request(app)
        .get('/api/finance/risk/farmer_2')
        .set('Authorization', `Bearer ${farmer2Token}`);
      expect(res1.body.riskScore).toBe(res2.body.riskScore);
      expect(res1.body.eligibleAdvanceAmount).toBe(res2.body.eligibleAdvanceAmount);
    });
  });

  // ── API tests: POST /api/finance/advances ──────────────────────────────────

  describe('POST /api/finance/advances', () => {
    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/finance/advances')
        .send({ amountRequested: 10000 });
      expect(res.status).toBe(401);
    });

    it('should return 403 for non-farmer role', async () => {
      const buyerToken = generateAccessToken({ userId: 'buyer_1', phone: '+91 99801 88301', role: 'buyer' });
      const res = await request(app)
        .post('/api/finance/advances')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ amountRequested: 10000 });
      expect(res.status).toBe(403);
    });

    it('should reject invalid amount (<= 0)', async () => {
      const res = await request(app)
        .post('/api/finance/advances')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({ amountRequested: 0 });
      expect(res.status).toBe(400);
    });

    it('should reject amount exceeding eligible advance', async () => {
      const riskRes = await request(app)
        .get('/api/finance/risk/farmer_1')
        .set('Authorization', `Bearer ${farmer1Token}`);
      const eligible = riskRes.body.eligibleAdvanceAmount;
      
      const res = await request(app)
        .post('/api/finance/advances')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({ amountRequested: eligible + 10000 });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('exceeds eligible advance');
    });

    it('should create advance request with status requested', async () => {
      const res = await request(app)
        .post('/api/finance/advances')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({ amountRequested: 10000, purpose: 'Seeds' });
      expect(res.status).toBe(201);
      expect(res.body.amountRequested).toBe(10000);
      expect(res.body.purpose).toBe('Seeds');
      expect(res.body.status).toBe('requested');
      expect(res.body.farmerId).toBe('farmer_1');
      expect(res.body.id).toMatch(/^ADV-\d+$/);
    });

    it('should default purpose to "Working Capital"', async () => {
      const res = await request(app)
        .post('/api/finance/advances')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({ amountRequested: 5000 });
      expect(res.status).toBe(201);
      expect(res.body.purpose).toBe('Working Capital');
    });
  });

  // ── API tests: GET /api/finance/advances ───────────────────────────────────

  describe('GET /api/finance/advances', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/finance/advances');
      expect(res.status).toBe(401);
    });

    it('should return only farmer own advances', async () => {
      // Create advance for farmer_1
      await request(app)
        .post('/api/finance/advances')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({ amountRequested: 10000 });
      
      const res = await request(app)
        .get('/api/finance/advances')
        .set('Authorization', `Bearer ${farmer1Token}`);
      expect(res.status).toBe(200);
      expect(res.body.advances.length).toBe(1);
      expect(res.body.advances[0].farmerId).toBe('farmer_1');
    });

    it('should return empty array for farmer with no advances', async () => {
      const res = await request(app)
        .get('/api/finance/advances')
        .set('Authorization', `Bearer ${farmer2Token}`);
      expect(res.status).toBe(200);
      expect(res.body.advances).toEqual([]);
    });

    it('should allow admin to see all advances', async () => {
      await request(app)
        .post('/api/finance/advances')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({ amountRequested: 10000 });
      
      const res = await request(app)
        .get('/api/finance/advances')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.advances.length).toBeGreaterThan(0);
    });
  });

  // ── API tests: POST /api/finance/aeps/simulate-cashout ─────────────────────

  describe('POST /api/finance/aeps/simulate-cashout', () => {
    let advanceId: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/finance/advances')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({ amountRequested: 15000, purpose: 'Test' });
      advanceId = res.body.id;
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/finance/aeps/simulate-cashout')
        .send({ advanceId, aadhaarLast4: '1234' });
      expect(res.status).toBe(401);
    });

    it('should return 403 for non-farmer role', async () => {
      const buyerToken = generateAccessToken({ userId: 'buyer_1', phone: '+91 99801 88301', role: 'buyer' });
      const res = await request(app)
        .post('/api/finance/aeps/simulate-cashout')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ advanceId, aadhaarLast4: '1234' });
      expect(res.status).toBe(403);
    });

    it('should reject missing advanceId', async () => {
      const res = await request(app)
        .post('/api/finance/aeps/simulate-cashout')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({ aadhaarLast4: '1234' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('advanceId is required');
    });

    it('should reject invalid aadhaarLast4 (not 4 digits)', async () => {
      const res = await request(app)
        .post('/api/finance/aeps/simulate-cashout')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({ advanceId, aadhaarLast4: '123' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('4-digit');
    });

    it('should reject advance belonging to another farmer', async () => {
      const res = await request(app)
        .post('/api/finance/aeps/simulate-cashout')
        .set('Authorization', `Bearer ${farmer2Token}`)
        .send({ advanceId, aadhaarLast4: '1234' });
      expect(res.status).toBe(404);
    });

    it('should reject already disbursed advance', async () => {
      // First disbursement
      await request(app)
        .post('/api/finance/aeps/simulate-cashout')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({ advanceId, aadhaarLast4: '1234' });
      
      // Second attempt
      const res = await request(app)
        .post('/api/finance/aeps/simulate-cashout')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({ advanceId, aadhaarLast4: '1234' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('already disbursed');
    });

    it('should successfully simulate AEPS cash-out', async () => {
      const res = await request(app)
        .post('/api/finance/aeps/simulate-cashout')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({ advanceId, aadhaarLast4: '4521' });
      
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/MOCK|SIMULATED/i);
      expect(res.body.advance.status).toBe('disbursed');
      expect(res.body.advance.aepsTxnRef).toMatch(/^NPCI-AEPS-/);
      expect(res.body.advance.disbursedAt).toBeDefined();
      expect(res.body.mockDetails).toBeDefined();
      expect(res.body.mockDetails.aadhaarLast4).toBe('4521');
      expect(res.body.mockDetails.bcAgent).toBeDefined();
      expect(res.body.mockDetails.bank).toBeDefined();
      expect(res.body.mockDetails.note).toMatch(/SIMULATED|demo/i);
    });

    it('should generate unique transaction reference each time', async () => {
      // Create two advances
      const res1 = await request(app)
        .post('/api/finance/advances')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({ amountRequested: 5000 });
      const res2 = await request(app)
        .post('/api/finance/advances')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({ amountRequested: 5000 });
      
      const aeps1 = await request(app)
        .post('/api/finance/aeps/simulate-cashout')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({ advanceId: res1.body.id, aadhaarLast4: '1111' });
      const aeps2 = await request(app)
        .post('/api/finance/aeps/simulate-cashout')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({ advanceId: res2.body.id, aadhaarLast4: '2222' });
      
      expect(aeps1.body.advance.aepsTxnRef).not.toBe(aeps2.body.advance.aepsTxnRef);
    });
  });

  // ── Integration: Risk assessment integrates with reputation/order data ──────

  describe('Risk assessment integration with reputation and orders', () => {
    it('should reflect fulfillment rate from order history', async () => {
      const risk = await request(app)
        .get('/api/finance/risk/farmer_1')
        .set('Authorization', `Bearer ${farmer1Token}`);
      expect(risk.body.factors.fulfillmentRate).toBe('100%');
    });

    it('should reflect quality grade from listing history', async () => {
      const risk = await request(app)
        .get('/api/finance/risk/farmer_1')
        .set('Authorization', `Bearer ${farmer1Token}`);
      expect(risk.body.factors.avgQualityGrade).toBe('Grade A');
    });

    it('should reflect reputation score from profile', async () => {
      const risk = await request(app)
        .get('/api/finance/risk/farmer_1')
        .set('Authorization', `Bearer ${farmer1Token}`);
      expect(risk.body.factors.reputationScore).toBe(4.9);
    });

    it('should reflect land holding from profile', async () => {
      const risk = await request(app)
        .get('/api/finance/risk/farmer_1')
        .set('Authorization', `Bearer ${farmer1Token}`);
      expect(risk.body.factors.landHoldingWeight).toBe('3.5 Acres');
    });

    it('farmer with dispute should have higher risk score', async () => {
      const risk1 = await request(app)
        .get('/api/finance/risk/farmer_1')
        .set('Authorization', `Bearer ${farmer1Token}`);
      const risk3 = await request(app)
        .get('/api/finance/risk/farmer_3')
        .set('Authorization', `Bearer ${farmer3Token}`);
      // farmer_3 has 1 dispute, farmer_1 has 0
      expect(risk3.body.riskScore).toBeGreaterThanOrEqual(risk1.body.riskScore);
    });
  });

  // ── Edge cases ─────────────────────────────────────────────────────────────

  describe('Edge cases', () => {
    it('should handle farmer with no listings gracefully', async () => {
      // farmer_4 has fewer orders
      const farmer4Token = generateAccessToken({ userId: 'farmer_4', phone: '+91 97554 11203', role: 'farmer' });
      const risk = await request(app)
        .get('/api/finance/risk/farmer_4')
        .set('Authorization', `Bearer ${farmer4Token}`);
      expect(risk.status).toBe(200);
      expect(risk.body.riskScore).toBeDefined();
    });

    it('should handle farmer with no orders (fulfillmentRate N/A)', async () => {
      const farmer4Token = generateAccessToken({ userId: 'farmer_4', phone: '+91 97554 11203', role: 'farmer' });
      const risk = await request(app)
        .get('/api/finance/risk/farmer_4')
        .set('Authorization', `Bearer ${farmer4Token}`);
      expect(risk.status).toBe(200);
      expect(risk.body.factors.fulfillmentRate).toBe('N/A');
    });

    it('advance request with exact eligible amount should succeed', async () => {
      const riskRes = await request(app)
        .get('/api/finance/risk/farmer_1')
        .set('Authorization', `Bearer ${farmer1Token}`);
      const eligible = riskRes.body.eligibleAdvanceAmount;
      
      const res = await request(app)
        .post('/api/finance/advances')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({ amountRequested: eligible });
      expect(res.status).toBe(201);
    });

    it('AEPS simulation response should be labeled as MOCK', async () => {
      const advanceRes = await request(app)
        .post('/api/finance/advances')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({ amountRequested: 5000 });
      
      const res = await request(app)
        .post('/api/finance/aeps/simulate-cashout')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({ advanceId: advanceRes.body.id, aadhaarLast4: '1234' });
      
      expect(res.body.message).toMatch(/MOCK|SIMULATED/i);
      expect(res.body.mockDetails.note).toMatch(/SIMULATED|demo/i);
    });
  });
});