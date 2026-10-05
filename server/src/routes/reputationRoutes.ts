import { Router } from 'express';
import { getReputation, postReputationEvent } from '../controllers/reputationController.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/:userId', requireRole('collector', 'recycler', 'admin'), getReputation);
router.post('/events', requireRole('collector', 'recycler', 'admin'), postReputationEvent);

export default router;
