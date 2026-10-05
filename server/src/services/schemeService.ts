/**
 * Scheme Service — Government & Compliance Schemes
 *
 * Implements deterministic, rule-based eligibility matching of government
 * schemes and compliance subsidies to a collector's profile.
 */

import { SEED_GOV_SCHEMES, SEED_COLLECTORS } from '../data/seedData.js';
import { GovScheme, CollectorProfile } from '../types.js';

export interface MatchedScheme extends GovScheme {
  eligibilityReason: string;
  relevanceScore: number;
}

export function checkEligibility(
  scheme: GovScheme,
  collector: CollectorProfile
): { eligible: boolean; reason: string; score: number } {
  const reasons: string[] = [];
  let score = 0;

  const stateMatch =
    scheme.eligibleStates.includes('All India') ||
    scheme.eligibleStates.includes(collector.state);

  if (!stateMatch) {
    return {
      eligible: false,
      reason: `Not available in ${collector.state}`,
      score: 0,
    };
  }

  if (scheme.eligibleStates.includes(collector.state)) {
    reasons.push(`Available in ${collector.state}`);
    score += 20;
  } else {
    reasons.push('Available across India');
  }

  const hasMaterialMatch =
    scheme.eligibleCrops.includes('All Crops') ||
    collector.primaryMaterials.some((m: string) => scheme.eligibleCrops.includes(m));

  if (!hasMaterialMatch) {
    return {
      eligible: false,
      reason: `Not applicable for your materials (${collector.primaryMaterials.join(', ')})`,
      score: 0,
    };
  }

  if (!scheme.eligibleCrops.includes('All Crops')) {
    const matched = collector.primaryMaterials.filter((m: string) =>
      scheme.eligibleCrops.includes(m)
    );
    reasons.push(`Covers material${matched.length > 1 ? 's' : ''}: ${matched.join(', ')}`);
    score += 30;
  } else {
    reasons.push('Applicable to all recycling categories');
  }

  return {
    eligible: true,
    reason: reasons.join(' • '),
    score,
  };
}

export function matchSchemes(
  collector: CollectorProfile,
  categoryFilter?: string
): MatchedScheme[] {
  const schemesToCheck = categoryFilter
    ? SEED_GOV_SCHEMES.filter(
        (s) => s.category.toLowerCase() === categoryFilter.toLowerCase()
      )
    : SEED_GOV_SCHEMES;

  const matched: MatchedScheme[] = [];

  for (const scheme of schemesToCheck) {
    const { eligible, reason, score } = checkEligibility(scheme, collector);
    if (eligible) {
      matched.push({
        ...scheme,
        eligibilityReason: reason,
        relevanceScore: score,
      });
    }
  }

  matched.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return matched;
}

export function matchSchemesForFarmer(
  collectorId: string,
  categoryFilter?: string
): MatchedScheme[] {
  const collector = SEED_COLLECTORS.find((c) => c.id === collectorId);
  if (!collector) {
    throw new Error(`Collector ${collectorId} not found`);
  }
  return matchSchemes(collector, categoryFilter);
}
