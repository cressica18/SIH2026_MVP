import { Request, Response } from 'express';
import { store } from '../data/store.js';

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
  pool.status = status;
  res.json(pool);
}

export function createPool(req: Request, res: Response): void {
  res.status(400).json({ error: 'Pools are created automatically via Smart Pool engine.' });
}

export function autoCreatePools(req: Request, res: Response): void {
  res.json({ pools: store.pools, skipped: 0, total: store.pools.length });
}

export function getPoolRoute(req: Request, res: Response): void {
  const { id } = req.params;
  const pool = store.pools.find((p) => p.id === id);
  if (!pool) {
    res.status(404).json({ error: 'Pool not found' });
    return;
  }
  res.json({
    poolId: pool.id,
    routeStops: pool.routeStops,
    totalStops: pool.routeStops.length,
    estimatedDistanceKm: 15,
    estimatedDurationMinutes: 30,
  });
}

export function joinPool(req: Request, res: Response): void {
  res.json({ message: 'Joined pool' });
}

export function updatePoolStop(req: Request, res: Response): void {
  const { id } = req.params;
  const pool = store.pools.find((p) => p.id === id);
  if (!pool) {
    res.status(404).json({ error: 'Pool not found' });
    return;
  }
  res.json(pool);
}
