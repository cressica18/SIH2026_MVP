// User profile controller: GET and PUT /api/users/profile
// Handles farmer, buyer, logistics, and collector profile creation and updates.
// Stores profiles in-memory (backed by seed data).

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { SEED_FARMERS, SEED_BUYERS, SEED_LOGISTICS, SEED_COLLECTORS, SEED_RECYCLERS } from '../data/seedData.js';
import { FarmerProfile, BuyerProfile, LogisticsProfile, CollectorProfile, RecyclerProfile } from '../types.js';
import { store } from '../data/store.js';

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
const collectorProfiles = new Map<string, CollectorProfile>(
  SEED_COLLECTORS.map((c) => [c.id, { ...c }])
);
const recyclerProfiles = new Map<string, RecyclerProfile>(
  SEED_RECYCLERS.map((r) => [r.id, { ...r }])
);

// --- Anonymous identity store (userId -> anonId) ---
const anonIdentities = new Map<string, string>(
  SEED_FARMERS.map((f) => [f.id, f.anonSellerId])
);
const collectorAnonIdentities = new Map<string, string>(
  SEED_COLLECTORS.map((c) => [c.id, c.anonCollectorId])
);

function generateAnonId(): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `FARM-${num}`;
}

function generateCollectorAnonId(): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `KABAD-${num}`;
}

export function getAnonIdentity(userId: string): string | undefined {
  // Check farmer first, then collector
  return anonIdentities.get(userId) || collectorAnonIdentities.get(userId);
}

export function getFarmerProfile(userId: string): FarmerProfile | undefined {
  return farmerProfiles.get(userId);
}

export function getCollectorProfile(userId: string): CollectorProfile | undefined {
  return collectorProfiles.get(userId);
}

export function getRecyclerProfile(userId: string): RecyclerProfile | undefined {
  return recyclerProfiles.get(userId) || store.recyclerProfiles.get(userId);
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
  } else if (role === 'collector') {
    const profile = collectorProfiles.get(userId);
    if (!profile) {
      res.status(404).json({ error: 'Collector profile not found. Please complete onboarding.' });
      return;
    }
    res.json({ profile, anonCollectorId: collectorAnonIdentities.get(userId) });
  } else if (role === 'recycler') {
    const profile = recyclerProfiles.get(userId) || store.recyclerProfiles.get(userId);
    if (!profile) {
      res.status(404).json({ error: 'Recycler profile not found. Please complete onboarding.' });
      return;
    }
    res.json({ profile });
  } else if (role === 'admin') {
    res.json({
      profile: {
        id: userId,
        phone: user.phone,
        name: 'Admin User',
        role: 'admin',
        language: 'en',
        createdAt: new Date().toISOString(),
      },
    });
  } else {
    res.status(403).json({ error: 'Invalid user role' });
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
  } else if (role === 'collector') {
    const { name, area, district, state, primaryMaterials, language, lat, lng, vehicleType, collectionRadiusKm } = body;

    if (!name || !area || !district || !state) {
      res.status(400).json({ error: 'name, area, district, state are required for collector profile' });
      return;
    }

    const existing = collectorProfiles.get(userId);
    const anonCollectorId = collectorAnonIdentities.get(userId) || generateCollectorAnonId();

    const updated: CollectorProfile = {
      id: userId,
      phone,
      name,
      role: 'collector',
      language: language || existing?.language || 'en',
      createdAt: existing?.createdAt || new Date().toISOString(),
      anonCollectorId,
      area,
      district,
      state,
      lat: lat ?? existing?.lat ?? 0,
      lng: lng ?? existing?.lng ?? 0,
      primaryMaterials: Array.isArray(primaryMaterials) ? primaryMaterials : existing?.primaryMaterials || [],
      reputationScore: existing?.reputationScore ?? 0,
      totalLotsSold: existing?.totalLotsSold ?? 0,
      disputeCount: existing?.disputeCount ?? 0,
      vehicleType: vehicleType || existing?.vehicleType || 'cycle',
      collectionRadiusKm: Number(collectionRadiusKm) || existing?.collectionRadiusKm || 10,
    };

    collectorProfiles.set(userId, updated);
    // Ensure anon identity is registered
    if (!collectorAnonIdentities.has(userId)) {
      collectorAnonIdentities.set(userId, anonCollectorId);
    }

    const isNew = !existing;
    res.status(isNew ? 201 : 200).json({
      message: isNew ? 'Collector profile created' : 'Collector profile updated',
      profile: updated,
      anonCollectorId,
    });
  } else if (role === 'recycler') {
    const { name, businessName, licenseNumber, district, state, acceptedMaterials, capacityKgPerDay, language, lat, lng } = body;

    if (!name || !businessName || !district || !state) {
      res.status(400).json({ error: 'name, businessName, district, state are required for recycler profile' });
      return;
    }

    const existing = recyclerProfiles.get(userId) || store.recyclerProfiles.get(userId);
    const updated: RecyclerProfile = {
      id: userId,
      phone,
      name,
      role: 'recycler',
      language: language || existing?.language || 'en',
      createdAt: existing?.createdAt || new Date().toISOString(),
      businessName,
      licenseNumber: licenseNumber || existing?.licenseNumber || 'MPCB/RO/2024/00000',
      district,
      state,
      lat: lat ?? existing?.lat ?? 0,
      lng: lng ?? existing?.lng ?? 0,
      acceptedMaterials: Array.isArray(acceptedMaterials) ? acceptedMaterials : existing?.acceptedMaterials || ['metal', 'ewaste'],
      capacityKgPerDay: Number(capacityKgPerDay) || existing?.capacityKgPerDay || 5000,
      verified: existing?.verified ?? true,
      reputationScore: existing?.reputationScore ?? 4.8,
    };

    recyclerProfiles.set(userId, updated);
    store.recyclerProfiles.set(userId, updated);

    const isNew = !existing;
    res.status(isNew ? 201 : 200).json({
      message: isNew ? 'Recycler profile created' : 'Recycler profile updated',
      profile: updated,
    });
  } else {
    res.status(403).json({ error: 'Admin profiles are managed separately.' });
  }
}
