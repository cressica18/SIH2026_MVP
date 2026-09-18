// In-memory data store backed by seed data.
// This layer can be replaced with PostgreSQL/Prisma/Redis later.
import {
  Listing, Order, LogisticsPool, AppNotification, AdvanceRequest, ReputationEvent
} from '../types.js';
import {
  SEED_LISTINGS, SEED_ORDERS, SEED_LOGISTICS_POOLS,
  SEED_NOTIFICATIONS,
} from './seedData.js';

// Deep clone seed data to avoid mutation of source
function cloneSeed<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export interface DataStore {
  listings: Listing[];
  orders: Order[];
  pools: LogisticsPool[];
  notifications: AppNotification[];
  advances: AdvanceRequest[];
  reputationEvents: ReputationEvent[];
}

export const createStore = (): DataStore => ({
  listings: cloneSeed(SEED_LISTINGS),
  orders: cloneSeed(SEED_ORDERS),
  pools: cloneSeed(SEED_LOGISTICS_POOLS),
  notifications: cloneSeed(SEED_NOTIFICATIONS),
  advances: [],
  reputationEvents: [],
});

// Singleton store for in-memory usage
export const store = createStore();
