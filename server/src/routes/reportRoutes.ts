import { Router } from 'express';
import { createSafetyReport, getAdminReports, updateReportStatusAdmin } from '../controllers/reportController.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

// POST /api/reports — farmer submits a safety report (anonymous or identified)
router.post('/', requireRole('farmer'), createSafetyReport);

// GET /api/admin/reports — admin moderation queue
router.get('/admin', requireRole('admin'), getAdminReports);

// PATCH /api/admin/reports/:id — admin updates report status
router.patch('/admin/:id', requireRole('admin'), updateReportStatusAdmin);

export default router;