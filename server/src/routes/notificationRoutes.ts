import { Router } from 'express';
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationReadController,
  createNotificationAdmin,
} from '../controllers/notificationController.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireRole('collector', 'recycler', 'admin'), getNotifications);
router.get('/unread-count', requireRole('collector', 'recycler', 'admin'), getUnreadNotificationCount);
router.patch('/:id/read', requireRole('collector', 'recycler', 'admin'), markNotificationReadController);
router.post('/admin', requireRole('admin'), createNotificationAdmin);

export default router;
