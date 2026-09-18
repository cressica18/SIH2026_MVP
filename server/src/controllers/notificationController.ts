import { Request, Response } from 'express';
import { store } from '../data/store.js';
import { AppNotification } from '../types.js';

export function getNotifications(req: Request, res: Response): void {
  res.json({ notifications: store.notifications, total: store.notifications.length });
}

export function markNotificationRead(req: Request, res: Response): void {
  const { id } = req.params;
  const notif = store.notifications.find((n) => n.id === id);
  if (!notif) {
    res.status(404).json({ error: 'Notification not found' });
    return;
  }
  notif.read = true;
  res.json(notif);
}

export function createNotification(req: Request, res: Response): void {
  const newNotif: AppNotification = req.body;
  newNotif.id = `NOTIF-${Date.now()}`;
  newNotif.timestamp = new Date().toISOString();
  store.notifications.unshift(newNotif);
  res.status(201).json(newNotif);
}
