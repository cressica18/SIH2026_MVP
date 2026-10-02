import { ScrapLot, SmartPool, SmartPoolMember, SmartPoolStatus } from '../types.js';

const POOL_RADIUS_KM = 25;
const PICKUP_WINDOW_DAYS = 3;
const MIN_POOL_WEIGHT_KG = 500;
const MAX_POOL_MEMBERS = 10;

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function findCompatibleLots(
  lots: ScrapLot[],
  referenceLot: ScrapLot,
  radiusKm = POOL_RADIUS_KM
): ScrapLot[] {
  const referenceDate = new Date(referenceLot.collectionDate);
  const windowStart = new Date(referenceDate);
  windowStart.setDate(windowStart.getDate() - PICKUP_WINDOW_DAYS);
  const windowEnd = new Date(referenceDate);
  windowEnd.setDate(windowEnd.getDate() + PICKUP_WINDOW_DAYS);

  return lots.filter(lot => {
    if (lot.id === referenceLot.id) return false;
    if (lot.status !== 'available') return false;
    if (lot.materialCategory !== referenceLot.materialCategory) return false;

    const lotDate = new Date(lot.collectionDate);
    if (lotDate < windowStart || lotDate > windowEnd) return false;

    const distance = haversineDistance(referenceLot.lat, referenceLot.lng, lot.lat, lot.lng);
    if (distance > radiusKm) return false;

    return true;
  });
}

export function createSmartPool(
  anchorLot: ScrapLot,
  compatibleLots: ScrapLot[],
  collectorName?: string
): SmartPool {
  const allLots = [anchorLot, ...compatibleLots].slice(0, MAX_POOL_MEMBERS);
  const totalWeight = allLots.reduce((sum, l) => sum + l.estimatedWeightKg, 0);
  const avgPrice = allLots.reduce((sum, l) => sum + l.priceExpectedPerKg * l.estimatedWeightKg, 0) / totalWeight;
  const prices = allLots.map(l => l.priceExpectedPerKg);

  const centerLat = allLots.reduce((sum, l) => sum + l.lat, 0) / allLots.length;
  const centerLng = allLots.reduce((sum, l) => sum + l.lng, 0) / allLots.length;

  const members: SmartPoolMember[] = allLots.map(lot => ({
    lotId: lot.id,
    anonCollectorId: lot.anonCollectorId,
    collectorName: lot.collectorRealName,
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
  }));

  const dates = allLots.map(l => new Date(l.collectionDate));
  const pickupWindowStart = new Date(Math.min(...dates.map(d => d.getTime())));
  const pickupWindowEnd = new Date(Math.max(...dates.map(d => d.getTime())));

  return {
    id: `pool_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    materialCategory: anchorLot.materialCategory,
    materialType: anchorLot.materialType,
    status: 'forming',
    members,
    totalWeightKg: totalWeight,
    avgPricePerKg: Math.round(avgPrice),
    priceRange: { min: Math.min(...prices), max: Math.max(...prices) },
    district: anchorLot.district,
    state: anchorLot.state,
    centerLat,
    centerLng,
    pickupWindowStart: pickupWindowStart.toISOString().split('T')[0],
    pickupWindowEnd: pickupWindowEnd.toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  };
}

export function canFormPool(pool: SmartPool): boolean {
  return pool.totalWeightKg >= MIN_POOL_WEIGHT_KG && pool.members.length >= 2;
}

export function openPoolForBidding(pool: SmartPool): SmartPool {
  return {
    ...pool,
    status: 'open',
    matchedAt: new Date().toISOString(),
  };
}

export function matchPoolWithRecycler(
  pool: SmartPool,
  recyclerId: string,
  recyclerName: string,
  agreedPricePerKg: number
): SmartPool {
  const totalValue = Math.round(pool.totalWeightKg * agreedPricePerKg);
  return {
    ...pool,
    status: 'confirmed',
    recyclerId,
    recyclerName,
    agreedPricePerKg,
    totalValue,
  };
}

export function generateHandoverRef(poolId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `KCP-${poolId.split('_')[1]}-${timestamp}-${random}`;
}