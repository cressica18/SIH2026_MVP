import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { store } from '../data/store.js';
import { computeScore, emitReputationEvent } from '../services/reputationService.js';
import { SEED_COLLECTORS } from '../data/seedData.js';

function resolveUserId(idOrAnon: string): string {
  if (idOrAnon.startsWith('KABAD-')) {
    const collector = SEED_COLLECTORS.find((c) => c.anonCollectorId === idOrAnon);
    if (collector) return collector.id;
  }
  return idOrAnon;
}

export function getReputation(req: AuthRequest, res: Response): void {
  const rawId = req.params.userId;
  const userId = resolveUserId(rawId);

  const result = computeScore(userId);
  res.json({
    userId,
    ...result,
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

  const allowedByRole: Record<string, string[]> = {
    collector: ['buyer_rating'],
    recycler: ['farmer_rating'],
    admin: ['buyer_rating', 'farmer_rating', 'fulfillment_success', 'dispute_raised'],
  };
  const allowed = allowedByRole[user.role] ?? [];
  if (!allowed.includes(eventType)) {
    res.status(403).json({ error: `Role '${user.role}' cannot emit event type '${eventType}'` });
    return;
  }

  if (eventType === 'buyer_rating' || eventType === 'farmer_rating') {
    if (typeof scoreImpact !== 'number' || scoreImpact < 1 || scoreImpact > 5) {
      res.status(400).json({ error: 'scoreImpact must be a number between 1 and 5 for rating events' });
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

  const updatedScore = computeScore(targetUserId);
  res.status(201).json({ event, updatedScore });
}
