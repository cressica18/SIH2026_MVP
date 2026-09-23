import { Request, Response } from 'express';
import { store } from '../data/store.js';
import { LogisticsPool, RouteStop, Order } from '../types.js';
import { notifyOrderStatusChanged } from '../services/notificationService.js';
import {
  autoPoolOrders,
  createManualPool,
  optimizeRoute,
  buildRouteStops,
  resolvePickupCoords,
  resolveDropoffCoords
} from '../services/logisticsService.js';

export function getPools(req: Request, res: Response): void {
  res.json({ pools: store.pools, total: store.pools.length });
}

export function getPool(req: Request, res: Response): void {
  const { id } = req.params;
  const pool = store.pools.find((p) => p.id === id);
  if (!pool) {
    res.status(404).json({ error: 'Pool not found' });
    return;
  }
  res.json(pool);
}

export function updatePoolStatus(req: Request, res: Response): void {
  const { id } = req.params;
  const { status } = req.body;
  const pool = store.pools.find((p) => p.id === id);
  if (!pool) {
    res.status(404).json({ error: 'Pool not found' });
    return;
  }
  const validTransitions: Record<string, string[]> = {
    unassigned: ['in_transit', 'delivered'],
    assigned: ['in_transit', 'delivered'],
    in_transit: ['delivered'],
    delivered: [],
  };

  // Allow idempotent transitions (same status) plus defined next-step transitions
  if (pool.status !== status && !validTransitions[pool.status]?.includes(status)) {
    res.status(400).json({ error: `Invalid pool status transition: ${pool.status} → ${status}` });
    return;
  }

  pool.status = status;

  // Sync order statuses to match the pool's lifecycle
  if (status === 'in_transit') {
    pool.orderIds.forEach((oid: string) => {
      const order = store.orders.find((o) => o.id === oid);
      if (order && (order.status === 'confirmed' || order.status === 'pending')) {
        order.status = 'in_transit';
        notifyOrderStatusChanged(order, 'in_transit', 'logistics');
      }
    });
  } else if (status === 'delivered') {
    pool.orderIds.forEach((oid: string) => {
      const order = store.orders.find((o) => o.id === oid);
      if (order && order.status !== 'settled') {
        order.status = 'delivered';
        notifyOrderStatusChanged(order, 'delivered', 'logistics');
      }
    });
  }
  res.json(pool);
}

export function createPool(req: Request, res: Response): void {
  const { orderIds } = req.body;

  if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
    res.status(400).json({ error: 'An array of orderIds is required' });
    return;
  }

  try {
    const newPool = createManualPool(orderIds);
    res.status(201).json(newPool);
  } catch (error) {
    const err = error as Error;
    res.status(400).json({ error: err.message });
  }
}

export function autoCreatePools(req: Request, res: Response): void {
  const { pools, skipped } = autoPoolOrders();
  res.json({ pools, skipped, total: pools.length });
}

export function getPoolRoute(req: Request, res: Response): void {
  const { id } = req.params;
  const pool = store.pools.find((p) => p.id === id);
  if (!pool) {
    res.status(404).json({ error: 'Pool not found' });
    return;
  }

  // Re-optimize route to ensure it's up to date with real coordinates
  const stopsWithCoords = pool.routeStops.map(stop => ({
    stop,
    lat: stop.lat,
    lng: stop.lng,
  }));
  const optimizedStops = optimizeRoute(stopsWithCoords);
  pool.routeStops = optimizedStops;

  res.json({
    poolId: pool.id,
    routeStops: optimizedStops,
    totalStops: optimizedStops.length,
    estimatedDistanceKm: calculateRouteDistance(optimizedStops),
    estimatedDurationMinutes: calculateRouteDuration(optimizedStops),
  });
}

export function joinPool(req: Request, res: Response): void {
  const { id } = req.params;
  const user = (req as any).user;
  
  if (!user || (user.role !== 'logistics' && user.role !== 'admin')) {
    res.status(403).json({ error: 'Only logistics providers or admins can join pools' });
    return;
  }

  const pool = store.pools.find((p) => p.id === id);
  if (!pool) {
    res.status(404).json({ error: 'Pool not found' });
    return;
  }

  if (pool.status !== 'unassigned' && pool.status !== 'assigned') {
    res.status(400).json({ error: `Pool is already ${pool.status} and cannot be joined` });
    return;
  }

  // Assign logistics provider details
  pool.vehicleAssigned = pool.vehicleAssigned || 'Provider Vehicle';
  pool.driverName = pool.driverName || user.userId;
  pool.driverPhone = pool.driverPhone || '';
  pool.status = 'assigned';

  res.json({ 
    message: 'Successfully joined pool', 
    pool 
  });
}

export function updatePoolStop(req: Request, res: Response): void {
  const { id, stopId } = req.params;
  const pool = store.pools.find((p) => p.id === id);
  if (!pool) {
    res.status(404).json({ error: 'Pool not found' });
    return;
  }

  const stop = pool.routeStops.find(s => s.id === stopId);
  if (!stop) {
    res.status(404).json({ error: 'Stop not found in pool' });
    return;
  }

  stop.completed = true;

  // Auto-update pool status to delivered if all stops completed
  const allCompleted = pool.routeStops.every(s => s.completed);
  if (allCompleted) {
    pool.status = 'delivered';
    pool.orderIds.forEach((oid: string) => {
      const order = store.orders.find((o) => o.id === oid);
      if (order && order.status !== 'settled') {
        order.status = 'delivered';
        notifyOrderStatusChanged(order, 'delivered', 'logistics');
      }
    });
  }

  res.json(pool);
}

function calculateRouteDistance(stops: RouteStop[]): number {
  let total = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (a.lat && b.lat) {
      const R = 6371;
      const dLat = (b.lat - a.lat) * Math.PI / 180;
      const dLon = (b.lng - a.lng) * Math.PI / 180;
      const s = Math.sin(dLat / 2) ** 2 +
        Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
      total += R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
    }
  }
  return Math.round(total * 10) / 10;
}

function calculateRouteDuration(stops: RouteStop[]): number {
  const distance = calculateRouteDistance(stops);
  const avgSpeedKmh = 40; // Realistic rural/urban average
  return Math.round((distance / avgSpeedKmh) * 60);
}
