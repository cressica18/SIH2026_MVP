import { store } from '../data/store.js';
import { AppNotification, SafetyReport } from '../types.js';

export interface NotificationCreateInput {
  title: string;
  message: string;
  roleTarget: 'collector' | 'recycler' | 'admin' | 'all';
  type: 'order' | 'reveal' | 'logistics' | 'finance' | 'safety' | 'scheme' | 'match';
  targetUserId?: string;
  relatedOrderId?: string;
  relatedReportId?: string;
}

export function createNotification(input: NotificationCreateInput): AppNotification {
  const notif: AppNotification = {
    id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: input.title,
    message: input.message,
    timestamp: new Date().toISOString(),
    read: false,
    roleTarget: input.roleTarget,
    type: input.type,
    ...(input.targetUserId && { targetUserId: input.targetUserId }),
    ...(input.relatedOrderId && { relatedOrderId: input.relatedOrderId }),
    ...(input.relatedReportId && { relatedReportId: input.relatedReportId }),
  };

  store.notifications.unshift(notif);
  return notif;
}

export function getNotificationsForUser(userId: string, role: string): AppNotification[] {
  const userRole = role as 'collector' | 'recycler' | 'admin';

  return store.notifications.filter((n) => {
    if (n.roleTarget === 'all') return true;
    if (n.roleTarget === userRole) {
      if (n.targetUserId && n.targetUserId !== userId) return false;
      return true;
    }
    return false;
  }).sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function markNotificationRead(id: string): AppNotification | null {
  const notif = store.notifications.find(n => n.id === id);
  if (!notif) return null;
  notif.read = true;
  return notif;
}

export function getUnreadCount(userId: string, role: string): number {
  return getNotificationsForUser(userId, role).filter(n => !n.read).length;
}

export function notifyReportCreated(report: SafetyReport): void {
  createNotification({
    title: 'New Safety Report Filed',
    message: `Report filed regarding ${report.reportedEntityName} (${report.category}). ${report.isAnonymous ? 'Anonymous submission.' : `Submitted by ${report.reporterName}.`}`,
    roleTarget: 'admin',
    type: 'safety',
    relatedReportId: report.id,
  });
}

export function notifyReportStatusChanged(report: SafetyReport, newStatus: string, resolutionNotes?: string): void {
  createNotification({
    title: `Report ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
    message: `Report #${report.id} regarding ${report.reportedEntityName} has been marked as ${newStatus}. ${resolutionNotes ? 'Resolution: ' + resolutionNotes : ''}`,
    roleTarget: 'admin',
    type: 'safety',
    relatedReportId: report.id,
  });

  if (!report.isAnonymous && report.reporterUserId) {
    createNotification({
      title: `Your Report ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
      message: `Your report regarding ${report.reportedEntityName} has been marked as ${newStatus}. ${resolutionNotes ? 'Resolution: ' + resolutionNotes : ''}`,
      roleTarget: 'collector',
      type: 'safety',
      targetUserId: report.reporterUserId,
      relatedReportId: report.id,
    });
  }
}

export function notifyAdvanceDisbursed(collectorId: string, amount: number, txnRef: string): void {
  createNotification({
    title: 'AEPS Cash-Out Disbursed',
    message: `₹${amount.toLocaleString('en-IN')} withdrawn via Bank Mitra (Ref: ${txnRef}).`,
    roleTarget: 'collector',
    type: 'finance',
    targetUserId: collectorId,
  });
}
