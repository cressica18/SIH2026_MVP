import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { store } from '../data/store.js';
import { AdvanceRequest, RiskAssessment } from '../types.js';
import { getFarmerProfile } from './usersController.js';
import { assessRisk } from '../services/riskService.js';
import { notifyAdvanceDisbursed } from '../services/notificationService.js';

export function getRiskProfile(req: AuthRequest, res: Response): void {
  const { farmerId } = req.params;
  
  if (req.user!.role !== 'admin' && req.user!.userId !== farmerId) {
    res.status(403).json({ error: 'Unauthorized to view this risk profile' });
    return;
  }

  try {
    const risk = assessRisk(farmerId);
    res.json(risk);
  } catch (error) {
    res.status(404).json({ error: 'Farmer not found' });
  }
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
  if (!profile) {
    res.status(404).json({ error: 'Farmer profile not found' });
    return;
  }

  const risk = assessRisk(req.user!.userId);
  if (amountRequested > risk.eligibleAdvanceAmount) {
    res.status(400).json({ 
      error: `Requested amount exceeds eligible advance limit of ₹${risk.eligibleAdvanceAmount.toLocaleString('en-IN')}`,
      eligibleAdvanceAmount: risk.eligibleAdvanceAmount
    });
    return;
  }

  const newAdvance: AdvanceRequest = {
    id: `ADV-${Date.now()}`,
    farmerId: req.user!.userId,
    farmerName: profile.name,
    amountRequested,
    purpose: purpose || 'Working Capital',
    status: 'requested'
  };

  store.advances.push(newAdvance);
  res.status(201).json(newAdvance);
}

export function simulateAepsCashout(req: AuthRequest, res: Response): void {
  if (req.user!.role !== 'farmer') {
    res.status(403).json({ error: 'Only farmers can simulate AEPS cash-out' });
    return;
  }

  const { advanceId, aadhaarLast4 } = req.body;
  
  if (!advanceId) {
    res.status(400).json({ error: 'advanceId is required' });
    return;
  }

  if (!aadhaarLast4 || !/^\d{4}$/.test(aadhaarLast4)) {
    res.status(400).json({ error: 'Valid 4-digit Aadhaar last 4 digits required' });
    return;
  }

  const advance = store.advances.find(a => a.id === advanceId && a.farmerId === req.user!.userId);
  if (!advance) {
    res.status(404).json({ error: 'Advance request not found or unauthorized' });
    return;
  }

  if (advance.status === 'disbursed') {
    res.status(400).json({ error: 'Advance already disbursed' });
    return;
  }

  const profile = getFarmerProfile(req.user!.userId);
  if (!profile) {
    res.status(404).json({ error: 'Farmer profile not found' });
    return;
  }

  const aepsTxnRef = `NPCI-AEPS-${Date.now().toString().slice(-8)}-${Math.floor(1000 + Math.random() * 9000)}`;
  const disbursedAt = new Date().toISOString();

  advance.status = 'disbursed';
  advance.aepsTxnRef = aepsTxnRef;
  advance.disbursedAt = disbursedAt;

  // Send notification for advance disbursement
  notifyAdvanceDisbursed(req.user!.userId, advance.amountRequested, aepsTxnRef);

  res.json({
    message: 'AEPS cash-out simulated successfully (MOCK - not real banking)',
    advance: {
      id: advance.id,
      farmerId: advance.farmerId,
      amountRequested: advance.amountRequested,
      status: advance.status,
      aepsTxnRef: advance.aepsTxnRef,
      disbursedAt: advance.disbursedAt,
    },
    mockDetails: {
      aadhaarLast4,
      bcAgent: `BC-${profile.district.toUpperCase().slice(0, 3)}-${Math.floor(100 + Math.random() * 900)}`,
      bank: 'Mock Gramin Bank',
      note: 'This is a SIMULATED AEPS flow for demo purposes only. No real biometric or banking integration.'
    }
  });
}