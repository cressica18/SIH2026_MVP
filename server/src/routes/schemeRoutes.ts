import { Router, RequestHandler } from 'express';
import { getSchemes } from '../controllers/schemeController.js';

const router = Router();

// GET /api/schemes
router.get('/', getSchemes as unknown as RequestHandler);

export default router;
