import { Request, Response } from 'express';
import { store } from '../data/store.js';
import { SmartPool, SmartPoolMember, PoolOffer, OfferStatus, SettlementRecord } from '../types.js';
import { AuthRequest } from '../middleware/auth.js';
import { getAnonIdentity, getCollectorProfile, getRecyclerProfile } from './usersController.js';
import { findCompatibleLots, createSmartPool, openPoolForBidding, matchPoolWithRecycler, generateHandoverRef } from '../lib/smartPool.js';

function scrubSmartPool(pool: SmartPool): SmartPool {
  const scrubbed = { ...pool };
  scrubbed.members = scrubbed.members.map(m => ({
    ...m,
    collectorName: undefined,
    collectorPhone: undefined,
  }));
  return scrubbed;
}

export function getSmartPools(req: Request, res: Response): void {
  const { status, materialCategory, district, state } = req.query;
  let pools = store.smartPools;

  if (status) {
    pools = pools.filter(p => p.status === status);
  }
  if (materialCategory) {
    pools = pools.filter(p => p.materialCategory === materialCategory);
  }
  if (district) {
    pools = pools.filter(p => p.district.toLowerCase().includes((district as string).toLowerCase()));
  }
  if (state) {
    pools = pools.filter(p => p.state.toLowerCase().includes((state as string).toLowerCase()));
  }

  res.json({ pools: pools.map(scrubSmartPool), total: pools.length });
}

export function getSmartPool(req: Request, res: Response): void {
  const { id } = req.params;
  const pool = store.smartPools.find((p) => p.id === id);
  if (!pool) {
    res.status(404).json({ error: 'Smart pool not found' });
    return;
  }
  res.json(scrubSmartPool(pool));
}

export function getPoolsForCollector(req: AuthRequest, res: Response): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const anonCollectorId = getAnonIdentity(user.userId);
  if (!anonCollectorId) {
    res.status(400).json({ error: 'Collector profile not found' });
    return;
  }

  const pools = store.smartPools
    .filter(p => p.members.some(m => m.anonCollectorId === anonCollectorId))
    .map(scrubSmartPool);

  res.json({ pools, total: pools.length });
}

export function createSmartPoolFromLot(req: AuthRequest, res: Response): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = req.body as any;
  const { lotId } = body;

  if (!lotId) {
    res.status(400).json({ error: 'lotId is required' });
    return;
  }

  const anonCollectorId = getAnonIdentity(user.userId);
  const collectorProfile = getCollectorProfile(user.userId);

  if (!anonCollectorId || !collectorProfile) {
    res.status(400).json({ error: 'Collector profile not found' });
    return;
  }

  const lot = store.scrapLots.find(l => l.id === lotId && l.anonCollectorId === anonCollectorId);
  if (!lot) {
    res.status(404).json({ error: 'Lot not found or not owned by you' });
    return;
  }

  if (lot.status !== 'available') {
    res.status(400).json({ error: 'Only available lots can join a smart pool' });
    return;
  }

  // Find compatible lots
  const compatibleLots = findCompatibleLots(store.scrapLots, lot);

  if (compatibleLots.length === 0) {
    res.status(400).json({ error: 'No compatible lots found nearby. Try expanding your search or wait for more lots.' });
    return;
  }

  // Create the pool
  const pool = createSmartPool(lot, compatibleLots, collectorProfile.name);

  // Update lot statuses to 'pooled'
  [lot, ...compatibleLots].forEach(l => {
    l.status = 'pooled';
  });

  // Add to store
  store.smartPools.unshift(pool);

  // Open for bidding
  const openPool = openPoolForBidding(pool);
  const idx = store.smartPools.findIndex(p => p.id === pool.id);
  store.smartPools[idx] = openPool;

  res.status(201).json(scrubSmartPool(openPool));
}

export function joinSmartPool(req: AuthRequest, res: Response): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = req.body as any;
  const { poolId, lotId } = body;

  if (!poolId || !lotId) {
    res.status(400).json({ error: 'poolId and lotId are required' });
    return;
  }

  const anonCollectorId = getAnonIdentity(user.userId);
  const collectorProfile = getCollectorProfile(user.userId);

  if (!anonCollectorId || !collectorProfile) {
    res.status(400).json({ error: 'Collector profile not found' });
    return;
  }

  const pool = store.smartPools.find(p => p.id === poolId);
  if (!pool) {
    res.status(404).json({ error: 'Smart pool not found' });
    return;
  }

  if (pool.status !== 'forming' && pool.status !== 'open') {
    res.status(400).json({ error: 'Pool is not accepting new members' });
    return;
  }

  const lot = store.scrapLots.find(l => l.id === lotId && l.anonCollectorId === anonCollectorId);
  if (!lot) {
    res.status(404).json({ error: 'Lot not found or not owned by you' });
    return;
  }

  if (lot.status !== 'available') {
    res.status(400).json({ error: 'Only available lots can join a smart pool' });
    return;
  }

  if (lot.materialCategory !== pool.materialCategory) {
    res.status(400).json({ error: 'Material category does not match pool' });
    return;
  }

  // Check if already a member
  if (pool.members.some(m => m.lotId === lotId)) {
    res.status(400).json({ error: 'Lot is already part of this pool' });
    return;
  }

  // Check max members
  if (pool.members.length >= 10) {
    res.status(400).json({ error: 'Pool has reached maximum members (10)' });
    return;
  }

  // Add member
  const member: SmartPoolMember = {
    lotId: lot.id,
    anonCollectorId: lot.anonCollectorId,
    collectorName: collectorProfile.name,
    materialType: lot.materialType,
    materialCategory: lot.materialCategory,
    estimatedWeightKg: lot.estimatedWeightKg,
    priceExpectedPerKg: lot.priceExpectedPerKg,
    qualityGrade: lot.quality.grade,
    area: lot.area,
    district: lot.district,
    lat: lot.lat,
    lng: lot.lng,
    collectionDate: lot.collectionDate,
    joinedAt: new Date().toISOString(),
  };

  pool.members.push(member);
  pool.totalWeightKg += lot.estimatedWeightKg;
  const prices = pool.members.map(m => m.priceExpectedPerKg);
  pool.priceRange = { min: Math.min(...prices), max: Math.max(...prices) };
  pool.avgPricePerKg = Math.round(pool.members.reduce((sum, m) => sum + m.priceExpectedPerKg * m.estimatedWeightKg, 0) / pool.totalWeightKg);

  // Update lot status
  lot.status = 'pooled';

  const idx = store.smartPools.findIndex(p => p.id === poolId);
  store.smartPools[idx] = pool;

  res.json(scrubSmartPool(pool));
}

export function leaveSmartPool(req: AuthRequest, res: Response): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = req.body as any;
  const { poolId, lotId } = body;

  if (!poolId || !lotId) {
    res.status(400).json({ error: 'poolId and lotId are required' });
    return;
  }

  const anonCollectorId = getAnonIdentity(user.userId);
  if (!anonCollectorId) {
    res.status(400).json({ error: 'Collector profile not found' });
    return;
  }

  const pool = store.smartPools.find(p => p.id === poolId);
  if (!pool) {
    res.status(404).json({ error: 'Smart pool not found' });
    return;
  }

  if (pool.status !== 'forming' && pool.status !== 'open') {
    res.status(400).json({ error: 'Cannot leave pool in current status' });
    return;
  }

  const memberIdx = pool.members.findIndex(m => m.lotId === lotId && m.anonCollectorId === anonCollectorId);
  if (memberIdx === -1) {
    res.status(404).json({ error: 'Lot not found in this pool' });
    return;
  }

  const member = pool.members[memberIdx];
  pool.members.splice(memberIdx, 1);
  pool.totalWeightKg -= member.estimatedWeightKg;

  // Update lot status back to available
  const lot = store.scrapLots.find(l => l.id === lotId);
  if (lot) {
    lot.status = 'available';
  }

  // If pool has less than 2 members, cancel it
  if (pool.members.length < 2) {
    pool.status = 'cancelled';
    pool.members.forEach(m => {
      const l = store.scrapLots.find(l => l.id === m.lotId);
      if (l) l.status = 'available';
    });
  }

  const idx = store.smartPools.findIndex(p => p.id === poolId);
  store.smartPools[idx] = pool;

  res.json(scrubSmartPool(pool));
}

export function getPoolOffers(req: Request, res: Response): void {
  const { poolId } = req.params;
  const offers = store.poolOffers.filter(o => o.poolId === poolId);
  res.json({ offers, total: offers.length });
}

export function createPoolOffer(req: AuthRequest, res: Response): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  if (user.role !== 'recycler' && user.role !== 'admin') {
    res.status(403).json({ error: 'Only recyclers can make offers' });
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = req.body as any;
  const { poolId, offeredPricePerKg, notes } = body;

  if (!poolId || !offeredPricePerKg) {
    res.status(400).json({ error: 'poolId and offeredPricePerKg are required' });
    return;
  }

  const pool = store.smartPools.find(p => p.id === poolId);
  if (!pool) {
    res.status(404).json({ error: 'Smart pool not found' });
    return;
  }

  if (pool.status !== 'open') {
    res.status(400).json({ error: 'Pool is not open for bidding' });
    return;
  }

  // Check if recycler accepts this material
  const recyclerProfile = store.recyclerProfiles?.get(user.userId) || getRecyclerProfile(user.userId);
  if (recyclerProfile && !recyclerProfile.acceptedMaterials.includes(pool.materialCategory)) {
    res.status(400).json({ error: 'Your facility does not accept this material category' });
    return;
  }

  const totalValue = Math.round(pool.totalWeightKg * offeredPricePerKg);
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48 hours

  const offer: PoolOffer = {
    id: `offer_${Date.now()}`,
    poolId,
    recyclerId: user.userId,
    recyclerName: recyclerProfile?.businessName || 'Recycler',
    offeredPricePerKg,
    totalValue,
    status: 'pending',
    notes,
    createdAt: new Date().toISOString(),
    expiresAt,
  };

  store.poolOffers.unshift(offer);
  res.status(201).json(offer);
}

export function respondToOffer(req: AuthRequest, res: Response): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = req.body as any;
  const { offerId, action, counterPricePerKg } = body; // action: 'accept' | 'reject' | 'counter'

  if (!offerId || !action) {
    res.status(400).json({ error: 'offerId and action are required' });
    return;
  }

  const offer = store.poolOffers.find(o => o.id === offerId);
  if (!offer) {
    res.status(404).json({ error: 'Offer not found' });
    return;
  }

  // Check if user is a member of the pool
  const pool = store.smartPools.find(p => p.id === offer.poolId);
  if (!pool) {
    res.status(404).json({ error: 'Pool not found' });
    return;
  }

  const isMember = pool.members.some(m => m.anonCollectorId === getAnonIdentity(user.userId));
  if (!isMember && user.role !== 'admin') {
    res.status(403).json({ error: 'Not authorized to respond to this offer' });
    return;
  }

  if (offer.status !== 'pending') {
    res.status(400).json({ error: 'Offer is no longer pending' });
    return;
  }

  if (new Date() > new Date(offer.expiresAt)) {
    offer.status = 'expired';
    res.status(400).json({ error: 'Offer has expired' });
    return;
  }

  switch (action) {
    case 'accept':
      offer.status = 'accepted';
      offer.respondedAt = new Date().toISOString();
      pool.status = 'confirmed';
      pool.recyclerId = offer.recyclerId;
      pool.recyclerName = offer.recyclerName;
      pool.agreedPricePerKg = offer.offeredPricePerKg;
      pool.totalValue = offer.totalValue;

      const handoverRef = generateHandoverRef(pool.id);
      pool.handoverRef = handoverRef;

      // Create settlement record
      const settlement: SettlementRecord = {
        id: `settlement_${Date.now()}`,
        poolId: pool.id,
        offerId: offer.id,
        recyclerId: offer.recyclerId,
        recyclerName: offer.recyclerName,
        agreedPricePerKg: offer.offeredPricePerKg,
        totalWeightKg: pool.totalWeightKg,
        totalValue: offer.totalValue,
        memberSettlements: pool.members.map(m => ({
          lotId: m.lotId,
          anonCollectorId: m.anonCollectorId,
          collectorName: m.collectorName,
          weightKg: m.estimatedWeightKg,
          pricePerKg: offer.offeredPricePerKg,
          amount: Math.round(m.estimatedWeightKg * offer.offeredPricePerKg),
          status: 'pending',
        })),
        status: 'pending',
        handoverRef,
        createdAt: new Date().toISOString(),
        paymentMethod: 'upi',
      };
      store.settlements.unshift(settlement);
      break;

    case 'reject':
      offer.status = 'rejected';
      offer.respondedAt = new Date().toISOString();
      break;

    case 'counter':
      if (!counterPricePerKg || counterPricePerKg <= 0) {
        res.status(400).json({ error: 'Counter price must be a positive number' });
        return;
      }
      offer.status = 'countered';
      offer.counterPricePerKg = counterPricePerKg;
      offer.respondedAt = new Date().toISOString();
      break;

    default:
      res.status(400).json({ error: 'Invalid action. Must be: accept, reject, or counter' });
      return;
  }

  res.json({ offer, pool: scrubSmartPool(pool) });
}

export function getSettlements(req: Request, res: Response): void {
  const { poolId, collectorId, recyclerId } = req.query;
  let settlements = store.settlements;

  if (poolId) {
    settlements = settlements.filter(s => s.poolId === poolId);
  }
  if (collectorId) {
    settlements = settlements.filter(s => s.memberSettlements.some(m => m.anonCollectorId === collectorId));
  }
  if (recyclerId) {
    settlements = settlements.filter(s => s.recyclerId === recyclerId);
  }

  res.json({ settlements, total: settlements.length });
}

export function getSettlement(req: Request, res: Response): void {
  const { id } = req.params;
  const settlement = store.settlements.find(s => s.id === id);
  if (!settlement) {
    res.status(404).json({ error: 'Settlement not found' });
    return;
  }
  res.json(settlement);
}

export function completeHandover(req: AuthRequest, res: Response): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = req.body as any;
  const { settlementId, qrCode } = body;

  if (!settlementId) {
    res.status(400).json({ error: 'settlementId is required' });
    return;
  }

  const settlement = store.settlements.find(s => s.id === settlementId);
  if (!settlement) {
    res.status(404).json({ error: 'Settlement not found' });
    return;
  }

  // Verify user is recycler or admin
  if (user.role !== 'recycler' && user.role !== 'admin') {
    res.status(403).json({ error: 'Only recyclers can complete handovers' });
    return;
  }

  settlement.status = 'completed';
  settlement.completedAt = new Date().toISOString();
  if (qrCode) {
    settlement.qrCode = qrCode;
  }

  // Update member settlements
  settlement.memberSettlements.forEach(m => {
    m.status = 'paid';
    m.paidAt = new Date().toISOString();
  });

  // Update pool status
  const pool = store.smartPools.find(p => p.id === settlement.poolId);
  if (pool) {
    pool.status = 'completed';
  }

  res.json(settlement);
}

export function getReferencePrices(req: Request, res: Response): void {
  const { materialCategory, district, state } = req.query;

  // Mock reference prices based on demo data
  const referencePrices: Record<string, number> = {
    'metal-Nashik': 580,
    'metal-Pune': 560,
    'metal-Mumbai': 590,
    'metal-Bengaluru Urban': 570,
    'ewaste-Bengaluru Urban': 1180,
    'ewaste-Pune': 1150,
    'plastic-Pune': 30,
    'plastic-Mumbai': 32,
    'paper-Pune': 18,
    'glass-Mumbai': 8,
    'rubber-Pune': 15,
  };

  const key = `${materialCategory}-${district}`;
  const price = referencePrices[key];

  res.json({
    materialCategory,
    district,
    state,
    referencePrice: price,
    source: 'Demo transaction data (last 30 days)',
    timestamp: new Date().toISOString(),
    note: price ? 'Based on completed local transactions' : 'No local data available, using national average',
  });
}