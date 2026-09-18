import { Router, RequestHandler } from 'express';
import { getRiskProfile, getAdvances, requestAdvance } from '../controllers/financeController.js';
import { requireAnyRole } from '../middleware/auth.js';

const router = Router();

// GET /api/finance/risk/:farmerId
router.get('/risk/:farmerId', requireAnyRole('farmer', 'admin') as unknown as RequestHandler, getRiskProfile);

// GET /api/finance/advances
router.get('/advances', requireAnyRole('farmer', 'admin') as unknown as RequestHandler, getAdvances);

// POST /api/finance/advances
router.post('/advances', requireAnyRole('farmer') as unknown as RequestHandler, requestAdvance);

export default router;
