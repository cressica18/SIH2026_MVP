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
    status: 'confirmed', identityRevealed: true, identityRevealedAt: '2026-09-17 09:12 AM',
    deliveryAddress: 'Plot 44, Food Park MIDC, Pune, Maharashtra', poolId: 'POOL-NSK-01',
    createdAt: '2026-09-17 08:50 AM' },
];

export const SEED_LOGISTICS_POOLS: LogisticsPool[] = [
  { id: 'POOL-NSK-01', clusterRegion: 'Nashik - Pimpalgaon to Pune MIDC Corridor', date: '2026-09-17',
    orderIds: ['ORD-1092', 'ORD-1088'], orders: [], routeStops: [], totalWeightKg: 2500, maxCapacityKg: 3000,
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
  { id: 'SCHEME-01', title: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)', description: 'Direct income support of ₹6,000 per year in 3 equal installments.', benefitAmount: '₹6,000 / year', category: 'Direct Benefit', eligibleStates: ['All India'], eligibleCrops: ['All Crops'], maxLandAcreage: 10, sourceUrl: 'https://pmkisan.gov.in', applicationDeadline: 'Continuous' },
];

export const SEED_RISK_ASSESSMENTS: Record<string, RiskAssessment> = {
  farmer_1: { farmerId: 'farmer_1', riskScore: 16, riskTier: 'Low Risk', eligibleAdvanceAmount: 45000, factors: { priceVolatilityIndex: 'Low', fulfillmentRate: '100%', avgQualityGrade: 'Grade A', reputationScore: 4.9, landHoldingWeight: '3.5 Acres' }, explanation: 'Outstanding 100% delivery fulfillment track record.' },
};
