import {
  Listing, Order, LogisticsPool, AppNotification, AdvanceRequest, ReputationEvent, SafetyReport, ScrapLot,
  SmartPool, PoolOffer, SettlementRecord, RecyclerProfile
} from '../types.js';
import {
  SEED_NOTIFICATIONS, SEED_SAFETY_REPORTS,
  SEED_SCRAP_LOTS, SEED_SMART_POOLS, SEED_POOL_OFFERS, SEED_SETTLEMENTS, SEED_RECYCLERS,
} from './seedData.js';

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
  scrapLots: ScrapLot[];
  smartPools: SmartPool[];
  poolOffers: PoolOffer[];
  settlements: SettlementRecord[];
  recyclerProfiles: Map<string, RecyclerProfile>;
}

export const createStore = (): DataStore => ({
  listings: [],
  orders: [],
  pools: [],
  notifications: cloneSeed(SEED_NOTIFICATIONS),
  advances: [],
  reputationEvents: [],
  reports: cloneSeed(SEED_SAFETY_REPORTS),
  scrapLots: cloneSeed(SEED_SCRAP_LOTS),
  smartPools: cloneSeed(SEED_SMART_POOLS),
  poolOffers: cloneSeed(SEED_POOL_OFFERS),
  settlements: cloneSeed(SEED_SETTLEMENTS),
  recyclerProfiles: new Map(SEED_RECYCLERS.map(r => [r.id, { ...r }])),
});

export const store = createStore();
