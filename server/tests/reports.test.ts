import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { generateAccessToken } from '../src/core/security.js';
import { Server } from 'http';

describe('Reports & Whistleblower Safety Tests', () => {
  let server: Server;

  beforeAll(() => {
    return new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        resolve();
      });
    });
  });

  afterAll(() => {
    return new Promise<void>((resolve) => {
      server.close(() => {
        resolve();
      });
    });
  });

  it('should allow collector to submit a safety report', async () => {
    const token = generateAccessToken({ userId: 'collector_1', phone: '+91 97654 33210', role: 'collector' });
    const res = await request(server)
      .post('/api/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({
        category: 'Underpricing & Cartel',
        description: 'Middleman cartel colluded to offer low price.',
        isAnonymous: true,
        reportedEntityName: 'Local Scrap Yard',
      });

    expect(res.status).toBe(201);
    expect(res.body.report).toHaveProperty('id');
    expect(res.body.report.isAnonymous).toBe(true);
  });

  it('should allow admin to view all reports and update status', async () => {
    const adminToken = generateAccessToken({ userId: 'admin_1', phone: '+91 99999 99999', role: 'admin' });
    const res = await request(server)
      .get('/api/reports/admin')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('reports');

    if (res.body.reports.length > 0) {
      const reportId = res.body.reports[0].id;
      const updateRes = await request(server)
        .patch(`/api/reports/admin/${reportId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'resolved', resolutionNotes: 'Investigated and resolved.' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.report.status).toBe('resolved');
    }
  });
});
