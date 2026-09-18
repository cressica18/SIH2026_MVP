import { Router, RequestHandler } from 'express';
import { 
  getPools, 
  getPool, 
  updatePoolStatus, 
  createPool, 
  updatePoolStop,
  autoCreatePools,
  getPoolRoute,
  joinPool
} from '../controllers/logisticsController.js';
import { requireAnyRole } from '../middleware/auth.js';

const router = Router();

// GET /api/logistics/pools — View all pools (public for demo)
// POST /api/logistics/pools — Create pool manually (logistics/admin)
// POST /api/logistics/pools/auto — Auto-create pools via geo-clustering (logistics/admin)
// GET /api/logistics/pools/:id — Single pool
// PATCH /api/logistics/pools/:id — Update pool status (logistics/admin)
// GET /api/logistics/pools/:id/route — Get optimized route for pool (logistics/admin)
// POST /api/logistics/pools/:id/join — Logistics provider joins/claims pool
// PATCH /api/logistics/pools/:id/stops/:stopId — Update stop completion (logistics/admin)

router.route('/pools')
  .get(getPools)
  .post(requireAnyRole('logistics', 'admin') as unknown as RequestHandler, createPool);

router.post('/pools/auto', 
  requireAnyRole('logistics', 'admin') as unknown as RequestHandler, 
  autoCreatePools
);

router.route('/pools/:id')
  .get(getPool)
  .patch(requireAnyRole('logistics', 'admin') as unknown as RequestHandler, updatePoolStatus);

router.get('/pools/:id/route', 
  requireAnyRole('logistics', 'admin') as unknown as RequestHandler, 
  getPoolRoute
);

router.post('/pools/:id/join', 
  requireAnyRole('logistics', 'admin') as unknown as RequestHandler, 
  joinPool
);

router.route('/pools/:id/stops/:stopId')
  .patch(requireAnyRole('logistics', 'admin') as unknown as RequestHandler, updatePoolStop);

export default router;
