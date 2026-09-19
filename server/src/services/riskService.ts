import { FarmerProfile, RiskAssessment, Listing, Order } from '../types.js';
import { store } from '../data/store.js';
import { SEED_RISK_ASSESSMENTS } from '../data/seedData.js';
import { getFarmerProfile } from '../controllers/usersController.js';

interface RiskFactors {
  priceVolatilityIndex: 'Low' | 'Moderate' | 'High';
  fulfillmentRate: string;
  avgQualityGrade: string;
  reputationScore: number;
  landHoldingWeight: string;
}

export function calculatePriceVolatilityIndex(farmerId: string): 'Low' | 'Moderate' | 'High' {
  const listings = store.listings.filter(l => l.anonSellerId === getFarmerProfile(farmerId)?.anonSellerId);
  if (listings.length === 0) return 'Moderate';
  
  const crops = new Set(listings.map(l => l.crop));
  let volatilityScore = 0;
  
  for (const crop of crops) {
    const cropListings = listings.filter(l => l.crop === crop);
    if (cropListings.length >= 2) {
      const prices = cropListings.map(l => l.priceExpected);
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      const variance = prices.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / prices.length;
      const cv = Math.sqrt(variance) / avg;
      volatilityScore += cv;
    }
  }
  
  const avgVolatility = crops.size > 0 ? volatilityScore / crops.size : 0.1;
  if (avgVolatility < 0.05) return 'Low';
  if (avgVolatility < 0.15) return 'Moderate';
  return 'High';
}

export function calculateFulfillmentRate(farmerId: string): string {
  const profile = getFarmerProfile(farmerId);
  if (!profile || profile.totalOrdersFulfilled === 0) return 'N/A';
  
  const farmerOrders = store.orders.filter(o => 
    o.anonSellerId === profile.anonSellerId && ['delivered', 'settled'].includes(o.status)
  );
  const totalRelevant = store.orders.filter(o => 
    o.anonSellerId === profile.anonSellerId && ['confirmed', 'in_transit', 'delivered', 'settled'].includes(o.status)
  ).length;
  
  if (totalRelevant === 0) return 'N/A';
  const rate = Math.round((farmerOrders.length / totalRelevant) * 100);
  return `${rate}%`;
}

export function calculateAvgQualityGrade(farmerId: string): string {
  const profile = getFarmerProfile(farmerId);
  if (!profile) return 'N/A';
  
  const listings = store.listings.filter(l => l.anonSellerId === profile.anonSellerId);
  if (listings.length === 0) return 'N/A';
  
  const gradeValues: Record<string, number> = { A: 3, B: 2, C: 1 };
  const total = listings.reduce((sum, l) => sum + (gradeValues[l.quality.grade] || 0), 0);
  const avg = total / listings.length;
  
  if (avg >= 2.5) return 'Grade A';
  if (avg >= 1.5) return 'Grade B';
  return 'Grade C';
}

export function calculateRiskScore(factors: RiskFactors): number {
  let score = 50;
  
  if (factors.priceVolatilityIndex === 'Low') score -= 10;
  else if (factors.priceVolatilityIndex === 'High') score += 15;
  
  const fulfillmentPct = parseInt(factors.fulfillmentRate) || 0;
  if (fulfillmentPct >= 90) score -= 15;
  else if (fulfillmentPct >= 70) score -= 5;
  else if (fulfillmentPct > 0) score += 10;
  else score += 5;
  
  if (factors.avgQualityGrade === 'Grade A') score -= 10;
  else if (factors.avgQualityGrade === 'Grade B') score += 5;
  else if (factors.avgQualityGrade === 'Grade C') score += 15;
  
  if (factors.reputationScore >= 4.5) score -= 10;
  else if (factors.reputationScore >= 4.0) score -= 5;
  else if (factors.reputationScore < 3.0) score += 15;
  
  const landAcres = parseFloat(factors.landHoldingWeight) || 0;
  if (landAcres >= 5) score -= 5;
  else if (landAcres < 1) score += 10;
  
  return Math.max(0, Math.min(100, score));
}

export function getRiskTier(score: number): 'Low Risk' | 'Moderate Risk' | 'High Risk' {
  if (score <= 30) return 'Low Risk';
  if (score <= 60) return 'Moderate Risk';
  return 'High Risk';
}

export function calculateEligibleAdvance(riskTier: 'Low Risk' | 'Moderate Risk' | 'High Risk', reputationScore: number, landAcres: number): number {
  let baseAmount = 0;
  if (riskTier === 'Low Risk') baseAmount = 50000;
  else if (riskTier === 'Moderate Risk') baseAmount = 20000;
  else return 0;
  
  const reputationMultiplier = reputationScore / 5.0;
  const landMultiplier = Math.min(1.5, Math.max(0.5, landAcres / 2.5));
  
  return Math.round(baseAmount * reputationMultiplier * landMultiplier / 1000) * 1000;
}

function generateExplanation(factors: RiskFactors, riskTier: string, profile: FarmerProfile): string {
  const parts: string[] = [];
  
  parts.push(`Price volatility index: ${factors.priceVolatilityIndex.toLowerCase()}.`);
  parts.push(`Order fulfillment rate: ${factors.fulfillmentRate}.`);
  parts.push(`Average produce quality grade: ${factors.avgQualityGrade}.`);
  parts.push(`Trust reputation score: ${factors.reputationScore.toFixed(1)}/5.0 (${profile.totalOrdersFulfilled} orders fulfilled).`);
  parts.push(`Land holding: ${factors.landHoldingWeight}.`);
  
  return `Deterministic risk assessment (${riskTier}): ${parts.join(' ')}`;
}

export function assessRisk(farmerId: string): RiskAssessment {
  const seeded = SEED_RISK_ASSESSMENTS[farmerId];
  if (seeded) return seeded;
  
  const profile = getFarmerProfile(farmerId);
  if (!profile) {
    throw new Error(`Farmer ${farmerId} not found`);
  }
  
  const factors: RiskFactors = {
    priceVolatilityIndex: calculatePriceVolatilityIndex(farmerId),
    fulfillmentRate: calculateFulfillmentRate(farmerId),
    avgQualityGrade: calculateAvgQualityGrade(farmerId),
    reputationScore: profile.reputationScore,
    landHoldingWeight: `${profile.landSizeAcres} Acres`,
  };
  
  const riskScore = calculateRiskScore(factors);
  const riskTier = getRiskTier(riskScore);
  const eligibleAdvanceAmount = calculateEligibleAdvance(riskTier, profile.reputationScore, profile.landSizeAcres);
  const explanation = generateExplanation(factors, riskTier, profile);
  
  return {
    farmerId,
    riskScore,
    riskTier,
    eligibleAdvanceAmount,
    factors,
    explanation,
  };
}

export function getRiskAssessment(farmerId: string): RiskAssessment {
  return assessRisk(farmerId);
}