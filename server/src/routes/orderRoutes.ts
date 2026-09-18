import { Router } from 'express';
import { getOrders, getOrder, createOrder, updateOrder } from '../controllers/orderController.js';

const router = Router();

// GET /api/orders — Get all orders
// GET /api/orders/:id — Get single order
// POST /api/orders — Create new order
// PATCH /api/orders/:id — Update order
router.route('/')
  .get(getOrders)
  .post(createOrder);
router.route('/:id')
  .get(getOrder)
  .patch(updateOrder);

export default router;
