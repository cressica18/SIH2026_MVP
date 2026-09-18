import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { store } from '../data/store.js';
import { AdvanceRequest, RiskAssessment } from '../types.js';
import { SEED_RISK_ASSESSMENTS } from '../data/seedData.js';
import { getFarmerProfile } from './usersController.js';

export function getRiskProfile(req: AuthRequest, res: Response): void {
  const { farmerId } = req.params;
  
  // Auth check: Only the farmer themselves or an admin can view their risk profile
  if (req.user!.role !== 'admin' && req.user!.userId !== farmerId) {
    res.status(403).json({ error: 'Unauthorized to view this risk profile' });
    return;
  }

  // Use seeded risk if available, else calculate a deterministic one
  let risk = SEED_RISK_ASSESSMENTS[farmerId];
  
  if (!risk) {
    const profile = getFarmerProfile(farmerId);
    if (!profile) {
      res.status(404).json({ error: 'Farmer not found' });
      return;
    }
    
    // Calculate simple transparent deterministic risk tier based on reputation and fulfilled orders
    let riskTier: 'Low Risk' | 'Moderate Risk' | 'High Risk' = 'Moderate Risk';
    let riskScore = 40;
    
    if (profile.reputationScore >= 4.5 && profile.totalOrdersFulfilled >= 1) {
      riskTier = 'Low Risk';
      riskScore = 15;
    } else if (profile.reputationScore < 3.0 || profile.disputeCount > 2) {
      riskTier = 'High Risk';
      riskScore = 80;
    }

    const eligibleAdvanceAmount = riskTier === 'Low Risk' ? 50000 : riskTier === 'Moderate Risk' ? 20000 : 0;

    risk = {
      farmerId,
      riskScore,
      riskTier,
      eligibleAdvanceAmount,
      factors: {
        priceVolatilityIndex: 'Low', // Simplified for MVP
        fulfillmentRate: profile.totalOrdersFulfilled > 0 ? '100%' : 'N/A',
        avgQualityGrade: 'Grade A',
        reputationScore: profile.reputationScore,
        landHoldingWeight: `${profile.landSizeAcres} Acres`
      },
      explanation: `Deterministic calculation based on ${profile.totalOrdersFulfilled} fulfilled orders and ${profile.reputationScore} reputation.`
    };
  }

  res.json(risk);
}

export function getAdvances(req: AuthRequest, res: Response): void {
  if (req.user!.role === 'admin') {
    res.json({ advances: store.advances });
    return;
  }
  
  const userAdvances = store.advances.filter(a => a.farmerId === req.user!.userId);
  res.json({ advances: userAdvances });
}

export function requestAdvance(req: AuthRequest, res: Response): void {
  // Only farmers can request advances
  if (req.user!.role !== 'farmer') {
    res.status(403).json({ error: 'Only farmers can request advances' });
    return;
  }

  const { amountRequested, purpose, simulateAeps } = req.body;
  if (!amountRequested || amountRequested <= 0) {
    res.status(400).json({ error: 'Valid amount requested is required' });
    return;
  }

  const profile = getFarmerProfile(req.user!.userId);
  const farmerName = profile ? profile.name : 'Unknown Farmer';

  const newAdvance: AdvanceRequest = {
    id: `ADV-${Date.now()}`,
    farmerId: req.user!.userId,
    farmerName,
    amountRequested,
    purpose: purpose || 'Working Capital',
    status: 'requested'
  };

  if (simulateAeps) {
    newAdvance.status = 'disbursed';
    newAdvance.aepsTxnRef = `AEPS-${Math.floor(100000 + Math.random() * 900000)}`;
    newAdvance.disbursedAt = new Date().toISOString();
  }

  store.advances.push(newAdvance);
  res.status(201).json(newAdvance);
}
