import { Router, RequestHandler } from 'express';
import { getSchemes, getMatchedSchemesForFarmer } from '../controllers/schemeController.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', getSchemes as unknown as RequestHandler);
router.get(
  '/match/:farmerId',
  requireRole('collector', 'admin') as unknown as RequestHandler,
  getMatchedSchemesForFarmer as unknown as RequestHandler
);

export default router;
