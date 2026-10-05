import { Response } from 'express';
import { store } from '../data/store.js';
import { Order } from '../types.js';
import { AuthRequest } from '../middleware/auth.js';
import { getAnonIdentity } from './usersController.js';

function scrubOrder(order: Order, userRole?: string): Order {
  if (order.identityRevealed || userRole === 'admin') {
    return order;
  }
  const scrubbed = { ...order };
  delete scrubbed.sellerRealName;
  delete scrubbed.sellerPhone;
  delete scrubbed.sellerVillage;
  delete scrubbed.sellerDistrict;
  delete scrubbed.sellerState;
  return scrubbed;
}

export function getOrders(req: AuthRequest, res: Response): void {
  const user = req.user;
  if (!user) {
    res.json({ orders: [], total: 0 });
    return;
  }

  let filtered: Order[];
  if (user.role === 'admin') {
    filtered = store.orders;
  } else if (user.role === 'collector') {
    const collectorAnonId = getAnonIdentity(user.userId);
    filtered = store.orders.filter((o) => o.anonSellerId === collectorAnonId);
  } else {
    filtered = [];
  }

  res.json({ orders: filtered.map(o => scrubOrder(o, user.role)), total: filtered.length });
}

export function getOrder(req: AuthRequest, res: Response): void {
  const { id } = req.params;
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const order = store.orders.find((o) => o.id === id);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  if (user.role === 'admin') {
    // Admin can view
  } else if (user.role === 'collector') {
    const collectorAnonId = getAnonIdentity(user.userId);
    if (!collectorAnonId || order.anonSellerId !== collectorAnonId) {
      res.status(403).json({ error: 'Not authorized to view this order' });
      return;
    }
  } else {
    res.status(403).json({ error: 'Not authorized to view this order' });
    return;
  }

  res.json(scrubOrder(order, user.role));
}

export function createOrder(req: AuthRequest, res: Response): void {
  res.status(400).json({ error: 'Orders are handled via Smart Pool Offers in Kabadiwala Connect.' });
}

export function updateOrderStatus(req: AuthRequest, res: Response): void {
  const { id } = req.params;
  const { status } = req.body;
  const user = req.user;

  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const idx = store.orders.findIndex((o) => o.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  const order = store.orders[idx];

  const validStatuses = ['pending', 'confirmed', 'in_transit', 'delivered', 'settled', 'disputed', 'cancelled'];
  if (!status || typeof status !== 'string' || !validStatuses.includes(status)) {
    res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    return;
  }

  order.status = status as any;
  res.json(scrubOrder(order, user.role));
}
