import { Router, RequestHandler } from 'express';
import { getSchemes, getMatchedSchemesForFarmer } from '../controllers/schemeController.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/schemes — all schemes (public, optional ?category= filter)
router.get('/', getSchemes as unknown as RequestHandler);

// GET /api/schemes/match/:farmerId — matched schemes for a farmer (auth required)
// Farmers can only view their own; admin can view any
router.get(
  '/match/:farmerId',
  requireRole('farmer', 'admin') as unknown as RequestHandler,
  getMatchedSchemesForFarmer as unknown as RequestHandler
);

export default router;
