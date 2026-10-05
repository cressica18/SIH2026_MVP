import { Router, RequestHandler } from 'express';
import { getRiskProfile, getAdvances, requestAdvance, simulateAepsCashout } from '../controllers/financeController.js';
import { requireAnyRole } from '../middleware/auth.js';

const router = Router();

router.get('/risk/:farmerId', requireAnyRole('collector', 'admin') as unknown as RequestHandler, getRiskProfile);
router.get('/advances', requireAnyRole('collector', 'admin') as unknown as RequestHandler, getAdvances);
router.post('/advances', requireAnyRole('collector') as unknown as RequestHandler, requestAdvance);
router.post('/aeps/simulate-cashout', requireAnyRole('collector') as unknown as RequestHandler, simulateAepsCashout);

export default router;
