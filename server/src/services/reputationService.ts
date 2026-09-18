/**
 * Reputation Service — Phase 12
 *
 * Computes a 1.0–5.0 star reputation score per the blueprint:
 *   compute_score(user_id) = weighted(avg_rating, fulfillment_rate, dispute_rate)
 *   with recency decay applied per event.
 *
 * Formula (transparent for demo/audit):
 *   base_score        = 4.0  (assumed good-faith starting point)
 *   fulfillment_bonus = +0.05 per successful delivery (capped at +0.5)
 *   rating_component  = avgRating (recency-weighted mean of buyer_rating events, 1–5 scale)
 *   dispute_penalty   = -0.3 per dispute event (recency-weighted)
 *
 *   final = clamp(
 *     0.5 * base_score + 0.4 * rating_component + 0.1 * (1 + fulfillment_bonus) - dispute_penalties,
 *     1.0, 5.0
 *   )
 *
 *   Recency weight: events within 30 days = 1.0, 30–90 days = 0.6, older = 0.3.
 */

import { store } from '../data/store.js';
import { ReputationEvent } from '../types.js';

export interface ReputationResult {
  /** 1.0–5.0 star score, compatible with FarmerProfile.reputationScore */
  score: number;
  totalFulfilled: number;
  disputeCount: number;
  averageRating: number | null;
  ratingCount: number;
  eventCount: number;
}

function recencyWeight(createdAt: string): number {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays <= 30) return 1.0;
  if (ageDays <= 90) return 0.6;
  return 0.3;
}

export function computeScore(userId: string): ReputationResult {
  const events = store.reputationEvents.filter((e) => e.targetUserId === userId);

  let totalFulfilled = 0;
  let disputeCount = 0;
  let weightedRatingSum = 0;
  let weightedRatingTotal = 0;

  for (const ev of events) {
    const rw = recencyWeight(ev.createdAt);
    switch (ev.eventType) {
      case 'fulfillment_success':
        totalFulfilled += 1;
        break;
      case 'fulfillment_failed':
        disputeCount += 1; // failed fulfillments treated as reputation hit
        break;
      case 'dispute_raised':
        disputeCount += 1;
        break;
      case 'buyer_rating':
      case 'farmer_rating':
        if (typeof ev.scoreImpact === 'number') {
          weightedRatingSum += ev.scoreImpact * rw;
          weightedRatingTotal += rw;
        }
        break;
    }
  }

  // Base score: assumed good faith for new users
  const base = 4.0;

  // Fulfillment bonus: capped at +0.5
  const fulfillmentBonus = Math.min(totalFulfilled * 0.05, 0.5);

  // Rating component: recency-weighted mean (fall back to base if no ratings)
  const ratingComponent =
    weightedRatingTotal > 0 ? weightedRatingSum / weightedRatingTotal : base;

  // Dispute penalty: -0.3 per dispute, recency-weighted max penalty = sum across disputes
  let disputePenalty = 0;
  for (const ev of events) {
    if (ev.eventType === 'dispute_raised' || ev.eventType === 'fulfillment_failed') {
      disputePenalty += 0.3 * recencyWeight(ev.createdAt);
    }
  }

  // Weighted composite: blueprint says "avg rating, fulfillment rate, dispute rate, recency-weighted"
  const raw = 0.5 * base + 0.4 * ratingComponent + 0.1 * (base + fulfillmentBonus) - disputePenalty;

  const score = Math.round(Math.max(1.0, Math.min(5.0, raw)) * 10) / 10;

  const ratingEvents = events.filter(
    (e) => e.eventType === 'buyer_rating' || e.eventType === 'farmer_rating'
  );
  const averageRating =
    ratingEvents.length > 0
      ? Math.round(
          (ratingEvents.reduce((s, e) => s + (e.scoreImpact ?? 0), 0) / ratingEvents.length) * 10
        ) / 10
      : null;

  return {
    score,
    totalFulfilled,
    disputeCount,
    averageRating,
    ratingCount: ratingEvents.length,
    eventCount: events.length,
  };
}

/** Emit a reputation event and return the persisted event */
export function emitReputationEvent(
  event: Omit<ReputationEvent, 'id' | 'createdAt'>
): ReputationEvent {
  const newEvent: ReputationEvent = {
    ...event,
    id: `REP-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    createdAt: new Date().toISOString(),
  };
  store.reputationEvents.push(newEvent);
  return newEvent;
}
