import { Router, RequestHandler } from 'express';
import { getProfile, upsertProfile } from '../controllers/usersController.js';
import { requireAnyRole } from '../middleware/auth.js';

const router = Router();

// GET /api/users/profile — Get current user's profile
// PUT /api/users/profile — Create or update current user's profile

router.get('/profile', requireAnyRole('farmer', 'buyer', 'logistics', 'admin'), getProfile as unknown as RequestHandler);
router.put('/profile', requireAnyRole('farmer', 'buyer', 'logistics', 'admin'), upsertProfile as unknown as RequestHandler);

export default router;
