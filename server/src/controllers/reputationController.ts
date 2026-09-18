import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { store } from '../data/store.js';
import { computeScore, emitReputationEvent } from '../services/reputationService.js';
import { SEED_FARMERS } from '../data/seedData.js';

/** Resolve an anonSellerId (FARM-XXXXX) to a real userId, or return the input unchanged */
function resolveUserId(idOrAnon: string): string {
  // If it looks like an anonSellerId, resolve to real farmer id
  if (idOrAnon.startsWith('FARM-')) {
    const farmer = SEED_FARMERS.find((f) => f.anonSellerId === idOrAnon);
    if (farmer) return farmer.id;
  }
  return idOrAnon;
}

/**
 * GET /api/reputation/:userId
 * Returns computed reputation score + supporting stats.
 * Public — any authenticated user can view any reputation (needed for
 * buyer marketplace: show farmer reputation badge on listing cards).
 */
export function getReputation(req: AuthRequest, res: Response): void {
  const rawId = req.params.userId;
  const userId = resolveUserId(rawId);

  const result = computeScore(userId);
  res.json({
    userId,
    ...result,
    /** Human-readable tier label */
    tier:
      result.score >= 4.5
        ? 'Excellent'
        : result.score >= 4.0
        ? 'Good'
        : result.score >= 3.0
        ? 'Average'
        : 'Poor',
  });
}

/**
 * POST /api/reputation/events
 * Buyer rates farmer post-settlement (and vice versa).
 * Body: { orderId, targetUserId, eventType, scoreImpact, notes? }
 * Auth: buyer can emit buyer_rating; farmer can emit farmer_rating.
 */
export function postReputationEvent(req: AuthRequest, res: Response): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { orderId, targetUserId: rawTargetId, eventType, scoreImpact, notes } = req.body as {
    orderId?: string;
    targetUserId: string;
    eventType: string;
    scoreImpact?: number;
    notes?: string;
  };

  if (!rawTargetId || !eventType) {
    res.status(400).json({ error: 'targetUserId and eventType are required' });
    return;
  }

  const targetUserId = resolveUserId(rawTargetId);

  // Validate eventType against role
  const allowedByRole: Record<string, string[]> = {
    buyer: ['buyer_rating'],
    farmer: ['farmer_rating'],
    admin: ['buyer_rating', 'farmer_rating', 'fulfillment_success', 'dispute_raised'],
  };
  const allowed = allowedByRole[user.role] ?? [];
  if (!allowed.includes(eventType)) {
    res.status(403).json({ error: `Role '${user.role}' cannot emit event type '${eventType}'` });
    return;
  }

  // For ratings, validate scoreImpact is 1–5
  if ((eventType === 'buyer_rating' || eventType === 'farmer_rating')) {
    if (typeof scoreImpact !== 'number' || scoreImpact < 1 || scoreImpact > 5) {
      res.status(400).json({ error: 'scoreImpact must be a number between 1 and 5 for rating events' });
      return;
    }
  }

  // If an orderId is provided, validate the order exists and is settled
  if (orderId) {
    const order = store.orders.find((o) => o.id === orderId);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    if (order.status !== 'settled') {
      res.status(400).json({ error: 'Ratings can only be submitted after an order is settled' });
      return;
    }
    // Prevent duplicate ratings on the same order from the same source
    const existing = store.reputationEvents.find(
      (e) => e.orderId === orderId && e.sourceUserId === user.userId && e.eventType === eventType
    );
    if (existing) {
      res.status(409).json({ error: 'You have already submitted a rating for this order' });
      return;
    }
  }

  const event = emitReputationEvent({
    targetUserId,
    sourceUserId: user.userId,
    orderId,
    eventType: eventType as any,
    scoreImpact,
    notes,
  });

  // Return event + updated score
  const updatedScore = computeScore(targetUserId);
  res.status(201).json({ event, updatedScore });
}
