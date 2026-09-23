// Re-export all seed data from the frontend's seedData.ts-compatible structures.
// This file provides the in-memory data store backed by the same seed data.
import {
  FarmerProfile,
  BuyerProfile,
  LogisticsProfile,
  Listing,
  Order,
  LogisticsPool,
  GovScheme,
  RiskAssessment,
  AdvanceRequest,
  SafetyReport,
  MarketInsight,
  AppNotification,
} from '@shared/types.ts';

export const SEED_FARMERS: FarmerProfile[] = [
  {
    id: 'farmer_1', phone: '+91 98231 44521', name: 'Ramesh Patil', role: 'farmer',
    language: 'mr', createdAt: '2026-08-10', anonSellerId: 'FARM-88214',
    village: 'Pimpalgaon', district: 'Nashik', state: 'Maharashtra',
    lat: 20.1634, lng: 73.9856, landSizeAcres: 3.5,
    primaryCrops: ['Tomato', 'Onion', 'Grapes'], reputationScore: 4.9,
    totalOrdersFulfilled: 38, disputeCount: 0,
  },
  {
    id: 'farmer_2', phone: '+91 94481 22910', name: 'Lakshmi Devi', role: 'farmer',
    language: 'te', createdAt: '2026-08-14', anonSellerId: 'FARM-34902',
    village: 'Mulbagal', district: 'Kolar', state: 'Karnataka',
    lat: 13.1633, lng: 78.3962, landSizeAcres: 2.2,
    primaryCrops: ['Tomato', 'Green Chilli', 'Potato'], reputationScore: 4.8,
    totalOrdersFulfilled: 24, disputeCount: 0,
  },
  {
    id: 'farmer_3', phone: '+91 98140 77615', name: 'Gurpreet Singh', role: 'farmer',
    language: 'pa', createdAt: '2026-08-20', anonSellerId: 'FARM-51209',
    village: 'Samrala', district: 'Ludhiana', state: 'Punjab',
    lat: 30.8354, lng: 76.1917, landSizeAcres: 5.0,
    primaryCrops: ['Wheat', 'Potato', 'Mustard'], reputationScore: 4.7,
    totalOrdersFulfilled: 19, disputeCount: 1,
  },
  {
    id: 'farmer_4', phone: '+91 97554 11203', name: 'Sunita Bai Chouhan', role: 'farmer',
    language: 'hi', createdAt: '2026-08-22', anonSellerId: 'FARM-19044',
    village: 'Sanwer', district: 'Indore', state: 'Madhya Pradesh',
    lat: 22.9774, lng: 75.8285, landSizeAcres: 1.8,
    primaryCrops: ['Soybean', 'Wheat', 'Onion'], reputationScore: 5.0,
    totalOrdersFulfilled: 14, disputeCount: 0,
  },
];

export const SEED_BUYERS: BuyerProfile[] = [
  { id: 'buyer_1', phone: '+91 99801 88301', name: 'Vikram Joshi', role: 'buyer',
    language: 'en', createdAt: '2026-07-15', buyerType: 'processor',
    businessName: 'Sahyadri Agro Processing Ltd.', district: 'Pune', state: 'Maharashtra', verified: true },
  { id: 'buyer_2', phone: '+91 98450 33412', name: 'Anand Murthy', role: 'buyer',
    language: 'en', createdAt: '2026-07-28', buyerType: 'retailer',
    businessName: 'FreshBasket Supermarkets', district: 'Bengaluru Urban', state: 'Karnataka', verified: true },
  { id: 'buyer_3', phone: '+91 98721 99014', name: 'Kavita Chawla', role: 'buyer',
    language: 'hi', createdAt: '2026-08-01', buyerType: 'fpo',
    businessName: 'KisanVikas Farmer Producer Co.', district: 'Indore', state: 'Madhya Pradesh', verified: true },
];

export const SEED_LOGISTICS: LogisticsProfile[] = [
  { id: 'logistics_1', phone: '+91 98224 55198', name: 'Kailash Shinde', role: 'logistics',
    language: 'mr', createdAt: '2026-07-10', vehicleType: 'Bolero Pickup (1.5 Ton)',
    capacityKg: 1500, serviceRadiusKm: 180, district: 'Nashik', state: 'Maharashtra',
    lat: 20.0059, lng: 73.79, activeDeliveries: 2 },
  { id: 'logistics_2', phone: '+91 94488 77123', name: 'Manjunath Reddy', role: 'logistics',
    language: 'te', createdAt: '2026-07-12', vehicleType: 'Tata Ace (1 Ton)',
    capacityKg: 1000, serviceRadiusKm: 120, district: 'Kolar', state: 'Karnataka',
    lat: 13.1367, lng: 78.1344, activeDeliveries: 1 },
];

export const SEED_LISTINGS: Listing[] = [
  { id: 'list_1', anonSellerId: 'FARM-88214', farmerRealName: 'Ramesh Patil', farmerPhone: '+91 98231 44521',
    crop: 'Tomato', variety: 'Abhinav Hybrid (Table Grade)', quantityKg: 2000, priceExpected: 18,
    priceAi: { min: 16, fair: 18.5, max: 21, confidence: 94, historicalMandiAvg: 17.8, trend: 'rising', benchmarkMandi: 'Pimpalgaon APMC, Nashik' },
    quality: { grade: 'A', confidence: 96, colorUniformity: 92, surfaceDefects: 4, firmnessScore: 88, freshnessLabel: 'Harvested this morning', notes: 'Deep red color, optimal skin thickness for distance transit.' },
    imageUrl: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80',
    village: 'Pimpalgaon', district: 'Nashik', state: 'Maharashtra', lat: 20.1634, lng: 73.9856,
    status: 'active', createdVia: 'voice', createdAt: '2026-09-17 08:30 AM', farmerReputation: 4.9, distanceKm: 34, matchScore: 98 },
  { id: 'list_2', anonSellerId: 'FARM-88214', farmerRealName: 'Ramesh Patil', farmerPhone: '+91 98231 44521',
    crop: 'Onion', variety: 'Nashik Red (Medium)', quantityKg: 3500, priceExpected: 24,
    priceAi: { min: 22, fair: 24.5, max: 27, confidence: 91, historicalMandiAvg: 23.9, trend: 'rising', benchmarkMandi: 'Lasalgaon Mandi' },
    quality: { grade: 'A', confidence: 93, colorUniformity: 90, surfaceDefects: 6, firmnessScore: 94, freshnessLabel: 'Well-cured outer skin', notes: 'Dry neck, tight papery skin, suitable for 60+ days warehouse shelf life.' },
    imageUrl: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80',
    village: 'Pimpalgaon', district: 'Nashik', state: 'Maharashtra', lat: 20.1634, lng: 73.9856,
    status: 'active', createdVia: 'text', createdAt: '2026-09-16 04:15 PM', farmerReputation: 4.9, distanceKm: 34, matchScore: 92 },
  { id: 'list_3', anonSellerId: 'FARM-34902', farmerRealName: 'Lakshmi Devi', farmerPhone: '+91 94481 22910',
    crop: 'Tomato', variety: 'Kashi Vishesh', quantityKg: 1200, priceExpected: 17,
    priceAi: { min: 15, fair: 17.2, max: 19.5, confidence: 95, historicalMandiAvg: 16.8, trend: 'stable', benchmarkMandi: 'Kolar APMC Market' },
    quality: { grade: 'A', confidence: 94, colorUniformity: 91, surfaceDefects: 5, firmnessScore: 89, freshnessLabel: 'Grade A Farmgate harvest', notes: 'Firm texture, minimal handling marks, excellent processing and consumer table quality.' },
    imageUrl: 'https://images.unsplash.com/photo-1546470427-e26264be0b11?w=600&auto=format&fit=crop&q=80',
    village: 'Mulbagal', district: 'Kolar', state: 'Karnataka', lat: 13.1633, lng: 78.3962,
    status: 'active', createdVia: 'voice', createdAt: '2026-09-17 07:10 AM', farmerReputation: 4.8, distanceKm: 65, matchScore: 95 },
];

export const SEED_ORDERS: Order[] = [
  { id: 'ORD-1092', listingId: 'list_1', crop: 'Tomato', variety: 'Abhinav Hybrid', quantityKg: 1000,
    agreedPricePerKg: 18, totalAmount: 18000, buyerId: 'buyer_1', buyerName: 'Vikram Joshi',
    buyerType: 'Food Processor (Sahyadri Agro)', buyerPhone: '+91 99801 88301',
    anonSellerId: 'FARM-88214', sellerRealName: 'Ramesh Patil', sellerPhone: '+91 98231 44521',
    sellerVillage: 'Pimpalgaon', sellerDistrict: 'Nashik', sellerState: 'Maharashtra',
    status: 'in_transit', identityRevealed: true, identityRevealedAt: '2026-09-17 09:12 AM',
    deliveryAddress: 'Plot 44, Food Park MIDC, Pune, Maharashtra', poolId: 'POOL-NSK-01',
    createdAt: '2026-09-17 08:50 AM' },
];

export const SEED_LOGISTICS_POOLS: LogisticsPool[] = [
  { id: 'POOL-NSK-01', clusterRegion: 'Nashik - Pimpalgaon to Pune MIDC Corridor', date: '2026-09-17',
    orderIds: ['ORD-1092'], orders: [
      { id: 'ORD-1092', listingId: 'list_1', crop: 'Tomato', variety: 'Abhinav Hybrid', quantityKg: 1000,
        agreedPricePerKg: 18, totalAmount: 18000, buyerId: 'buyer_1', buyerName: 'Vikram Joshi',
        buyerType: 'Food Processor (Sahyadri Agro)', buyerPhone: '+91 99801 88301',
        anonSellerId: 'FARM-88214', sellerRealName: 'Ramesh Patil', sellerPhone: '+91 98231 44521',
        sellerVillage: 'Pimpalgaon', sellerDistrict: 'Nashik', sellerState: 'Maharashtra',
        status: 'in_transit', identityRevealed: true, identityRevealedAt: '2026-09-17 09:12 AM',
        deliveryAddress: 'Plot 44, Food Park MIDC, Pune, Maharashtra', poolId: 'POOL-NSK-01',
        createdAt: '2026-09-17 08:50 AM' },
    ],
    routeStops: [
      { id: 'STOP-P-ORD-1092-0', orderId: 'ORD-1092', stopType: 'pickup',
        locationName: 'Pimpalgaon', farmerOrBuyerName: 'Ramesh Patil', contactPhone: '+91 98231 44521',
        crop: 'Tomato', quantityKg: 1000, lat: 20.1634, lng: 73.9856, completed: true },
      { id: 'STOP-D-ORD-1092-0', orderId: 'ORD-1092', stopType: 'dropoff',
        locationName: 'Plot 44, Food Park MIDC', farmerOrBuyerName: 'Vikram Joshi', contactPhone: '+91 99801 88301',
        crop: 'Tomato', quantityKg: 1000, lat: 18.5204, lng: 73.8567, completed: false },
    ], totalWeightKg: 1000, maxCapacityKg: 3000,
    vehicleAssigned: 'Eicher 14ft (MH-15-EG-4912)', driverName: 'Kailash Shinde', driverPhone: '+91 98224 55198',
    status: 'in_transit', fuelSavingsPercent: 34, carbonReducedKg: 82.5 },
];

export const SEED_NOTIFICATIONS: AppNotification[] = [
  { id: 'NOTIF-01', timestamp: '10 mins ago', title: 'Order Confirmed: Identity Revealed!',
    message: 'Buyer Vikram Joshi confirmed Order #ORD-1092.', roleTarget: 'farmer', read: false, type: 'reveal' },
  { id: 'NOTIF-02', timestamp: '25 mins ago', title: 'Logistics Pickup Pool Scheduled',
    message: 'Vehicle Bolero Pickup assigned to POOL-NSK-01.', roleTarget: 'farmer', read: false, type: 'logistics' },
];

export const SEED_GOV_SCHEMES: GovScheme[] = [
  // ── Direct Benefit ──────────────────────────────────────────────────────────
  { id: 'SCHEME-01', title: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    description: 'Direct income support of ₹6,000 per year in 3 equal installments to all eligible farmer families owning up to 2 hectares of land.',
    benefitAmount: '₹6,000 / year', category: 'Direct Benefit',
    eligibleStates: ['All India'], eligibleCrops: ['All Crops'], maxLandAcreage: 10,
    sourceUrl: 'https://pmkisan.gov.in', applicationDeadline: 'Continuous' },

  { id: 'SCHEME-07', title: 'Kisan Credit Card (KCC)',
    description: 'Short-term credit at reduced interest rates (2–4% effective) for crop cultivation, post-harvest, allied activities. Covers working capital needs up to ₹3 Lakh with interest subvention.',
    benefitAmount: 'Credit up to ₹3 Lakh at 4% interest', category: 'Credit',
    eligibleStates: ['All India'], eligibleCrops: ['All Crops'],
    sourceUrl: 'https://www.nabard.org/kcc', applicationDeadline: 'Continuous' },

  { id: 'SCHEME-08', title: 'PM Annadata Aay Sanrakshan Abhiyan (PM-AASHA)',
    description: 'Price support, price deficiency payment, and private procurement to ensure farmers get MSP for notified oilseeds, pulses and copra.',
    benefitAmount: 'MSP difference paid directly', category: 'Direct Benefit',
    eligibleStates: ['All India'], eligibleCrops: ['Soybean', 'Wheat'],
    sourceUrl: 'https://pmaasha.org.in', applicationDeadline: 'Active during procurement season' },

  { id: 'SCHEME-09', title: 'PM Kisan Maandhan Yojana (PM-KMY) — Farmer Pension',
    description: 'Voluntary pension scheme for small and marginal farmers aged 18–40, providing ₹3,000/month pension on reaching age 60. Government matches farmer contribution.',
    benefitAmount: '₹3,000 / month pension after age 60', category: 'Direct Benefit',
    eligibleStates: ['All India'], eligibleCrops: ['All Crops'], maxLandAcreage: 5,
    sourceUrl: 'https://pmkmy.gov.in', applicationDeadline: 'Continuous' },

  // ── Crop Insurance ───────────────────────────────────────────────────────────
  { id: 'SCHEME-02', title: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
    description: 'Comprehensive crop insurance at low premium rates (2% for Kharif, 1.5% for Rabi, 5% for horticulture) for crop failure due to natural calamities, pests, and diseases.',
    benefitAmount: 'Up to ₹2 Lakh per season', category: 'Crop Insurance',
    eligibleStates: ['All India'], eligibleCrops: ['Tomato', 'Onion', 'Potato', 'Wheat', 'Soybean', 'Green Chilli'],
    sourceUrl: 'https://pmfby.gov.in', applicationDeadline: 'Kharif: June–July / Rabi: Nov–Dec' },

  { id: 'SCHEME-10', title: 'Restructured Weather Based Crop Insurance Scheme (RWBCIS)',
    description: 'Insurance based on weather parameters (rainfall, temperature, humidity) as proxy for crop yield. Faster claims settlement — no crop cutting experiments required.',
    benefitAmount: 'Market-rate sum insured up to ₹1.5 Lakh/ha', category: 'Crop Insurance',
    eligibleStates: ['Maharashtra', 'Punjab', 'Karnataka', 'Madhya Pradesh', 'Telangana', 'UP'],
    eligibleCrops: ['Tomato', 'Grapes', 'Onion', 'Potato', 'Green Chilli'],
    sourceUrl: 'https://pmfby.gov.in/rwbcis', applicationDeadline: 'Kharif: June / Rabi: Oct–Nov' },

  // ── Credit ───────────────────────────────────────────────────────────────────
  { id: 'SCHEME-11', title: 'Agriculture Infrastructure Fund (AIF)',
    description: 'Medium to long-term debt financing at 3% interest subvention for post-harvest management infrastructure, cold chain, primary processing, grading & packaging units.',
    benefitAmount: '3% interest subvention up to ₹2 Crore', category: 'Credit',
    eligibleStates: ['All India'], eligibleCrops: ['All Crops'],
    sourceUrl: 'https://agriinfra.dac.gov.in', applicationDeadline: 'Open Scheme (2020–2032)' },

  { id: 'SCHEME-12', title: 'NABARD — Warehouse Infrastructure Fund (WIF)',
    description: 'Low-interest loans for creating and upgrading scientific storage and warehouse facilities at the farm level. Helps farmers avoid distress sales.',
    benefitAmount: 'Loan up to ₹50 Lakh at 8% p.a.', category: 'Credit',
    eligibleStates: ['All India'], eligibleCrops: ['All Crops'],
    sourceUrl: 'https://www.nabard.org/wif', applicationDeadline: 'Continuous' },

  // ── Infrastructure & Equipment ───────────────────────────────────────────────
  { id: 'SCHEME-03', title: 'Sub-Mission on Agricultural Mechanisation (SMAM)',
    description: 'Capital subsidy of 40–50% for purchase of farm machinery and implements. Promotes custom hiring centers to share equipment access among small farmers.',
    benefitAmount: '40–50% subsidy on farm machinery', category: 'Infrastructure & Equipment',
    eligibleStates: ['All India'], eligibleCrops: ['All Crops'],
    sourceUrl: 'https://agrimachinery.nic.in', applicationDeadline: 'Annual — check state agriculture dept.' },

  { id: 'SCHEME-06', title: 'National Horticulture Mission (NHM)',
    description: 'Financial assistance for area expansion of fruits and vegetables, seed production, post-harvest management (cold stores, ripening chambers, pack-houses) and market linkages.',
    benefitAmount: '50–75% subsidy on inputs & infrastructure', category: 'Infrastructure & Equipment',
    eligibleStates: ['Maharashtra', 'Punjab', 'Madhya Pradesh', 'Telangana', 'Karnataka', 'UP'],
    eligibleCrops: ['Tomato', 'Onion', 'Potato', 'Grapes', 'Green Chilli'],
    sourceUrl: 'https://nhb.gov.in', applicationDeadline: 'Seasonal — check state horticulture department' },

  { id: 'SCHEME-13', title: 'Integrated Pack House Development Scheme',
    description: 'Capital subsidy for setting up pack houses, primary processing centres, and integrated cold chain infrastructure for horticulture produce.',
    benefitAmount: '35% capital subsidy up to ₹35 Lakh', category: 'Infrastructure & Equipment',
    eligibleStates: ['Maharashtra', 'Karnataka', 'Punjab', 'UP', 'Madhya Pradesh'],
    eligibleCrops: ['Tomato', 'Onion', 'Potato', 'Grapes', 'Green Chilli'],
    sourceUrl: 'https://midh.gov.in', applicationDeadline: 'Rolling basis — MIDH portal' },

  // ── Solar & Irrigation ───────────────────────────────────────────────────────
  { id: 'SCHEME-04', title: 'PM Kusum (Solar Pump Scheme)',
    description: 'Financial support for solarising agriculture pump sets. Reduces diesel pump dependency, cuts irrigation costs, and enables additional income by selling surplus solar power to grid.',
    benefitAmount: '90% subsidy on solar pump installation', category: 'Solar & Irrigation',
    eligibleStates: ['Maharashtra', 'Punjab', 'Madhya Pradesh', 'Telangana', 'Karnataka'],
    eligibleCrops: ['All Crops'], maxLandAcreage: 5,
    sourceUrl: 'https://mnre.gov.in/solar/pm-kusum', applicationDeadline: 'Rolling Applications' },

  { id: 'SCHEME-14', title: 'Pradhan Mantri Krishi Sinchayee Yojana (PMKSY) — Drip & Sprinkler',
    description: 'Subsidies of 55–90% on drip irrigation and sprinkler systems for water-efficient irrigation. Helps small farmers shift from flood irrigation to precision water use.',
    benefitAmount: '55–90% subsidy on drip/sprinkler systems', category: 'Solar & Irrigation',
    eligibleStates: ['All India'], eligibleCrops: ['Tomato', 'Onion', 'Potato', 'Green Chilli', 'Grapes', 'All Crops'],
    sourceUrl: 'https://pmksy.gov.in', applicationDeadline: 'Continuous — state agriculture dept.' },

  // ── Organic Subsidy ───────────────────────────────────────────────────────────
  { id: 'SCHEME-05', title: 'Paramparagat Krishi Vikas Yojana (PKVY)',
    description: 'Promotes organic farming through cluster-based approach with financial support of ₹50,000/hectare over 3 years for organic input procurement, certification, and marketing.',
    benefitAmount: '₹50,000 / hectare / 3 years', category: 'Organic Subsidy',
    eligibleStates: ['All India'], eligibleCrops: ['Tomato', 'Onion', 'Potato', 'Soybean', 'Wheat'],
    minLandAcreage: 0.5,
    sourceUrl: 'https://pgsindia-ncof.gov.in/pkvy', applicationDeadline: 'March 31 each year' },

  // ── Market Linkage ────────────────────────────────────────────────────────────
  { id: 'SCHEME-15', title: 'e-NAM (National Agriculture Market) Integration',
    description: 'Online trading portal for agricultural commodities linking APMC mandis for transparent price discovery and direct access to buyers across India.',
    benefitAmount: 'Free registration; transparent better price discovery', category: 'Market Linkage',
    eligibleStates: ['All India'], eligibleCrops: ['Tomato', 'Onion', 'Potato', 'Wheat', 'Soybean', 'All Crops'],
    sourceUrl: 'https://www.enam.gov.in', applicationDeadline: 'Continuous' },

  { id: 'SCHEME-16', title: 'APMC Farmer Registration & Direct Buyer Access',
    description: 'State APMC reforms enabling farmers to sell directly to licensed buyers, FPOs, and processors outside mandi premises without additional market fees.',
    benefitAmount: 'Eliminates 2–4% mandi commission charges', category: 'Market Linkage',
    eligibleStates: ['Maharashtra', 'Karnataka', 'Madhya Pradesh', 'UP', 'Punjab'],
    eligibleCrops: ['All Crops'],
    sourceUrl: 'https://agrimarket.nic.in', applicationDeadline: 'Continuous' },

  // ── Training & Extension ──────────────────────────────────────────────────────
  { id: 'SCHEME-17', title: 'Kisan Call Centre (KCC) & ATMA Scheme',
    description: 'Free agricultural advice via 1800-180-1551 helpline in local languages. Block-level Agricultural Technology Management Agency (ATMA) provides training and extension services.',
    benefitAmount: 'Free advisory and training', category: 'Training & Extension',
    eligibleStates: ['All India'], eligibleCrops: ['All Crops'],
    sourceUrl: 'https://dacfw.nic.in/atma', applicationDeadline: 'Continuous' },

  { id: 'SCHEME-18', title: 'National Mission for Sustainable Agriculture (NMSA) — Soil Health Card',
    description: 'Free soil health testing and card issuance with crop-wise fertilizer recommendations. Helps reduce input costs by 10–20% through precision fertilizer use.',
    benefitAmount: 'Free soil testing + fertilizer recommendations', category: 'Training & Extension',
    eligibleStates: ['All India'], eligibleCrops: ['All Crops'],
    sourceUrl: 'https://soilhealth.dac.gov.in', applicationDeadline: 'Continuous' },
];


export const SEED_RISK_ASSESSMENTS: Record<string, RiskAssessment> = {
  farmer_1: { farmerId: 'farmer_1', riskScore: 16, riskTier: 'Low Risk', eligibleAdvanceAmount: 45000, factors: { priceVolatilityIndex: 'Low', fulfillmentRate: '100%', avgQualityGrade: 'Grade A', reputationScore: 4.9, landHoldingWeight: '3.5 Acres' }, explanation: 'Outstanding 100% delivery fulfillment track record.' },
};

export const SEED_SAFETY_REPORTS: SafetyReport[] = [
  {
    id: 'REP-701',
    reporterUserId: undefined,
    reporterName: undefined,
    isAnonymous: true,
    reportedEntityName: 'Local Arhat / Mandi Sub-broker (Pimpalgaon)',
    category: 'Underpricing & Cartel',
    description: 'Local middleman cartel colluded to offer ₹8/kg for export quality tomatoes when digital Mandi average was ₹18/kg. Threatened to block unloading at yard.',
    status: 'reviewing',
    resolutionNotes: 'Assigned to Agricultural Marketing Board representative. Seller shifted listing to direct buyer on Vasundhara platform.',
    createdAt: '2026-09-16 09:30 AM',
  },
  {
    id: 'REP-702',
    reporterUserId: 'farmer_2',
    reporterName: 'Lakshmi Devi',
    isAnonymous: false,
    reportedEntityName: 'Unregistered Transport Agent',
    category: 'Broker Exploitation',
    description: 'Demanded additional ₹2000 cash gate surcharge beyond agreed freight contract during vehicle arrival.',
    status: 'resolved',
    resolutionNotes: 'Transport agent blacklisted from Vasundhara carrier network. Verified carrier assigned.',
    createdAt: '2026-09-14 04:15 PM',
  },
];
