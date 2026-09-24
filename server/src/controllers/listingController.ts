import { Request, Response } from 'express';
import { store } from '../data/store.js';
import { Listing, QualityAssessment, PriceBand } from '../types.js';
import { AuthRequest } from '../middleware/auth.js';
import { getAnonIdentity, getFarmerProfile } from './usersController.js';

// Helper to scrub private seller info from listings
// (seller identity stays hidden until order confirmation state)
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = req.body as any;
  const user = req.user;
  
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!body.crop || typeof body.crop !== 'string' || body.crop.trim().length === 0) {
    res.status(400).json({ error: 'crop is required and must be a non-empty string' });
    return;
  }

  const quantityKg = Number(body.quantityKg);
  if (body.quantityKg === undefined || body.quantityKg === null || isNaN(quantityKg) || quantityKg <= 0 || !Number.isFinite(quantityKg)) {
    res.status(400).json({ error: 'quantityKg must be a positive number' });
    return;
  }

  if (quantityKg > 10_000_000) {
    res.status(400).json({ error: 'quantityKg exceeds maximum allowed limit of 10,000,000 kg' });
    return;
  }

  const priceExpected = Number(body.priceExpected);
  if (body.priceExpected === undefined || body.priceExpected === null || isNaN(priceExpected) || priceExpected <= 0 || !Number.isFinite(priceExpected)) {
    res.status(400).json({ error: 'priceExpected must be a positive number' });
    return;
  }

  if (priceExpected > 1_000_000) {
    res.status(400).json({ error: 'priceExpected exceeds maximum allowed limit of ₹1,000,000/kg' });
    return;
  }

  const anonSellerId = getAnonIdentity(user.userId);
  const farmerProfile = getFarmerProfile(user.userId);
  
  if (!anonSellerId || !farmerProfile) {
    res.status(400).json({ error: 'Farmer profile not found. Please complete onboarding.' });
    return;
  }

  const newListing: Listing = {
    ...body,
    crop: body.crop.trim(),
    variety: body.variety ? String(body.variety).trim() : 'Standard',
    quantityKg,
    priceExpected,
    id: `list_${Date.now()}`,
    anonSellerId,
    farmerRealName: farmerProfile.name,
    farmerPhone: farmerProfile.phone,
    // Populate region/location from farmer profile
    village: body.village || farmerProfile.village,
    district: body.district || farmerProfile.district,
    state: body.state || farmerProfile.state,
    lat: body.lat || farmerProfile.lat,
    lng: body.lng || farmerProfile.lng,
    // Defaults for required fields not yet assessed
    quality: body.quality || {
      grade: 'B',
      confidence: 85,
      colorUniformity: 85,
      surfaceDefects: 10,
      firmnessScore: 80,
      freshnessLabel: 'Fresh harvest',
      notes: 'Quality not yet assessed via CNN.',
    },
    priceAi: body.priceAi || {
      min: Math.round(priceExpected * 0.85),
      fair: priceExpected,
      max: Math.round(priceExpected * 1.15),
      confidence: 80,
      historicalMandiAvg: Math.round(priceExpected * 0.95),
      trend: 'stable',
      benchmarkMandi: `${farmerProfile.district} APMC`,
    },
    imageUrl: body.imageUrl || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
    status: 'active',
    createdVia: body.createdVia || 'text',
    createdAt: new Date().toISOString(),
    farmerReputation: farmerProfile.reputationScore || 5.0,
  };

  store.listings.unshift(newListing);
  res.status(201).json(scrubListing(newListing));
}

export function updateListing(req: AuthRequest, res: Response): void {
  const { id } = req.params;
  const user = req.user;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const anonSellerId = getAnonIdentity(user.userId);

  if (user.role !== 'admin' && listing.anonSellerId !== anonSellerId) {
    res.status(403).json({ error: 'Not authorized to update this listing' });
    return;
  }

  if (body.status) {
    const validStatuses = ['active', 'matched', 'withdrawn', 'completed'];
    if (!validStatuses.includes(body.status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }
    listing.status = body.status;
  }

  if (body.quantityKg !== undefined) {
    const updatedQty = Number(body.quantityKg);
    if (isNaN(updatedQty) || updatedQty < 0 || !Number.isFinite(updatedQty)) {
      res.status(400).json({ error: 'quantityKg must be a non-negative number' });
      return;
    }
    listing.quantityKg = updatedQty;
  }

  store.listings[idx] = listing;
  res.json(scrubListing(listing));
}

