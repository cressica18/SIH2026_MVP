import { Request, Response } from 'express';
import { store } from '../data/store.js';
import { Listing } from '../types.js';

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

export function createListing(req: Request, res: Response): void {
  const newListing: Listing = req.body;
  if (!newListing.crop || !newListing.quantityKg) {
    res.status(400).json({ error: 'crop and quantityKg are required' });
    return;
  }
  newListing.id = `list_${Date.now()}`;
  newListing.status = 'active';
  newListing.createdAt = new Date().toISOString();
  store.listings.unshift(newListing);
  res.status(201).json(newListing);
}

export function updateListing(req: Request, res: Response): void {
  const { id } = req.params;
  const idx = store.listings.findIndex((l) => l.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Listing not found' });
    return;
  }
  store.listings[idx] = { ...store.listings[idx], ...req.body };
  res.json(store.listings[idx]);
}
