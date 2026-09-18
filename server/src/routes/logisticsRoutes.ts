import { Router } from 'express';
import { getPools, getPool, updatePoolStatus, createPool } from '../controllers/logisticsController.js';

const router = Router();

// GET /api/logistics/pools — Get all pools
// GET /api/logistics/pools/:id — Get single pool
// PATCH /api/logistics/pools/:id — Update pool status (status in request body)
// POST /api/logistics/pools — Create new pool
router.route('/pools')
  .get(getPools)
  .post(createPool);
router.route('/pools/:id')
  .get(getPool)
  .patch(updatePoolStatus);

export default router;
