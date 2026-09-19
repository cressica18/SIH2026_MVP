import { Router } from 'express';
import { 
  getNotifications, 
  getUnreadNotificationCount, 
  markNotificationReadController, 
  createNotificationAdmin 
} from '../controllers/notificationController.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/notifications — Get notifications for current user (auth required)
router.get('/', requireRole('farmer', 'buyer', 'logistics', 'admin'), getNotifications);

// GET /api/notifications/unread-count — Get unread count for current user
router.get('/unread-count', requireRole('farmer', 'buyer', 'logistics', 'admin'), getUnreadNotificationCount);

// PATCH /api/notifications/:id/read — Mark notification as read (auth required)
router.patch('/:id/read', requireRole('farmer', 'buyer', 'logistics', 'admin'), markNotificationReadController);

// POST /api/notifications/admin — Admin create notification
router.post('/admin', requireRole('admin'), createNotificationAdmin);

export default router;