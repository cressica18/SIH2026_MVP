import { store } from '../data/store.js';
import { AppNotification, Order, SafetyReport, FarmerProfile, BuyerProfile, Listing } from '@shared/types.ts';
import { SEED_FARMERS } from '../data/seedData.js';

export interface NotificationCreateInput {
  title: string;
  message: string;
  roleTarget: 'farmer' | 'buyer' | 'logistics' | 'admin' | 'all';
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
  const userRole = role as 'farmer' | 'buyer' | 'logistics' | 'admin';
  
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

// ─── Cross-role event notification helpers ──────────────────────────────────

export function notifyOrderCreated(order: Order, buyer: BuyerProfile): void {
  // Notify the farmer
  const farmer = SEED_FARMERS.find(f => f.anonSellerId === order.anonSellerId);
  if (farmer) {
    createNotification({
      title: 'New Order Received',
      message: `Buyer ${buyer.businessName || buyer.name} placed an order for ${order.quantityKg} kg of ${order.crop} at ₹${order.agreedPricePerKg}/kg.`,
      roleTarget: 'farmer',
      type: 'order',
      targetUserId: farmer.id,
      relatedOrderId: order.id,
    });
  }
  
  // Notify logistics providers
  createNotification({
    title: 'New Order Available for Pickup',
    message: `New ${order.crop} order (${order.quantityKg} kg) from ${order.sellerVillage}, ${order.sellerDistrict} needs pickup.`,
    roleTarget: 'logistics',
    type: 'logistics',
    relatedOrderId: order.id,
  });
}

export function notifyOrderStatusChanged(order: Order, newStatus: string, actorRole: string): void {
  const totalAmountStr = order.totalAmount ? `₹${order.totalAmount.toLocaleString('en-IN')}` : 'amount';
  const statusMessages: Record<string, { title: string; message: string }> = {
    confirmed: {
      title: 'Order Confirmed: Identity Revealed!',
      message: `Buyer ${order.buyerName} confirmed Order #${order.id}. Contact & pickup details unlocked.`,
    },
    in_transit: {
      title: 'Order In Transit',
      message: `Order #${order.id} picked up by logistics carrier. On the way to ${order.deliveryAddress}.`,
    },
    delivered: {
      title: 'Order Delivered',
      message: `Order #${order.id} has been delivered to ${order.deliveryAddress}.`,
    },
    settled: {
      title: 'Payment Settled',
      message: `Payment for Order #${order.id} (${totalAmountStr}) has been released.`,
    },
    disputed: {
      title: 'Order Disputed',
      message: `Order #${order.id} has been disputed. Please review.`,
    },
  };

  const statusInfo = statusMessages[newStatus];
  if (!statusInfo) return;

  const farmer = SEED_FARMERS.find(f => f.anonSellerId === order.anonSellerId);
  const isFarmerAction = actorRole === 'farmer';
  const isLogisticsAction = actorRole === 'logistics';
  const isBuyerAction = actorRole === 'buyer';

  // Notify farmer for relevant status changes
  if (farmer && (isBuyerAction || isLogisticsAction || newStatus === 'confirmed' || newStatus === 'disputed')) {
    createNotification({
      title: statusInfo.title,
      message: statusInfo.message,
      roleTarget: 'farmer',
      type: newStatus === 'confirmed' ? 'reveal' : newStatus === 'settled' ? 'finance' : 'order',
      targetUserId: farmer.id,
      relatedOrderId: order.id,
    });
  }

  // Notify buyer for relevant status changes
  if (isFarmerAction || isLogisticsAction) {
    createNotification({
      title: statusInfo.title,
      message: statusInfo.message,
      roleTarget: 'buyer',
      type: newStatus === 'confirmed' ? 'reveal' : newStatus === 'settled' ? 'finance' : 'order',
      targetUserId: order.buyerId,
      relatedOrderId: order.id,
    });
  }

  // Notify logistics for relevant status changes
  if (newStatus === 'confirmed' || newStatus === 'in_transit') {
    createNotification({
      title: statusInfo.title,
      message: statusInfo.message,
      roleTarget: 'logistics',
      type: 'logistics',
      relatedOrderId: order.id,
    });
  }
}

export function notifyReportCreated(report: SafetyReport): void {
  // Notify admin
  createNotification({
    title: 'New Safety Report Filed',
    message: `Report filed regarding ${report.reportedEntityName} (${report.category}). ${report.isAnonymous ? 'Anonymous submission.' : `Submitted by ${report.reporterName}.`}`,
    roleTarget: 'admin',
    type: 'safety',
    relatedReportId: report.id,
  });
}

export function notifyReportStatusChanged(report: SafetyReport, newStatus: string, resolutionNotes?: string): void {
  // Notify admin
  createNotification({
    title: `Report ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
    message: `Report #${report.id} regarding ${report.reportedEntityName} has been marked as ${newStatus}. ${resolutionNotes ? 'Resolution: ' + resolutionNotes : ''}`,
    roleTarget: 'admin',
    type: 'safety',
    relatedReportId: report.id,
  });

  // If not anonymous, notify the reporting farmer
  if (!report.isAnonymous && report.reporterUserId) {
    createNotification({
      title: `Your Report ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
      message: `Your report regarding ${report.reportedEntityName} has been marked as ${newStatus}. ${resolutionNotes ? 'Resolution: ' + resolutionNotes : ''}`,
      roleTarget: 'farmer',
      type: 'safety',
      targetUserId: report.reporterUserId,
      relatedReportId: report.id,
    });
  }
}

export function notifySchemeMatch(farmerId: string, schemeTitles: string[]): void {
  if (schemeTitles.length === 0) return;
  createNotification({
    title: 'New Government Schemes Matched',
    message: `${schemeTitles.length} new scheme${schemeTitles.length > 1 ? 's' : ''} matched to your profile: ${schemeTitles.slice(0, 2).join(', ')}${schemeTitles.length > 2 ? '...' : ''}.`,
    roleTarget: 'farmer',
    type: 'scheme',
    targetUserId: farmerId,
  });
}

export function notifyNewMatch(farmerId: string, buyerName: string, crop: string, matchScore: number): void {
  createNotification({
    title: 'New AI-Recommended Match',
    message: `${buyerName} matched with ${matchScore}% compatibility for your ${crop} listing.`,
    roleTarget: 'farmer',
    type: 'match',
    targetUserId: farmerId,
  });
}

export function notifyAdvanceDisbursed(farmerId: string, amount: number, txnRef: string): void {
  createNotification({
    title: 'AEPS Cash-Out Disbursed',
    message: `₹${amount.toLocaleString('en-IN')} withdrawn via Bank Mitra (Ref: ${txnRef}).`,
    roleTarget: 'farmer',
    type: 'finance',
    targetUserId: farmerId,
  });
}