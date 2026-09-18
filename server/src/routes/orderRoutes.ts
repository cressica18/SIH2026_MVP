import { Router, RequestHandler } from 'express';
import { getOrders, getOrder, createOrder, updateOrderStatus } from '../controllers/orderController.js';
import { requireAnyRole } from '../middleware/auth.js';

const router = Router();

// GET /api/orders — Role-scoped: buyer sees own, logistics sees confirmed pool candidates, admin sees all
// POST /api/orders — Buyer creates order (requires auth)
// GET /api/orders/:id — Single order
// PATCH /api/orders/:id — Update order (buyer/logistics/admin)

router.route('/')
  .get(requireAnyRole('buyer', 'farmer', 'logistics', 'admin') as unknown as RequestHandler, getOrders as unknown as RequestHandler)
  .post(requireAnyRole('buyer', 'admin') as unknown as RequestHandler, createOrder as unknown as RequestHandler);

router.route('/:id')
  .get(getOrder);

router.route('/:id/status')
  .patch(requireAnyRole('farmer', 'buyer', 'logistics', 'admin') as unknown as RequestHandler, updateOrderStatus as unknown as RequestHandler);

export default router;
