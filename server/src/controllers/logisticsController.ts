import { Request, Response } from 'express';
import { store } from '../data/store.js';
import { LogisticsPool } from '../types.js';

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
  if (status === 'delivered') {
    pool.orderIds.forEach((oid: string) => {
      const order = store.orders.find((o) => o.id === oid);
      if (order) order.status = 'settled';
    });
  }
  res.json(pool);
}

export function createPool(req: Request, res: Response): void {
  const newPool: LogisticsPool = req.body;
  newPool.id = `POOL-${Date.now()}`;
  store.pools.push(newPool);
  res.status(201).json(newPool);
}
