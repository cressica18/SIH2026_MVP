import { Request, Response } from 'express';
import { store } from '../data/store.js';
import { Order } from '../types.js';
import { AuthRequest } from '../middleware/auth.js';
import { emitReputationEvent } from '../services/reputationService.js';
import { notifyOrderCreated, notifyOrderStatusChanged } from '../services/notificationService.js';
import { SEED_FARMERS } from '../data/seedData.js';
import { getAnonIdentity } from './usersController.js';

// GET /api/orders — Role-scoped order retrieval
// - buyer: orders where buyerId matches
// - farmer: orders where anonSellerId matches their identity
// - logistics: all confirmed/in-transit orders (for pool assignment)
// - admin: all orders

// Helper to scrub private seller info if identity is not yet revealed
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
    // Unauthenticated: return empty
    res.json({ orders: [], total: 0 });
    return;
  }

  let filtered: Order[];
  if (user.role === 'admin') {
    filtered = store.orders;
  } else if (user.role === 'buyer') {
    filtered = store.orders.filter((o) => o.buyerId === user.userId);
  } else if (user.role === 'logistics') {
    // Logistics sees confirmed, in_transit, delivered, settled orders for pool management
    filtered = store.orders.filter((o) =>
      o.status === 'confirmed' || o.status === 'in_transit' || o.status === 'delivered' || o.status === 'settled'
    );
  } else if (user.role === 'farmer') {
    const farmerAnonId = getAnonIdentity(user.userId);
    filtered = store.orders.filter((o) => o.anonSellerId === farmerAnonId);
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

  // Authorization check
  if (user.role === 'admin') {
    // Admin can view any order
  } else if (user.role === 'buyer') {
    if (order.buyerId !== user.userId) {
      res.status(403).json({ error: 'Not authorized to view this order' });
      return;
    }
  } else if (user.role === 'farmer') {
    const farmerAnonId = getAnonIdentity(user.userId);
    if (!farmerAnonId || order.anonSellerId !== farmerAnonId) {
      res.status(403).json({ error: 'Not authorized to view this order' });
      return;
    }
  } else if (user.role === 'logistics') {
    if (!['confirmed', 'in_transit', 'delivered', 'settled'].includes(order.status)) {
      res.status(403).json({ error: 'Not authorized to view this order' });
      return;
    }
  } else {
    res.status(403).json({ error: 'Not authorized to view this order' });
    return;
  }

  res.json(scrubOrder(order, user.role));
}

// POST /api/orders — Buyer places an order
export function createOrder(req: AuthRequest, res: Response): void {
  const user = req.user;
  const body = req.body as Partial<Order>;

  if (!body.listingId || !body.quantityKg) {
    res.status(400).json({ error: 'listingId and quantityKg are required' });
    return;
  }

  // Fetch the listing to validate it's active
  const listing = store.listings.find((l) => l.id === body.listingId);
  if (!listing) {
    res.status(404).json({ error: 'Listing not found' });
    return;
  }
  if (listing.status !== 'active') {
    res.status(400).json({ error: 'Listing is not available for ordering' });
    return;
  }
  if (body.quantityKg > listing.quantityKg) {
    res.status(400).json({ error: 'Ordered quantity exceeds available quantity' });
    return;
  }

  // Get buyer profile for notification
  const buyer = store.buyerProfiles.find((b) => b.id === user?.userId) || 
    { id: user?.userId || 'unknown', businessName: body.buyerName || 'Buyer', name: body.buyerName || 'Buyer' };

  const newOrder: Order = {
    ...(body as Order),
    id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
    // Buyer identity from token (if authenticated), fallback to body
    buyerId: user?.userId || body.buyerId || 'unknown',
    // Identity fields mapped from listing (kept hidden until confirmed)
    anonSellerId: listing.anonSellerId,
    sellerRealName: listing.farmerRealName,
    sellerPhone: listing.farmerPhone,
    sellerVillage: listing.village,
    sellerDistrict: listing.district,
    sellerState: listing.state,
    
    // Initial State Machine status
    status: 'pending',
    identityRevealed: false,
    createdAt: new Date().toISOString(),
  };

  store.orders.unshift(newOrder);

  // Deduct quantity from listing
  listing.quantityKg = Math.max(0, listing.quantityKg - newOrder.quantityKg);
  listing.status = listing.quantityKg <= 0 ? 'matched' : 'active';

  // Send notifications
  notifyOrderCreated(newOrder, buyer as any);

  res.status(201).json(scrubOrder(newOrder, user?.role));
}

// PATCH /api/orders/:id/status
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
  const isAdmin = user.role === 'admin';
  const previousStatus = order.status;

  // Role-gated state machine transitions with participant ownership checks
  if (order.status === 'pending' && status === 'confirmed') {
    const isOrderFarmer = user.role === 'farmer' && getAnonIdentity(user.userId) === order.anonSellerId;
    if (isOrderFarmer || isAdmin) {
      order.status = 'confirmed';
      order.identityRevealed = true;
      order.identityRevealedAt = new Date().toISOString();
      notifyOrderStatusChanged(order, 'confirmed', user.role);
      res.json(scrubOrder(order, user.role));
      return;
    }
  } else if (order.status === 'confirmed' && status === 'in_transit') {
    if (user.role === 'logistics' || isAdmin) {
      order.status = 'in_transit';
      notifyOrderStatusChanged(order, 'in_transit', user.role);
      res.json(scrubOrder(order, user.role));
      return;
    }
  } else if (order.status === 'in_transit' && status === 'delivered') {
    if (user.role === 'logistics' || isAdmin) {
      order.status = 'delivered';
      // Phase 12: Emit fulfillment_success event for the farmer
      if (order.anonSellerId) {
        const farmer = SEED_FARMERS.find((f) => f.anonSellerId === order.anonSellerId);
        if (farmer) {
          emitReputationEvent({
            targetUserId: farmer.id,
            sourceUserId: user.userId,
            orderId: order.id,
            eventType: 'fulfillment_success',
          });
        }
      }
      notifyOrderStatusChanged(order, 'delivered', user.role);
      res.json(scrubOrder(order, user.role));
      return;
    }
  } else if (order.status === 'delivered' && status === 'settled') {
    const isOrderBuyer = user.role === 'buyer' && order.buyerId === user.userId;
    if (isOrderBuyer || isAdmin) {
      order.status = 'settled';
      order.settledAt = new Date().toISOString();
      notifyOrderStatusChanged(order, 'settled', user.role);
      res.json(scrubOrder(order, user.role));
      return;
    }
  } else if (status === 'disputed') {
    const isOrderBuyer = user.role === 'buyer' && order.buyerId === user.userId;
    const isOrderFarmer = user.role === 'farmer' && getAnonIdentity(user.userId) === order.anonSellerId;
    if (isOrderBuyer || isOrderFarmer || isAdmin) {
      order.status = 'disputed';
      // Phase 12: Emit dispute_raised event — penalises the farmer's reputation
      if (order.anonSellerId) {
        const farmer = SEED_FARMERS.find((f) => f.anonSellerId === order.anonSellerId);
        if (farmer) {
          emitReputationEvent({
            targetUserId: farmer.id,
            sourceUserId: user.userId,
            orderId: order.id,
            eventType: 'dispute_raised',
          });
        }
      }
      notifyOrderStatusChanged(order, 'disputed', user.role);
      res.json(scrubOrder(order, user.role));
      return;
    }
  }

  res.status(400).json({ error: 'Invalid state transition or unauthorized role for this transition' });
}