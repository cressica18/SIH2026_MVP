// In-memory data store backed by seed data.
// This layer can be replaced with PostgreSQL/Prisma/Redis later.
import {
  Listing, Order, LogisticsPool, AppNotification, AdvanceRequest, ReputationEvent, SafetyReport, BuyerProfile, ScrapLot,
  SmartPool, PoolOffer, SettlementRecord, RecyclerProfile
} from '../types.js';
import {
  SEED_LISTINGS, SEED_ORDERS, SEED_LOGISTICS_POOLS,
  SEED_NOTIFICATIONS, SEED_SAFETY_REPORTS,
  SEED_BUYERS, SEED_SCRAP_LOTS, SEED_SMART_POOLS, SEED_POOL_OFFERS, SEED_SETTLEMENTS, SEED_RECYCLERS,
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
  reports: SafetyReport[];
  buyerProfiles: BuyerProfile[];
  scrapLots: ScrapLot[];
  smartPools: SmartPool[];
  poolOffers: PoolOffer[];
  settlements: SettlementRecord[];
  recyclerProfiles: Map<string, RecyclerProfile>;
}

export const createStore = (): DataStore => ({
  listings: cloneSeed(SEED_LISTINGS),
  orders: cloneSeed(SEED_ORDERS),
  pools: cloneSeed(SEED_LOGISTICS_POOLS),
  notifications: cloneSeed(SEED_NOTIFICATIONS),
  advances: [],
  reputationEvents: [],
  reports: cloneSeed(SEED_SAFETY_REPORTS),
  buyerProfiles: cloneSeed(SEED_BUYERS),
  scrapLots: cloneSeed(SEED_SCRAP_LOTS),
  smartPools: cloneSeed(SEED_SMART_POOLS),
  poolOffers: cloneSeed(SEED_POOL_OFFERS),
  settlements: cloneSeed(SEED_SETTLEMENTS),
  recyclerProfiles: new Map(SEED_RECYCLERS.map(r => [r.id, { ...r }])),
});

// Singleton store for in-memory usage
export const store = createStore();
