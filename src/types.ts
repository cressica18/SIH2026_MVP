export type Role = 'farmer' | 'buyer' | 'logistics' | 'admin' | 'collector' | 'recycler';

export type Language = 'en' | 'hi' | 'mr' | 'te' | 'pa';

export interface UserProfile {
  id: string;
  phone: string;
  name: string;
  role: Role;
  language: Language;
  createdAt: string;
}

export interface FarmerProfile extends UserProfile {
  role: 'farmer';
  anonSellerId: string;
  village: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  landSizeAcres: number;
  primaryCrops: string[];
  reputationScore: number;
  totalOrdersFulfilled: number;
  disputeCount: number;
}

export interface CollectorProfile extends UserProfile {
  role: 'collector';
  anonCollectorId: string;
  area: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  primaryMaterials: string[];
  reputationScore: number;
  totalLotsSold: number;
  disputeCount: number;
  vehicleType?: 'cycle' | 'rickshaw' | 'tempo' | 'truck';
  collectionRadiusKm: number;
}

export interface BuyerProfile extends UserProfile {
  role: 'buyer';
  buyerType: 'consumer' | 'retailer' | 'processor' | 'fpo';
  businessName: string;
  district: string;
  state: string;
  verified: boolean;
}

export interface RecyclerProfile extends UserProfile {
  role: 'recycler';
  businessName: string;
  licenseNumber: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  acceptedMaterials: string[];
  capacityKgPerDay: number;
  verified: boolean;
  reputationScore: number;
}

export interface LogisticsProfile extends UserProfile {
  role: 'logistics';
  vehicleType: 'Tata Ace (1 Ton)' | 'Bolero Pickup (1.5 Ton)' | 'Eicher 14ft (3.5 Ton)';
  capacityKg: number;
  serviceRadiusKm: number;
  district: string;
  state: string;
  lat: number;
  lng: number;
  activeDeliveries: number;
}

export type QualityGrade = 'A' | 'B' | 'C';

export interface QualityAssessment {
  grade: QualityGrade;
  confidence: number;
  colorUniformity: number; // 0-100%
  surfaceDefects: number; // 0-100% (lower is better)
  firmnessScore: number; // 0-100%
  freshnessLabel: string;
  notes: string;
}

export interface PriceBand {
  min: number;
  fair: number;
  max: number;
  confidence: number;
  historicalMandiAvg: number;
  trend: 'rising' | 'stable' | 'falling';
  benchmarkMandi: string;
}

export type ListingStatus = 'active' | 'matched' | 'sold' | 'withdrawn';

export type LotStatus = 'draft' | 'available' | 'pooled' | 'sold';

export interface Listing {
  id: string;
  anonSellerId: string;
  farmerRealName?: string;
  farmerPhone?: string;
  crop: string;
  variety: string;
  quantityKg: number;
  priceExpected: number;
  priceAi: PriceBand;
  quality: QualityAssessment;
  imageUrl: string;
  village: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  status: ListingStatus;
  createdVia: 'voice' | 'text';
  createdAt: string;
  farmerReputation: number;
  distanceKm?: number;
  matchScore?: number;
}

export interface ScrapLot {
  id: string;
  anonCollectorId: string;
  collectorRealName?: string;
  collectorPhone?: string;
  materialType: string;
  materialCategory: 'metal' | 'plastic' | 'paper' | 'ewaste' | 'glass' | 'rubber' | 'mixed';
  estimatedWeightKg: number;
  priceExpectedPerKg: number;
  priceAi: PriceBand;
  quality: QualityAssessment;
  imageUrl: string;
  area: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  collectionDate: string;
  notes?: string;
  status: LotStatus;
  createdVia: 'voice' | 'text';
  createdAt: string;
  collectorReputation: number;
  distanceKm?: number;
  matchScore?: number;
}

export type OrderStatus =
  | 'pending'
  | 'matched'
  | 'confirmed'
  | 'in_transit'
  | 'delivered'
  | 'settled'
  | 'disputed';

export interface Order {
  id: string;
  listingId: string;
  crop: string;
  variety: string;
  quantityKg: number;
  agreedPricePerKg: number;
  totalAmount: number;
  buyerId: string;
  buyerName: string;
  buyerType: string;
  buyerPhone: string;
  anonSellerId: string;
  // Private seller identity fields, ONLY visible after status is 'confirmed' or later
  sellerRealName?: string;
  sellerPhone?: string;
  sellerVillage?: string;
  sellerDistrict?: string;
  sellerState?: string;
  status: OrderStatus;
  identityRevealed: boolean;
  identityRevealedAt?: string;
  deliveryAddress: string;
  poolId?: string;
  createdAt: string;
  settledAt?: string;
  buyerRating?: number;
  farmerRating?: number;
}

export interface RouteStop {
  id: string;
  orderId: string;
  stopType: 'pickup' | 'dropoff';
  locationName: string;
  farmerOrBuyerName: string;
  contactPhone: string;
  crop: string;
  quantityKg: number;
  lat: number;
  lng: number;
  completed: boolean;
}

export interface LogisticsPool {
  id: string;
  clusterRegion: string;
  date: string;
  orderIds: string[];
  orders: Order[];
  routeStops: RouteStop[];
  totalWeightKg: number;
  maxCapacityKg: number;
  vehicleAssigned?: string;
  driverName?: string;
  driverPhone?: string;
  status: 'unassigned' | 'assigned' | 'in_transit' | 'delivered';
  fuelSavingsPercent: number;
  carbonReducedKg: number;
}

export type SmartPoolStatus = 'forming' | 'open' | 'matched' | 'confirmed' | 'in_transit' | 'completed' | 'cancelled';

export interface SmartPoolMember {
  lotId: string;
  anonCollectorId: string;
  collectorName?: string;
  materialType: string;
  materialCategory: string;
  estimatedWeightKg: number;
  priceExpectedPerKg: number;
  qualityGrade: QualityGrade;
  area: string;
  district: string;
  lat: number;
  lng: number;
  collectionDate: string;
  joinedAt: string;
}

export interface SmartPool {
  id: string;
  materialCategory: 'metal' | 'plastic' | 'paper' | 'ewaste' | 'glass' | 'rubber' | 'mixed';
  materialType: string;
  status: SmartPoolStatus;
  members: SmartPoolMember[];
  totalWeightKg: number;
  avgPricePerKg: number;
  priceRange: { min: number; max: number };
  district: string;
  state: string;
  centerLat: number;
  centerLng: number;
  pickupWindowStart: string;
  pickupWindowEnd: string;
  createdAt: string;
  matchedAt?: string;
  recyclerId?: string;
  recyclerName?: string;
  agreedPricePerKg?: number;
  totalValue?: number;
  handoverRef?: string;
}

export interface GovScheme {
  id: string;
  title: string;
  description: string;
  benefitAmount: string;
  category: 'Direct Benefit' | 'Crop Insurance' | 'Infrastructure & Equipment' | 'Solar & Irrigation' | 'Organic Subsidy' | 'Credit' | 'Market Linkage' | 'Training & Extension';
  eligibleStates: string[];
  eligibleCrops: string[];
  maxLandAcreage?: number;
  minLandAcreage?: number;
  sourceUrl: string;
  applicationDeadline: string;
  /** Present only on matched results — explains why this scheme is relevant */
  eligibilityReason?: string;
}

export interface RiskAssessment {
  farmerId: string;
  riskScore: number; // 0 - 100
  riskTier: 'Low Risk' | 'Moderate Risk' | 'High Risk';
  eligibleAdvanceAmount: number;
  factors: {
    priceVolatilityIndex: string;
    fulfillmentRate: string;
    avgQualityGrade: string;
    reputationScore: number;
    landHoldingWeight: string;
  };
  explanation: string;
}

export interface AdvanceRequest {
  id: string;
  farmerId: string;
  farmerName: string;
  amountRequested: number;
  purpose: string;
  status: 'requested' | 'approved' | 'disbursed';
  aepsTxnRef?: string;
  disbursedAt?: string;
}

export interface SafetyReport {
  id: string;
  reporterUserId?: string; // Optional - empty if anonymous
  reporterName?: string;
  isAnonymous: boolean;
  reportedEntityName: string;
  category: 'Underpricing & Cartel' | 'Harassment' | 'Broker Exploitation' | 'Payment Default' | 'Transport Dispute';
  description: string;
  relatedOrderId?: string;
  status: 'open' | 'reviewing' | 'resolved';
  resolutionNotes?: string;
  createdAt: string;
}

export interface MarketPricePoint {
  date: string;
  price: number;
  arrivalsTons: number;
}

export interface MarketInsight {
  crop: string;
  currentAvgPrice: number;
  lastWeekAvgPrice: number;
  changePercent: number;
  trend: 'rising' | 'stable' | 'falling';
  history: MarketPricePoint[];
  volatilityIndex: 'Low' | 'Moderate' | 'High';
  forecastNextWeek: number;
  aiSummary: string;
}

export interface AppNotification {
  id: string;
  timestamp: string;
  title: string;
  message: string;
  roleTarget: Role | 'all';
  read: boolean;
  type: 'order' | 'reveal' | 'logistics' | 'finance' | 'safety' | 'scheme' | 'match';
  targetUserId?: string;
  relatedOrderId?: string;
  relatedReportId?: string;
}

export interface VoiceExtractionResult {
  crop: string;
  variety: string;
  quantityKg: number;
  priceExpected: number;
  confidence: number;
  rawTranscript: string;
}

export type ReputationEventType = 'fulfillment_success' | 'fulfillment_failed' | 'buyer_rating' | 'farmer_rating' | 'dispute_raised';

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired' | 'withdrawn';

export interface PoolOffer {
  id: string;
  poolId: string;
  recyclerId: string;
  recyclerName: string;
  offeredPricePerKg: number;
  totalValue: number;
  status: OfferStatus;
  notes?: string;
  createdAt: string;
  respondedAt?: string;
  counterPricePerKg?: number;
  expiresAt: string;
}

export interface SettlementRecord {
  id: string;
  poolId: string;
  offerId: string;
  recyclerId: string;
  recyclerName: string;
  agreedPricePerKg: number;
  totalWeightKg: number;
  totalValue: number;
  memberSettlements: MemberSettlement[];
  status: 'pending' | 'processing' | 'completed' | 'disputed';
  handoverRef: string;
  qrCode?: string;
  createdAt: string;
  completedAt?: string;
  paymentMethod: 'cash' | 'upi' | 'bank_transfer';
  paymentRef?: string;
}

export interface MemberSettlement {
  lotId: string;
  anonCollectorId: string;
  collectorName?: string;
  weightKg: number;
  pricePerKg: number;
  amount: number;
  status: 'pending' | 'paid' | 'disputed';
  paidAt?: string;
}

export interface ReputationEvent {
  id: string;
  targetUserId: string;
  sourceUserId: string;
  orderId?: string;
  eventType: ReputationEventType;
  scoreImpact?: number;
  notes?: string;
  createdAt: string;
}
