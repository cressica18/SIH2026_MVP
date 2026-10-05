import { Request, Response } from 'express';
import { store } from '../data/store.js';
import { Listing } from '../types.js';
import { AuthRequest } from '../middleware/auth.js';
import { getAnonIdentity, getCollectorProfile } from './usersController.js';

function scrubListing(listing: Listing): Listing {
  const scrubbed = { ...listing };
  delete scrubbed.farmerRealName;
  delete scrubbed.farmerPhone;
  return scrubbed;
}

export function getListings(req: Request, res: Response): void {
  res.json({ listings: store.listings.map(scrubListing), total: store.listings.length });
}

export function getListing(req: Request, res: Response): void {
  const { id } = req.params;
  const listing = store.listings.find((l) => l.id === id);
  if (!listing) {
    res.status(404).json({ error: 'Listing not found' });
    return;
  }
  res.json(scrubListing(listing));
}

export function createListing(req: AuthRequest, res: Response): void {
  const body = req.body as any;
  const user = req.user;

  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const quantityKg = Number(body.quantityKg);
  const priceExpected = Number(body.priceExpected);

  const anonCollectorId = getAnonIdentity(user.userId);
  const collectorProfile = getCollectorProfile(user.userId);

  if (!anonCollectorId || !collectorProfile) {
    res.status(400).json({ error: 'Collector profile not found. Please complete onboarding.' });
    return;
  }

  const newListing: Listing = {
    ...body,
    crop: body.crop || body.materialType || 'Mixed Scrap',
    variety: body.variety || 'Standard',
    quantityKg: quantityKg || 100,
    priceExpected: priceExpected || 50,
    id: `list_${Date.now()}`,
    anonSellerId: anonCollectorId,
    farmerRealName: collectorProfile.name,
    farmerPhone: collectorProfile.phone,
    village: collectorProfile.area,
    district: collectorProfile.district,
    state: collectorProfile.state,
    lat: collectorProfile.lat,
    lng: collectorProfile.lng,
    quality: body.quality || {
      grade: 'B',
      confidence: 85,
      colorUniformity: 85,
      surfaceDefects: 10,
      firmnessScore: 80,
      freshnessLabel: 'Scrap lot',
      notes: 'Quality checked.',
    },
    priceAi: body.priceAi || {
      min: Math.round((priceExpected || 50) * 0.85),
      fair: priceExpected || 50,
      max: Math.round((priceExpected || 50) * 1.15),
      confidence: 80,
      historicalMarketAvg: Math.round((priceExpected || 50) * 0.95),
      trend: 'stable',
      benchmarkMarket: `${collectorProfile.district} Yard`,
    },
    imageUrl: body.imageUrl || 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=600&auto=format&fit=crop&q=80',
    status: 'active',
    createdVia: body.createdVia || 'text',
    createdAt: new Date().toISOString(),
    farmerReputation: collectorProfile.reputationScore || 5.0,
  };

  store.listings.unshift(newListing);
  res.status(201).json(scrubListing(newListing));
}

export function updateListing(req: AuthRequest, res: Response): void {
  const { id } = req.params;
  const user = req.user;
  const body = req.body as any;

  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const idx = store.listings.findIndex((l) => l.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Listing not found' });
    return;
  }

  const listing = store.listings[idx];
  if (body.status) {
    listing.status = body.status;
  }
  store.listings[idx] = listing;
  res.json(scrubListing(listing));
}
