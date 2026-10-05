// User profile controller: GET and PUT /api/users/profile
// Handles collector, recycler, and admin profile creation and updates.
// Stores profiles in-memory (backed by seed data).

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { SEED_COLLECTORS, SEED_RECYCLERS } from '../data/seedData.js';
import { CollectorProfile, RecyclerProfile } from '../types.js';
import { store } from '../data/store.js';

// --- In-memory profile extensions beyond the seed data ---
const collectorProfiles = new Map<string, CollectorProfile>(
  SEED_COLLECTORS.map((c) => [c.id, { ...c }])
);
const recyclerProfiles = new Map<string, RecyclerProfile>(
  SEED_RECYCLERS.map((r) => [r.id, { ...r }])
);

// --- Anonymous identity store (userId -> anonId) ---
const collectorAnonIdentities = new Map<string, string>(
  SEED_COLLECTORS.map((c) => [c.id, c.anonCollectorId])
);

function generateCollectorAnonId(): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `KABAD-${num}`;
}

export function getAnonIdentity(userId: string): string | undefined {
  return collectorAnonIdentities.get(userId);
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

  if (role === 'collector') {
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

  if (role === 'collector') {
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
