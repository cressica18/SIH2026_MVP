import { Router } from 'express';
import { getNotifications, markNotificationRead, createNotification } from '../controllers/notificationController.js';

const router = Router();

// GET /api/notifications — Get all notifications
// POST /api/notifications — Create notification
// PATCH /api/notifications/:id/read — Mark as read
router.route('/')
  .get(getNotifications)
  .post(createNotification);
router.patch('/:id/read', markNotificationRead);

export default router;
