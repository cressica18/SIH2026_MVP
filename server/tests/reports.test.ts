import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { generateAccessToken } from '../src/core/security';
import { SEED_FARMERS, SEED_BUYERS, SEED_ORDERS, SEED_SAFETY_REPORTS } from '../src/data/seedData';
import { store, createStore } from '../src/data/store';
import { createReport, getAllReports, updateReportStatus, validateReportInput } from '../src/services/reportService';

describe('Phase 18: Women-Centric Privacy & Anonymous Reporting', () => {
  let farmer1Token: string;
  let farmer2Token: string;
  let buyerToken: string;
  let adminToken: string;
  let logisticsToken: string;

  beforeAll(() => {
    farmer1Token = generateAccessToken({ userId: SEED_FARMERS[0].id, phone: SEED_FARMERS[0].phone, role: 'farmer' });
    farmer2Token = generateAccessToken({ userId: SEED_FARMERS[1].id, phone: SEED_FARMERS[1].phone, role: 'farmer' });
    buyerToken = generateAccessToken({ userId: SEED_BUYERS[0].id, phone: SEED_BUYERS[0].phone, role: 'buyer' });
    adminToken = generateAccessToken({ userId: 'admin_1', phone: '+91 99999 99999', role: 'admin' });
    logisticsToken = generateAccessToken({ userId: 'logistics_1', phone: '+91 98224 55198', role: 'logistics' });
  });

  beforeEach(() => {
    Object.assign(store, createStore());
  });

  // ── Unit tests: validateReportInput ──────────────────────────────────────

  describe('Report Service — validation', () => {
    const validInput = {
      category: 'Underpricing & Cartel' as const,
      description: 'Local mandi cartel colluded to offer ₹8/kg when market price was ₹18/kg.',
      isAnonymous: true,
      reportedEntityName: 'Local Arhat / Mandi Sub-broker',
    };

    it('should accept valid anonymous report input', () => {
      const result = validateReportInput(validInput);
      expect(result.valid).toBe(true);
    });

    it('should accept valid identified report input', () => {
      const result = validateReportInput({
        ...validInput,
        isAnonymous: false,
        reporterUserId: 'farmer_1',
        reporterName: 'Ramesh Patil',
      });
      expect(result.valid).toBe(true);
    });

    it('should reject missing category', () => {
      const result = validateReportInput({ ...validInput, category: undefined as any });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('category');
    });

    it('should reject invalid category', () => {
      const result = validateReportInput({ ...validInput, category: 'Invalid Category' as any });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('category');
    });

    it('should reject short description', () => {
      const result = validateReportInput({ ...validInput, description: 'Short' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Description');
    });

    it('should reject missing reportedEntityName', () => {
      const result = validateReportInput({ ...validInput, reportedEntityName: '' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('entity name');
    });

    it('should reject identified report without reporterUserId', () => {
      const result = validateReportInput({ ...validInput, isAnonymous: false, reporterUserId: undefined });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('reporterUserId');
    });

    it('should reject identified report without reporterName', () => {
      const result = validateReportInput({ ...validInput, isAnonymous: false, reporterUserId: 'farmer_1', reporterName: undefined });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('reporterName');
    });

    it('should accept all valid categories', () => {
      const categories = [
        'Underpricing & Cartel',
        'Harassment',
        'Broker Exploitation',
        'Payment Default',
        'Transport Dispute'
      ];
      for (const cat of categories) {
        const result = validateReportInput({ ...validInput, category: cat as any });
        expect(result.valid).toBe(true);
      }
    });
  });

  // ── Unit tests: createReport service ────────────────────────────────────

  describe('Report Service — createReport', () => {
    it('should create anonymous report without reporterUserId', () => {
      const { report } = createReport({
        category: 'Underpricing & Cartel',
        description: 'Mandi cartel offering below market prices.',
        isAnonymous: true,
        reportedEntityName: 'Local Arhat',
      });
      expect(report.isAnonymous).toBe(true);
      expect(report.reporterUserId).toBeUndefined();
      expect(report.reporterName).toBeUndefined();
      expect(report.id).toMatch(/^REP-\d+-\d+$/);
      expect(report.status).toBe('open');
      expect(report.createdAt).toBeDefined();
    });

    it('should create identified report with reporterUserId', () => {
      const { report } = createReport({
        category: 'Harassment',
        description: 'Verbal harassment at mandi yard.',
        isAnonymous: false,
        reportedEntityName: 'Mandi Official',
        reporterUserId: 'farmer_1',
        reporterName: 'Ramesh Patil',
      });
      expect(report.isAnonymous).toBe(false);
      expect(report.reporterUserId).toBe('farmer_1');
      expect(report.reporterName).toBe('Ramesh Patil');
    });

    it('should persist report to store', () => {
      const initialCount = store.reports.length;
      createReport({
        category: 'Payment Default',
        description: 'Buyer defaulted on payment after delivery.',
        isAnonymous: true,
        reportedEntityName: 'Buyer X',
      });
      expect(store.reports.length).toBe(initialCount + 1);
    });

    it('should include optional relatedOrderId', () => {
      const { report } = createReport({
        category: 'Transport Dispute',
        description: 'Transporter refused pickup.',
        isAnonymous: true,
        reportedEntityName: 'Transporter Y',
        relatedOrderId: 'ORD-1092',
      });
      expect(report.relatedOrderId).toBe('ORD-1092');
    });

    it('should throw on invalid input', () => {
      expect(() => createReport({
        category: 'Invalid Category' as any,
        description: 'Short',
        isAnonymous: true,
        reportedEntityName: 'X',
      })).toThrow();
    });
  });

  // ── Unit tests: getAllReports ──────────────────────────────────────────

  describe('Report Service — getAllReports', () => {
    it('should return all reports sorted by createdAt descending', () => {
      const reports = getAllReports();
      expect(Array.isArray(reports)).toBe(true);
      expect(reports.length).toBeGreaterThanOrEqual(2);
      for (let i = 1; i < reports.length; i++) {
        expect(new Date(reports[i-1].createdAt).getTime()).toBeGreaterThanOrEqual(
          new Date(reports[i].createdAt).getTime()
        );
      }
    });

    it('should return seeded reports', () => {
      const reports = getAllReports();
      const anon = reports.find(r => r.id === 'REP-701');
      const identified = reports.find(r => r.id === 'REP-702');
      expect(anon).toBeDefined();
      expect(anon?.isAnonymous).toBe(true);
      expect(identified).toBeDefined();
      expect(identified?.isAnonymous).toBe(false);
      expect(identified?.reporterUserId).toBe('farmer_2');
    });
  });

  // ── Unit tests: updateReportStatus ─────────────────────────────────────

  describe('Report Service — updateReportStatus', () => {
    it('should update status and resolutionNotes', () => {
      const reports = getAllReports();
      const target = reports[0];
      const updated = updateReportStatus(target.id, 'reviewing', 'Under investigation');
      expect(updated).not.toBeNull();
      expect(updated?.status).toBe('reviewing');
      expect(updated?.resolutionNotes).toBe('Under investigation');
    });

    it('should return null for non-existent report', () => {
      const updated = updateReportStatus('REP-NONEXISTENT', 'resolved', 'Done');
      expect(updated).toBeNull();
    });

    it('should accept all valid statuses', () => {
      const reports = getAllReports();
      const target = reports[0];
      for (const status of ['open', 'reviewing', 'resolved'] as const) {
        const updated = updateReportStatus(target.id, status);
        expect(updated?.status).toBe(status);
      }
    });
  });

  // ── API tests: POST /api/reports ───────────────────────────────────────

  describe('POST /api/reports', () => {
    const validReport = {
      category: 'Underpricing & Cartel',
      description: 'Local mandi cartel colluded to offer ₹8/kg when digital Mandi average was ₹18/kg. Threatened to block unloading at yard.',
      isAnonymous: true,
      reportedEntityName: 'Local Arhat / Mandi Sub-broker (Pimpalgaon)',
    };

    it('should return 401 without token', async () => {
      const res = await request(app).post('/api/reports').send(validReport);
      expect(res.status).toBe(401);
    });

    it('should return 403 for non-farmer role (buyer)', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(validReport);
      expect(res.status).toBe(403);
    });

    it('should return 403 for non-farmer role (logistics)', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${logisticsToken}`)
        .send(validReport);
      expect(res.status).toBe(403);
    });

    it('should reject invalid category', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({ ...validReport, category: 'Invalid Category' as any });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('category');
    });

    it('should reject short description', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({ ...validReport, description: 'Short' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Description');
    });

    it('should reject missing reportedEntityName', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({ ...validReport, reportedEntityName: '' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('entity name');
    });

    it('should create anonymous report successfully', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send(validReport);
      expect(res.status).toBe(201);
      expect(res.body.report).toBeDefined();
      expect(res.body.report.isAnonymous).toBe(true);
      expect(res.body.report.reporterUserId).toBeUndefined();
      expect(res.body.report.reporterName).toBe('Anonymous Farmer');
      expect(res.body.report.category).toBe(validReport.category);
      expect(res.body.report.description).toBe(validReport.description);
      expect(res.body.report.reportedEntityName).toBe(validReport.reportedEntityName);
      expect(res.body.report.status).toBe('open');
      expect(res.body.report.id).toMatch(/^REP-\d+-\d+$/);
    });

    it('should create identified report successfully', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({ ...validReport, isAnonymous: false });
      expect(res.status).toBe(201);
      expect(res.body.report.isAnonymous).toBe(false);
      expect(res.body.report.reporterUserId).toBe('farmer_1');
      expect(res.body.report.reporterName).toBe('Ramesh Patil');
    });

    it('should include relatedOrderId when provided', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({ ...validReport, relatedOrderId: 'ORD-1092' });
      expect(res.status).toBe(201);
      expect(res.body.report.relatedOrderId).toBe('ORD-1092');
    });

    it('should persist report and be retrievable by admin', async () => {
      await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send(validReport);

      const adminRes = await request(app)
        .get('/api/reports/admin')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.status).toBe(200);
      expect(adminRes.body.reports.length).toBeGreaterThanOrEqual(3); // 2 seeded + 1 new
      const newReport = adminRes.body.reports.find((r: any) => r.description === validReport.description);
      expect(newReport).toBeDefined();
      expect(newReport.isAnonymous).toBe(true);
    });
  });

  // ── API tests: GET /api/reports/admin ──────────────────────────────────

  describe('GET /api/reports/admin', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/reports/admin');
      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin role (farmer)', async () => {
      const res = await request(app)
        .get('/api/reports/admin')
        .set('Authorization', `Bearer ${farmer1Token}`);
      expect(res.status).toBe(403);
    });

    it('should return 403 for non-admin role (buyer)', async () => {
      const res = await request(app)
        .get('/api/reports/admin')
        .set('Authorization', `Bearer ${buyerToken}`);
      expect(res.status).toBe(403);
    });

    it('should return all reports for admin', async () => {
      const res = await request(app)
        .get('/api/reports/admin')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.reports).toBeInstanceOf(Array);
      expect(res.body.total).toBe(res.body.reports.length);
      expect(res.body.reports.length).toBeGreaterThanOrEqual(2);
    });

    it('should include all report fields for admin view', async () => {
      const res = await request(app)
        .get('/api/reports/admin')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      for (const r of res.body.reports) {
        expect(r).toHaveProperty('id');
        expect(r).toHaveProperty('category');
        expect(r).toHaveProperty('description');
        expect(r).toHaveProperty('isAnonymous');
        expect(r).toHaveProperty('reportedEntityName');
        expect(r).toHaveProperty('status');
        expect(r).toHaveProperty('createdAt');
      }
    });

    it('should show reporterUserId for identified reports in admin view', async () => {
      const res = await request(app)
        .get('/api/reports/admin')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      const identified = res.body.reports.find((r: any) => !r.isAnonymous);
      expect(identified).toBeDefined();
      expect(identified.reporterUserId).toBeDefined();
    });
  });

  // ── API tests: PATCH /api/reports/admin/:id ────────────────────────────

  describe('PATCH /api/reports/admin/:id', () => {
    it('should return 401 without token', async () => {
      const res = await request(app).patch('/api/reports/admin/REP-701').send({ status: 'reviewing' });
      expect(res.status).toBe(401);
    });

    it('should return 403 for non-admin role', async () => {
      const res = await request(app)
        .patch('/api/reports/admin/REP-701')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({ status: 'reviewing' });
      expect(res.status).toBe(403);
    });

    it('should reject invalid status', async () => {
      const res = await request(app)
        .patch('/api/reports/admin/REP-701')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid status');
    });

    it('should update status to reviewing', async () => {
      const res = await request(app)
        .patch('/api/reports/admin/REP-701')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'reviewing', resolutionNotes: 'Assigned to investigator' });
      expect(res.status).toBe(200);
      expect(res.body.report.status).toBe('reviewing');
      expect(res.body.report.resolutionNotes).toBe('Assigned to investigator');
    });

    it('should update status to resolved', async () => {
      const res = await request(app)
        .patch('/api/reports/admin/REP-701')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'resolved', resolutionNotes: 'Case closed, broker fined' });
      expect(res.status).toBe(200);
      expect(res.body.report.status).toBe('resolved');
    });

    it('should return 404 for non-existent report', async () => {
      const res = await request(app)
        .patch('/api/reports/admin/REP-NONEXISTENT')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'resolved' });
      expect(res.status).toBe(404);
    });

    it('should persist status change', async () => {
      await request(app)
        .patch('/api/reports/admin/REP-701')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'resolved' });

      const res = await request(app)
        .get('/api/reports/admin')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      const updated = res.body.reports.find((r: any) => r.id === 'REP-701');
      expect(updated.status).toBe('resolved');
    });
  });

  // ── Privacy & Authorization tests ──────────────────────────────────────

  describe('Privacy & Authorization', () => {
    it('should NOT expose reporterUserId in farmer response for anonymous report', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({
          category: 'Harassment',
          description: 'Verbal harassment at mandi yard by official.',
          isAnonymous: true,
          reportedEntityName: 'Mandi Official',
        });
      expect(res.status).toBe(201);
      expect(res.body.report.reporterUserId).toBeUndefined();
      expect(res.body.report.reporterName).toBe('Anonymous Farmer');
    });

    it('should NOT expose reporter identity for anonymous reports in admin queue (POST -> GET)', async () => {
      // Farmer submits an anonymous report through the real API
      const created = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({
          category: 'Harassment',
          description: 'Anonymous identity must not leak to admin queue.',
          isAnonymous: true,
          reportedEntityName: 'Mandi Official',
        });
      expect(created.status).toBe(201);

      // Admin fetches the queue through the real API
      const adminRes = await request(app)
        .get('/api/reports/admin')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.status).toBe(200);
      const anon = adminRes.body.reports.find(
        (r: any) => r.description === 'Anonymous identity must not leak to admin queue.'
      );
      expect(anon).toBeDefined();
      expect(anon.isAnonymous).toBe(true);
      expect(anon.reporterUserId).toBeUndefined();
      expect(anon.reporterName).toBeUndefined();
    });

    it('should expose reporter identity for identified reports in admin queue (POST -> GET)', async () => {
      const created = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({
          category: 'Payment Default',
          description: 'Identified report admin can see reporter identity.',
          isAnonymous: false,
          reportedEntityName: 'Defaulting Trader',
        });
      expect(created.status).toBe(201);
      expect(created.body.report.reporterUserId).toBe('farmer_1');
      expect(created.body.report.reporterName).toBe('Ramesh Patil');

      const adminRes = await request(app)
        .get('/api/reports/admin')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(adminRes.status).toBe(200);
      const identified = adminRes.body.reports.find(
        (r: any) => r.description === 'Identified report admin can see reporter identity.'
      );
      expect(identified).toBeDefined();
      expect(identified.isAnonymous).toBe(false);
      expect(identified.reporterUserId).toBe('farmer_1');
      expect(identified.reporterName).toBe('Ramesh Patil');
    });

    it('should NOT allow farmer to view other farmers reports', async () => {
      // Farmer 2 creates a report
      await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${farmer2Token}`)
        .send({
          category: 'Payment Default',
          description: 'Buyer defaulted on payment.',
          isAnonymous: false,
          reportedEntityName: 'Buyer X',
        });

      // Farmer 1 tries to access admin endpoint
      const res = await request(app)
        .get('/api/reports/admin')
        .set('Authorization', `Bearer ${farmer1Token}`);
      expect(res.status).toBe(403);
    });

    it('should NOT allow buyer to submit report', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          category: 'Underpricing & Cartel',
          description: 'Mandi cartel offering low prices.',
          isAnonymous: true,
          reportedEntityName: 'Arhat',
        });
      expect(res.status).toBe(403);
    });

    it('should NOT allow logistics to submit report', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${logisticsToken}`)
        .send({
          category: 'Transport Dispute',
          description: 'Transporter overcharged.',
          isAnonymous: true,
          reportedEntityName: 'Transporter Y',
        });
      expect(res.status).toBe(403);
    });

    it('should allow anonymous report without any identifying info in store', async () => {
      await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({
          category: 'Harassment',
          description: 'Harassment at mandi.',
          isAnonymous: true,
          reportedEntityName: 'Mandi Agent',
        });

      const reports = getAllReports();
      const newReport = reports.find(r => r.description === 'Harassment at mandi.');
      expect(newReport).toBeDefined();
      expect(newReport?.reporterUserId).toBeUndefined();
      expect(newReport?.reporterName).toBeUndefined();
      expect(newReport?.isAnonymous).toBe(true);
    });
  });

  // ── Order/Listings linkage tests ──────────────────────────────────────

  describe('Order/Listings linkage', () => {
    it('should accept relatedOrderId and persist it', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({
          category: 'Transport Dispute',
          description: 'Transporter refused pickup for order ORD-1092.',
          isAnonymous: true,
          reportedEntityName: 'Transporter Z',
          relatedOrderId: 'ORD-1092',
        });
      expect(res.status).toBe(201);
      expect(res.body.report.relatedOrderId).toBe('ORD-1092');
    });

    it('should accept relatedOrderId that exists in orders', async () => {
      const order = SEED_ORDERS[0];
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({
          category: 'Payment Default',
          description: 'Payment not received for order.',
          isAnonymous: false,
          reportedEntityName: order.buyerName,
          relatedOrderId: order.id,
        });
      expect(res.status).toBe(201);
      expect(res.body.report.relatedOrderId).toBe(order.id);
    });

    it('should accept relatedOrderId even if order does not exist (no validation)', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({
          category: 'Broker Exploitation',
          description: 'Broker issue.',
          isAnonymous: true,
          reportedEntityName: 'Broker',
          relatedOrderId: 'ORD-NONEXISTENT',
        });
      expect(res.status).toBe(201);
      expect(res.body.report.relatedOrderId).toBe('ORD-NONEXISTENT');
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────

  describe('Edge cases', () => {
    it('should handle empty description gracefully', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({
          category: 'Underpricing & Cartel',
          description: '',
          isAnonymous: true,
          reportedEntityName: 'Arhat',
        });
      expect(res.status).toBe(400);
    });

    it('should handle whitespace-only description', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({
          category: 'Underpricing & Cartel',
          description: '   ',
          isAnonymous: true,
          reportedEntityName: 'Arhat',
        });
      expect(res.status).toBe(400);
    });

    it('should trim whitespace from reportedEntityName', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({
          category: 'Harassment',
          description: 'Harassment incident.',
          isAnonymous: true,
          reportedEntityName: '  Mandi Agent  ',
        });
      expect(res.status).toBe(201);
      expect(res.body.report.reportedEntityName).toBe('Mandi Agent');
    });

    it('should generate unique IDs for each report', async () => {
      const res1 = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({
          category: 'Harassment',
          description: 'First report.',
          isAnonymous: true,
          reportedEntityName: 'Agent 1',
        });
      const res2 = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${farmer1Token}`)
        .send({
          category: 'Harassment',
          description: 'Second report.',
          isAnonymous: true,
          reportedEntityName: 'Agent 2',
        });
      expect(res1.body.report.id).not.toBe(res2.body.report.id);
    });

    it('should return reports in descending createdAt order', async () => {
      const res = await request(app)
        .get('/api/reports/admin')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      for (let i = 1; i < res.body.reports.length; i++) {
        expect(new Date(res.body.reports[i-1].createdAt).getTime())
          .toBeGreaterThanOrEqual(new Date(res.body.reports[i].createdAt).getTime());
      }
    });
  });
});