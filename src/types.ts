export type Role = 'farmer' | 'buyer' | 'logistics' | 'admin';

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

export interface BuyerProfile extends UserProfile {
  role: 'buyer';
  buyerType: 'consumer' | 'retailer' | 'processor' | 'fpo';
  businessName: string;
  district: string;
  state: string;
  verified: boolean;
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

export interface Listing {
  id: string;
  anonSellerId: string;
  farmerRealName?: string; // Kept private, only in DB / revealed post-confirm
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
