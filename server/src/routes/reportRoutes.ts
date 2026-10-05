import { Router, RequestHandler } from 'express';
import { createSafetyReport, getAdminReports, updateReportStatusAdmin } from '../controllers/reportController.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/', requireRole('collector'), createSafetyReport as unknown as RequestHandler);
router.get('/admin', requireRole('admin'), getAdminReports as unknown as RequestHandler);
router.patch('/admin/:id', requireRole('admin'), updateReportStatusAdmin as unknown as RequestHandler);

export default router;
