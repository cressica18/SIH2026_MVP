import { Request, Response } from 'express';
import { store } from '../data/store.js';
import { Listing } from '../types.js';
import { AuthRequest } from '../middleware/auth.js';
import { getAnonIdentity, getFarmerProfile } from './usersController.js';

export function getListings(req: Request, res: Response): void {
  res.json({ listings: store.listings, total: store.listings.length });
}

export function getListing(req: Request, res: Response): void {
  const { id } = req.params;
  const listing = store.listings.find((l) => l.id === id);
  if (!listing) {
    res.status(404).json({ error: 'Listing not found' });
    return;
  }
  res.json(listing);
}

export function createListing(req: AuthRequest, res: Response): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = req.body as any;
  const user = req.user;
  
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (!body.crop || !body.quantityKg) {
    res.status(400).json({ error: 'crop and quantityKg are required' });
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
    id: `list_${Date.now()}`,
    anonSellerId,
    farmerRealName: farmerProfile.name,
    farmerPhone: farmerProfile.phone,
    status: 'active',
    createdVia: body.createdVia || 'text',
    createdAt: new Date().toISOString(),
    farmerReputation: farmerProfile.reputationScore || 5.0,
  };
  
  store.listings.unshift(newListing);
  res.status(201).json(newListing);
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
    listing.status = body.status;
  }

  store.listings[idx] = listing;
  res.json(listing);
}

