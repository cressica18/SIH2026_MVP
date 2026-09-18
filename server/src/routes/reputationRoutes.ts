import { Router } from 'express';
import { requireRole } from '../middleware/auth.js';
import { getReputation, postReputationEvent } from '../controllers/reputationController.js';

const router = Router();

// GET /api/reputation/:userId — Public (any authenticated user)
router.get('/:userId', requireRole('farmer', 'buyer', 'logistics', 'admin'), getReputation);

// POST /api/reputation/events — Buyer rates farmer post-settlement (or farmer rates buyer)
router.post('/events', requireRole('buyer', 'farmer', 'admin'), postReputationEvent);

export default router;
