// User profile controller: GET and PUT /api/users/profile
// Handles farmer, buyer, and logistics profile creation and updates.
// Stores profiles in-memory (backed by seed data).

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { SEED_FARMERS, SEED_BUYERS, SEED_LOGISTICS } from '../data/seedData.js';
import { FarmerProfile, BuyerProfile, LogisticsProfile } from '../types.js';

// --- In-memory profile extensions beyond the seed data ---
const farmerProfiles = new Map<string, FarmerProfile>(
  SEED_FARMERS.map((f) => [f.id, { ...f }])
);
const buyerProfiles = new Map<string, BuyerProfile>(
  SEED_BUYERS.map((b) => [b.id, { ...b }])
);
const logisticsProfiles = new Map<string, LogisticsProfile>(
  SEED_LOGISTICS.map((l) => [l.id, { ...l }])
);

// --- Anonymous identity store (farmerUserId -> anonSellerId) ---
const anonIdentities = new Map<string, string>(
  SEED_FARMERS.map((f) => [f.id, f.anonSellerId])
);

function generateAnonId(): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `FARM-${num}`;
}

export function getAnonIdentity(userId: string): string | undefined {
  return anonIdentities.get(userId);
}

export function getFarmerProfile(userId: string): FarmerProfile | undefined {
  return farmerProfiles.get(userId);
}

// GET /api/users/profile — Return current user's profile
export function getProfile(req: AuthRequest, res: Response): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const { userId, role } = user;

  if (role === 'farmer') {
    const profile = farmerProfiles.get(userId);
    if (!profile) {
      res.status(404).json({ error: 'Farmer profile not found. Please complete onboarding.' });
      return;
    }
    res.json({ profile, anonSellerId: anonIdentities.get(userId) });
  } else if (role === 'buyer') {
    const profile = buyerProfiles.get(userId);
    if (!profile) {
      res.status(404).json({ error: 'Buyer profile not found. Please complete onboarding.' });
      return;
    }
    res.json({ profile });
  } else if (role === 'logistics') {
    const profile = logisticsProfiles.get(userId);
    if (!profile) {
      res.status(404).json({ error: 'Logistics profile not found. Please complete onboarding.' });
      return;
    }
    res.json({ profile });
  } else {
    res.status(403).json({ error: 'Admin profiles are managed separately.' });
  }
}

// PUT /api/users/profile — Create or update current user's profile
export function upsertProfile(req: AuthRequest, res: Response): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = req.body as any;
  const { userId, phone, role } = user;

  if (role === 'farmer') {
    const { name, village, district, state, landSizeAcres, primaryCrops, language, lat, lng } = body;

    if (!name || !village || !district || !state) {
      res.status(400).json({ error: 'name, village, district, state are required for farmer profile' });
      return;
    }

    const existing = farmerProfiles.get(userId);
    const anonSellerId = anonIdentities.get(userId) || generateAnonId();

    const updated: FarmerProfile = {
      id: userId,
      phone,
      name,
      role: 'farmer',
      language: language || existing?.language || 'en',
      createdAt: existing?.createdAt || new Date().toISOString(),
      anonSellerId,
      village,
      district,
      state,
      lat: lat ?? existing?.lat ?? 0,
      lng: lng ?? existing?.lng ?? 0,
      landSizeAcres: Number(landSizeAcres) || existing?.landSizeAcres || 1,
      primaryCrops: Array.isArray(primaryCrops) ? primaryCrops : existing?.primaryCrops || [],
      reputationScore: existing?.reputationScore ?? 0,
      totalOrdersFulfilled: existing?.totalOrdersFulfilled ?? 0,
      disputeCount: existing?.disputeCount ?? 0,
    };

    farmerProfiles.set(userId, updated);
    // Ensure anon identity is registered
    if (!anonIdentities.has(userId)) {
      anonIdentities.set(userId, anonSellerId);
    }

    const isNew = !existing;
    res.status(isNew ? 201 : 200).json({
      message: isNew ? 'Farmer profile created' : 'Farmer profile updated',
      profile: updated,
      anonSellerId,
    });
  } else if (role === 'buyer') {
    const { name, businessName, buyerType, district, state, language } = body;

    if (!name || !district || !state) {
      res.status(400).json({ error: 'name, district, state are required for buyer profile' });
      return;
    }

    const existing = buyerProfiles.get(userId);
    const updated: BuyerProfile = {
      id: userId,
      phone,
      name,
      role: 'buyer',
      language: language || existing?.language || 'en',
      createdAt: existing?.createdAt || new Date().toISOString(),
      buyerType: buyerType || existing?.buyerType || 'consumer',
      businessName: businessName || existing?.businessName || name,
      district,
      state,
      verified: existing?.verified ?? false,
    };

    buyerProfiles.set(userId, updated);
    const isNew = !existing;
    res.status(isNew ? 201 : 200).json({
      message: isNew ? 'Buyer profile created' : 'Buyer profile updated',
      profile: updated,
    });
  } else if (role === 'logistics') {
    const { name, vehicleType, capacityKg, serviceRadiusKm, district, state, language, lat, lng } = body;

    if (!name || !vehicleType || !district || !state) {
      res.status(400).json({ error: 'name, vehicleType, district, state are required for logistics profile' });
      return;
    }

    const existing = logisticsProfiles.get(userId);
    const updated: LogisticsProfile = {
      id: userId,
      phone,
      name,
      role: 'logistics',
      language: language || existing?.language || 'en',
      createdAt: existing?.createdAt || new Date().toISOString(),
      vehicleType: vehicleType || existing?.vehicleType || 'Tata Ace (1 Ton)',
      capacityKg: Number(capacityKg) || existing?.capacityKg || 1000,
      serviceRadiusKm: Number(serviceRadiusKm) || existing?.serviceRadiusKm || 50,
      district,
      state,
      lat: lat ?? existing?.lat ?? 0,
      lng: lng ?? existing?.lng ?? 0,
      activeDeliveries: existing?.activeDeliveries ?? 0,
    };

    logisticsProfiles.set(userId, updated);
    const isNew = !existing;
    res.status(isNew ? 201 : 200).json({
      message: isNew ? 'Logistics profile created' : 'Logistics profile updated',
      profile: updated,
    });
  } else {
    res.status(403).json({ error: 'Admin profiles are managed separately.' });
  }
}
