import { Router, RequestHandler } from 'express';
import { getProfile, upsertProfile } from '../controllers/usersController.js';
import { requireAnyRole } from '../middleware/auth.js';

const router = Router();

router.get('/profile', requireAnyRole('collector', 'recycler', 'admin'), getProfile as unknown as RequestHandler);
router.put('/profile', requireAnyRole('collector', 'recycler', 'admin'), upsertProfile as unknown as RequestHandler);

export default router;
