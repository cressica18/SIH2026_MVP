import { Request, Response } from 'express';
import { store } from '../data/store.js';
import { ScrapLot, QualityAssessment, PriceBand } from '../types.js';
import { AuthRequest } from '../middleware/auth.js';
import { getAnonIdentity, getCollectorProfile } from './usersController.js';

function scrubScrapLot(lot: ScrapLot): ScrapLot {
  const scrubbed = { ...lot };
  delete scrubbed.collectorRealName;
  delete scrubbed.collectorPhone;
  return scrubbed;
}

export function getScrapLots(req: Request, res: Response): void {
  res.json({ lots: store.scrapLots.map(scrubScrapLot), total: store.scrapLots.length });
}

export function getScrapLot(req: Request, res: Response): void {
  const { id } = req.params;
  const lot = store.scrapLots.find((l) => l.id === id);
  if (!lot) {
    res.status(404).json({ error: 'Scrap lot not found' });
    return;
  }
  res.json(scrubScrapLot(lot));
}

export function createScrapLot(req: AuthRequest, res: Response): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = req.body as any;
  const user = req.user;

  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!body.materialType || typeof body.materialType !== 'string' || body.materialType.trim().length === 0) {
    res.status(400).json({ error: 'materialType is required and must be a non-empty string' });
    return;
  }

  const validCategories = ['metal', 'plastic', 'paper', 'ewaste', 'glass', 'rubber', 'mixed'];
  if (!body.materialCategory || !validCategories.includes(body.materialCategory)) {
    res.status(400).json({ error: 'materialCategory must be one of: metal, plastic, paper, ewaste, glass, rubber, mixed' });
    return;
  }

  const estimatedWeightKg = Number(body.estimatedWeightKg);
  if (body.estimatedWeightKg === undefined || body.estimatedWeightKg === null || isNaN(estimatedWeightKg) || estimatedWeightKg <= 0 || !Number.isFinite(estimatedWeightKg)) {
    res.status(400).json({ error: 'estimatedWeightKg must be a positive number' });
    return;
  }

  if (estimatedWeightKg > 1000000) {
    res.status(400).json({ error: 'estimatedWeightKg exceeds maximum allowed limit of 1,000,000 kg' });
    return;
  }

  const priceExpectedPerKg = Number(body.priceExpectedPerKg);
  if (body.priceExpectedPerKg === undefined || body.priceExpectedPerKg === null || isNaN(priceExpectedPerKg) || priceExpectedPerKg <= 0 || !Number.isFinite(priceExpectedPerKg)) {
    res.status(400).json({ error: 'priceExpectedPerKg must be a positive number' });
    return;
  }

  if (priceExpectedPerKg > 100000) {
    res.status(400).json({ error: 'priceExpectedPerKg exceeds maximum allowed limit of ₹100,000/kg' });
    return;
  }

  if (!body.collectionDate || typeof body.collectionDate !== 'string') {
    res.status(400).json({ error: 'collectionDate is required' });
    return;
  }

  const anonCollectorId = getAnonIdentity(user.userId);
  const collectorProfile = getCollectorProfile(user.userId);

  if (!anonCollectorId || !collectorProfile) {
    res.status(400).json({ error: 'Collector profile not found. Please complete onboarding.' });
    return;
  }

  const newLot: ScrapLot = {
    ...body,
    materialType: body.materialType.trim(),
    materialCategory: body.materialCategory,
    estimatedWeightKg,
    priceExpectedPerKg,
    id: `lot_${Date.now()}`,
    anonCollectorId,
    collectorRealName: collectorProfile.name,
    collectorPhone: collectorProfile.phone,
    area: body.area || collectorProfile.area,
    district: body.district || collectorProfile.district,
    state: body.state || collectorProfile.state,
    lat: body.lat || collectorProfile.lat,
    lng: body.lng || collectorProfile.lng,
    collectionDate: body.collectionDate,
    notes: body.notes,
    quality: body.quality || {
      grade: 'B',
      confidence: 85,
      colorUniformity: 85,
      surfaceDefects: 10,
      firmnessScore: 80,
      freshnessLabel: 'Standard scrap grade',
      notes: 'Quality not yet assessed via CNN.',
    },
    priceAi: body.priceAi || {
      min: Math.round(priceExpectedPerKg * 0.85),
      fair: priceExpectedPerKg,
      max: Math.round(priceExpectedPerKg * 1.15),
      confidence: 80,
      historicalMandiAvg: Math.round(priceExpectedPerKg * 0.95),
      trend: 'stable',
      benchmarkMandi: `${collectorProfile.district} Scrap Market`,
    },
    imageUrl: body.imageUrl || 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80',
    status: body.status || 'available',
    createdVia: body.createdVia || 'text',
    createdAt: new Date().toISOString(),
    collectorReputation: collectorProfile.reputationScore || 5.0,
  };

  store.scrapLots.unshift(newLot);
  res.status(201).json(scrubScrapLot(newLot));
}

export function updateScrapLot(req: AuthRequest, res: Response): void {
  const { id } = req.params;
  const user = req.user;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = req.body as any;

  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const idx = store.scrapLots.findIndex((l) => l.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Scrap lot not found' });
    return;
  }

  const lot = store.scrapLots[idx];
  const anonCollectorId = getAnonIdentity(user.userId);

  if (user.role !== 'admin' && lot.anonCollectorId !== anonCollectorId) {
    res.status(403).json({ error: 'Not authorized to update this scrap lot' });
    return;
  }

  if (body.status) {
    const validStatuses = ['draft', 'available', 'pooled', 'sold'];
    if (!validStatuses.includes(body.status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }
    lot.status = body.status;
  }

  if (body.estimatedWeightKg !== undefined) {
    const updatedWeight = Number(body.estimatedWeightKg);
    if (isNaN(updatedWeight) || updatedWeight < 0 || !Number.isFinite(updatedWeight)) {
      res.status(400).json({ error: 'estimatedWeightKg must be a non-negative number' });
      return;
    }
    lot.estimatedWeightKg = updatedWeight;
  }

  if (body.priceExpectedPerKg !== undefined) {
    const updatedPrice = Number(body.priceExpectedPerKg);
    if (isNaN(updatedPrice) || updatedPrice < 0 || !Number.isFinite(updatedPrice)) {
      res.status(400).json({ error: 'priceExpectedPerKg must be a non-negative number' });
      return;
    }
    lot.priceExpectedPerKg = updatedPrice;
  }

  store.scrapLots[idx] = lot;
  res.json(scrubScrapLot(lot));
}