import { store } from '../data/store.js';
import { LogisticsPool } from '../types.js';

export function autoPoolOrders(): { pools: LogisticsPool[]; skipped: string[] } {
  return { pools: store.pools, skipped: [] };
}

export function createManualPool(orderIds: string[]): LogisticsPool {
  throw new Error('Manual pooling handled via Smart Pool engine.');
}

export function optimizeRoute(stopsWithCoords: any[]): any[] {
  return stopsWithCoords.map(s => s.stop);
}
