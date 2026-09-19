/**
 * Scheme Service — Phase 15: Government Scheme Awareness
 *
 * Implements deterministic, rule-based eligibility matching of government
 * schemes to a farmer's profile. No LLM or external API required.
 *
 * Matching rules (documented):
 * 1. State eligibility: scheme.eligibleStates includes farmer.state OR 'All India'
 * 2. Crop eligibility: scheme.eligibleCrops includes any of farmer.primaryCrops OR 'All Crops'
 * 3. Land size (if scheme has maxLandAcreage): farmer.landSizeAcres <= maxLandAcreage
 * 4. Land size (if scheme has minLandAcreage): farmer.landSizeAcres >= minLandAcreage
 *
 * Each matched scheme receives an eligibilityReason string explaining why it matched.
 * Results are ranked: crop-specific matches first, then state-specific, then universal.
 */

import { SEED_GOV_SCHEMES } from '../data/seedData.js';
import { SEED_FARMERS } from '../data/seedData.js';
import { GovScheme, FarmerProfile } from '@shared/types.ts';

export interface MatchedScheme extends GovScheme {
  eligibilityReason: string;
  relevanceScore: number; // higher = more specific/relevant
}

/**
 * Determines if a scheme is eligible for a given farmer profile and
 * produces an explanation string.
 */
export function checkEligibility(
  scheme: GovScheme,
  farmer: FarmerProfile
): { eligible: boolean; reason: string; score: number } {
  const reasons: string[] = [];
  let score = 0;

  // Rule 1: State eligibility
  const stateMatch =
    scheme.eligibleStates.includes('All India') ||
    scheme.eligibleStates.includes(farmer.state);

  if (!stateMatch) {
    return {
      eligible: false,
      reason: `Not available in ${farmer.state}`,
      score: 0,
    };
  }

  if (scheme.eligibleStates.includes(farmer.state)) {
    reasons.push(`Available in ${farmer.state}`);
    score += 20; // state-specific match is more relevant
  } else {
    reasons.push('Available across India');
  }

  // Rule 2: Crop eligibility
  const hasCropMatch =
    scheme.eligibleCrops.includes('All Crops') ||
    farmer.primaryCrops.some((crop) => scheme.eligibleCrops.includes(crop));

  if (!hasCropMatch) {
    return {
      eligible: false,
      reason: `Not applicable for your crops (${farmer.primaryCrops.join(', ')})`,
      score: 0,
    };
  }

  if (!scheme.eligibleCrops.includes('All Crops')) {
    const matchedCrops = farmer.primaryCrops.filter((c) =>
      scheme.eligibleCrops.includes(c)
    );
    reasons.push(`Covers your crop${matchedCrops.length > 1 ? 's' : ''}: ${matchedCrops.join(', ')}`);
    score += 30; // crop-specific match is highly relevant
  } else {
    reasons.push('Applicable to all crops');
  }

  // Rule 3: Land size upper bound
  if (scheme.maxLandAcreage !== undefined) {
    if (farmer.landSizeAcres > scheme.maxLandAcreage) {
      return {
        eligible: false,
        reason: `Your land (${farmer.landSizeAcres} acres) exceeds scheme limit of ${scheme.maxLandAcreage} acres`,
        score: 0,
      };
    }
    reasons.push(`Eligible: ${farmer.landSizeAcres} acres ≤ ${scheme.maxLandAcreage} acre limit`);
    score += 10;
  }

  // Rule 4: Land size lower bound
  if (scheme.minLandAcreage !== undefined) {
    if (farmer.landSizeAcres < scheme.minLandAcreage) {
      return {
        eligible: false,
        reason: `Your land (${farmer.landSizeAcres} acres) is below minimum ${scheme.minLandAcreage} acres`,
        score: 0,
      };
    }
    reasons.push(`Land holding meets ${scheme.minLandAcreage} acre minimum`);
    score += 5;
  }

  return {
    eligible: true,
    reason: reasons.join(' • '),
    score,
  };
}

/**
 * Returns schemes matched and ranked for a given farmer.
 * Rankings: higher relevance score first (crop+state specific > crop only > universal).
 */
export function matchSchemes(
  farmer: FarmerProfile,
  categoryFilter?: string
): MatchedScheme[] {
  const schemesToCheck = categoryFilter
    ? SEED_GOV_SCHEMES.filter(
        (s) => s.category.toLowerCase() === categoryFilter.toLowerCase()
      )
    : SEED_GOV_SCHEMES;

  const matched: MatchedScheme[] = [];

  for (const scheme of schemesToCheck) {
    const { eligible, reason, score } = checkEligibility(scheme, farmer);
    if (eligible) {
      matched.push({
        ...scheme,
        eligibilityReason: reason,
        relevanceScore: score,
      });
    }
  }

  // Sort by relevance score descending — most specific/relevant first
  matched.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return matched;
}

/**
 * Looks up a farmer by ID from seed data and runs matchSchemes.
 * Throws descriptive errors for unknown farmer IDs.
 */
export function matchSchemesForFarmer(
  farmerId: string,
  categoryFilter?: string
): MatchedScheme[] {
  const farmer = SEED_FARMERS.find((f) => f.id === farmerId);
  if (!farmer) {
    throw new Error(`Farmer ${farmerId} not found`);
  }
  return matchSchemes(farmer, categoryFilter);
}
