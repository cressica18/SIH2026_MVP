import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { store } from '../data/store.js';
import { 
  getNotificationsForUser, 
  markNotificationRead, 
  getUnreadCount,
  createNotification 
} from '../services/notificationService.js';

export function getNotifications(req: AuthRequest, res: Response): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const notifications = getNotificationsForUser(user.userId, user.role);
  res.json({ notifications, total: notifications.length });
}

export function getUnreadNotificationCount(req: AuthRequest, res: Response): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const count = getUnreadCount(user.userId, user.role);
  res.json({ unreadCount: count });
}

export function markNotificationReadController(req: AuthRequest, res: Response): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const { id } = req.params;
  const notif = store.notifications.find(n => n.id === id);
  if (!notif) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }

  // Authorization: users can only mark their own notifications as read
  // Admins can mark any notification as read
  if (user.role !== 'admin' && notif.targetUserId && notif.targetUserId !== user.userId) {
    res.status(403).json({ error: 'Not authorized to mark this notification' });
    return;
  }
  
  // Also check roleTarget
  if (user.role !== 'admin' && notif.roleTarget !== user.role) {
    res.status(403).json({ error: 'Not authorized to mark this notification' });
    return;
  }

  notif.read = true;
  res.json(notif);
}

// Admin endpoint to create notifications (for testing/manual triggers)
export function createNotificationAdmin(req: AuthRequest, res: Response): void {
  const user = req.user;
  if (!user || user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  const { title, message, roleTarget, type, targetUserId, relatedOrderId, relatedReportId } = req.body;
  
  if (!title || !message || !roleTarget || !type) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const notif = createNotification({
    title,
    message,
    roleTarget,
    type,
    targetUserId,
    relatedOrderId,
    relatedReportId,
  });

  res.status(201).json(notif);
}