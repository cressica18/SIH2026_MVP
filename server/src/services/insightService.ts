import { store } from '../data/store.js';
import { MarketInsight, MarketPricePoint, Listing, Order } from '@shared/types.ts';

const SEED_MARKET_INSIGHTS: MarketInsight[] = [
  {
    crop: 'Tomato',
    currentAvgPrice: 18.2,
    lastWeekAvgPrice: 15.6,
    changePercent: +16.7,
    trend: 'rising',
    history: [
      { date: 'Aug 10', price: 13.5, arrivalsTons: 420 },
      { date: 'Aug 17', price: 14.2, arrivalsTons: 405 },
      { date: 'Aug 24', price: 14.8, arrivalsTons: 380 },
      { date: 'Aug 31', price: 15.1, arrivalsTons: 390 },
      { date: 'Sep 07', price: 15.6, arrivalsTons: 350 },
      { date: 'Sep 14', price: 17.5, arrivalsTons: 310 },
      { date: 'Sep 17', price: 18.2, arrivalsTons: 295 },
    ],
    volatilityIndex: 'Moderate',
    forecastNextWeek: 19.5,
    aiSummary: 'Tomato prices across Western & Southern corridors are appreciating (+16.7%) due to heavy monsoon showers in Karnataka impacting field picking. Processors in Pune and Bengaluru are actively building inventory. Farmers are advised to harvest Grade A lots for direct buyer dispatch.',
  },
  {
    crop: 'Onion',
    currentAvgPrice: 24.5,
    lastWeekAvgPrice: 22.8,
    changePercent: +7.4,
    trend: 'rising',
    history: [
      { date: 'Aug 10', price: 20.2, arrivalsTons: 950 },
      { date: 'Aug 17', price: 21.0, arrivalsTons: 920 },
      { date: 'Aug 24', price: 21.5, arrivalsTons: 900 },
      { date: 'Aug 31', price: 22.1, arrivalsTons: 880 },
      { date: 'Sep 07', price: 22.8, arrivalsTons: 860 },
      { date: 'Sep 14', price: 23.9, arrivalsTons: 820 },
      { date: 'Sep 17', price: 24.5, arrivalsTons: 790 },
    ],
    volatilityIndex: 'Low',
    forecastNextWeek: 25.8,
    aiSummary: 'Nashik red onion stocks in storage sheds demonstrate steady price strengthening as arrivals taper down. Wholesale and retail demand remains buoyant across metropolitan centers.',
  },
  {
    crop: 'Potato',
    currentAvgPrice: 14.2,
    lastWeekAvgPrice: 14.5,
    changePercent: -2.1,
    trend: 'stable',
    history: [
      { date: 'Aug 10', price: 15.0, arrivalsTons: 1100 },
      { date: 'Aug 17', price: 14.8, arrivalsTons: 1150 },
      { date: 'Aug 24', price: 14.6, arrivalsTons: 1180 },
      { date: 'Aug 31', price: 14.5, arrivalsTons: 1160 },
      { date: 'Sep 07', price: 14.5, arrivalsTons: 1150 },
      { date: 'Sep 14', price: 14.3, arrivalsTons: 1140 },
      { date: 'Sep 17', price: 14.2, arrivalsTons: 1130 },
    ],
    volatilityIndex: 'Low',
    forecastNextWeek: 14.0,
    aiSummary: 'Potato prices in Northern belts (Punjab, UP) remain remarkably stable backed by sufficient cold-store release schedules. Ideal for forward contract bulk commitments.',
  },
  {
    crop: 'Soybean',
    currentAvgPrice: 46.8,
    lastWeekAvgPrice: 44.5,
    changePercent: +5.2,
    trend: 'rising',
    history: [
      { date: 'Aug 10', price: 42.0, arrivalsTons: 350 },
      { date: 'Aug 17', price: 42.8, arrivalsTons: 340 },
      { date: 'Aug 24', price: 43.5, arrivalsTons: 330 },
      { date: 'Aug 31', price: 44.0, arrivalsTons: 320 },
      { date: 'Sep 07', price: 44.5, arrivalsTons: 310 },
      { date: 'Sep 14', price: 45.8, arrivalsTons: 290 },
      { date: 'Sep 17', price: 46.8, arrivalsTons: 280 },
    ],
    volatilityIndex: 'Moderate',
    forecastNextWeek: 48.0,
    aiSummary: 'Soybean crushing mills in Madhya Pradesh and Maharashtra are competing for high-oil Grade A varieties. Farmgate price realization is outpacing local APMC rates by 8-12%.',
  },
];

export interface DashboardData {
  region: string;
  crop: string;
  avgPriceSeries: MarketPricePoint[];
  trend: 'rising' | 'stable' | 'falling';
  topDemandCrops: { crop: string; totalQuantityKg: number; orderCount: number }[];
  summaryText: string;
  generatedAt: string;
  dataSource: 'aggregated_mvp_data';
}

function computeRollingAverage(prices: number[], window: number = 3): number[] {
  const result: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = prices.slice(start, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    result.push(Math.round(avg * 10) / 10);
  }
  return result;
}

function detectTrend(prices: number[]): 'rising' | 'stable' | 'falling' {
  if (prices.length < 2) return 'stable';
  const recent = prices.slice(-3);
  const older = prices.slice(0, 3);
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  const changePct = ((recentAvg - olderAvg) / olderAvg) * 100;
  if (changePct > 5) return 'rising';
  if (changePct < -5) return 'falling';
  return 'stable';
}

function computeVolatilityIndex(prices: number[]): 'Low' | 'Moderate' | 'High' {
  if (prices.length < 2) return 'Low';
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / prices.length;
  const cv = Math.sqrt(variance) / avg;
  if (cv < 0.05) return 'Low';
  if (cv < 0.15) return 'Moderate';
  return 'High';
}

function forecastNextWeek(prices: number[], trend: 'rising' | 'stable' | 'falling'): number {
  if (prices.length === 0) return 20;
  const lastPrice = prices[prices.length - 1];
  const avgChange = prices.length >= 2
    ? (prices[prices.length - 1] - prices[0]) / (prices.length - 1)
    : 0;
  let forecast = lastPrice + avgChange;
  if (trend === 'rising') forecast = Math.max(forecast, lastPrice * 1.02);
  if (trend === 'falling') forecast = Math.min(forecast, lastPrice * 0.98);
  return Math.round(forecast * 10) / 10;
}

function getTopDemandCrops(orders: Order[]): { crop: string; totalQuantityKg: number; orderCount: number }[] {
  const cropStats: Record<string, { totalQuantityKg: number; orderCount: number }> = {};
  for (const order of orders) {
    if (!cropStats[order.crop]) {
      cropStats[order.crop] = { totalQuantityKg: 0, orderCount: 0 };
    }
    cropStats[order.crop].totalQuantityKg += order.quantityKg;
    cropStats[order.crop].orderCount += 1;
  }
  return Object.entries(cropStats)
    .map(([crop, stats]) => ({ crop, ...stats }))
    .sort((a, b) => b.totalQuantityKg - a.totalQuantityKg)
    .slice(0, 5);
}

function generateAISummary(
  crop: string,
  region: string,
  currentAvgPrice: number,
  lastWeekAvgPrice: number,
  changePercent: number,
  trend: 'rising' | 'stable' | 'falling',
  topDemandCrops: { crop: string; totalQuantityKg: number; orderCount: number }[],
  volatilityIndex: 'Low' | 'Moderate' | 'High',
  forecastNextWeek: number,
  avgPriceSeries: MarketPricePoint[],
  listingsCount: number,
  ordersCount: number
): string {
  const trendText = trend === 'rising' ? 'appreciating' : trend === 'falling' ? 'declining' : 'holding steady';
  const changeDirection = changePercent >= 0 ? '+' : '';
  const demandCropNames = topDemandCrops.map(c => c.crop).join(', ') || 'no recent orders';
  const regionText = region !== 'All India' ? `in ${region}` : 'across major corridors';

  const summary = `${crop} prices ${regionText} are ${trendText} (${changeDirection}${changePercent.toFixed(1)}% week-over-week) with ${volatilityIndex.toLowerCase()} volatility. ` +
    `The 7-week trajectory shows a ${trend} trend from ₹${avgPriceSeries[0]?.price.toFixed(1) || lastWeekAvgPrice} to ₹${currentAvgPrice}/kg. ` +
    `Top demanded crops by volume: ${demandCropNames}. ` +
    `Current listings: ${listingsCount} active batches; recent settled orders: ${ordersCount}. ` +
    `AI forecast for next week: ₹${forecastNextWeek}/kg. ` +
    `${trend === 'rising' ? 'Farmers advised to hold Grade A lots for better realization.' : trend === 'falling' ? 'Consider forward contracts to lock in prices.' : 'Stable window suitable for planned harvesting and staggered sales.'}`;

  return summary;
}

function getCropPriceHistory(crop: string): MarketPricePoint[] {
  const seedInsight = SEED_MARKET_INSIGHTS.find(m => m.crop === crop);
  if (seedInsight && seedInsight.history.length > 0) {
    return seedInsight.history;
  }

  const basePrices: Record<string, number> = {
    Tomato: 18.5,
    Onion: 24.5,
    Potato: 14.2,
    'Green Chilli': 43.0,
    Wheat: 28.5,
    Soybean: 46.8,
    Grapes: 62.0,
  };
  const base = basePrices[crop] || 20.0;
  const dates = ['Aug 10', 'Aug 17', 'Aug 24', 'Aug 31', 'Sep 07', 'Sep 14', 'Sep 17'];
  return dates.map((date, i) => ({
    date,
    price: Math.round((base * (0.9 + i * 0.02)) * 10) / 10,
    arrivalsTons: Math.round(500 * (1.1 - i * 0.03)),
  }));
}

export function buildDashboard(
  region: string = 'All India',
  crop?: string
): DashboardData {
  const allListings = store.listings;
  const allOrders = store.orders;

  const filteredListings = crop
    ? allListings.filter(l => l.crop === crop)
    : allListings;

  const filteredOrders = crop
    ? allOrders.filter(o => o.crop === crop)
    : allOrders;

  const targetCrop = crop || (filteredListings.length > 0 ? filteredListings[0].crop : 'Tomato');

  const priceHistory = getCropPriceHistory(targetCrop);
  const prices = priceHistory.map(p => p.price);
  const currentAvgPrice = prices[prices.length - 1] || 0;
  const lastWeekAvgPrice = prices[Math.max(0, prices.length - 2)] || currentAvgPrice;
  const changePercent = lastWeekAvgPrice > 0
    ? ((currentAvgPrice - lastWeekAvgPrice) / lastWeekAvgPrice) * 100
    : 0;
  const trend = detectTrend(prices);
  const volatilityIndex = computeVolatilityIndex(prices);
  const forecast = forecastNextWeek(prices, trend);
  const topDemandCrops = getTopDemandCrops(filteredOrders);

  const summaryText = generateAISummary(
    targetCrop,
    region,
    currentAvgPrice,
    lastWeekAvgPrice,
    changePercent,
    trend,
    topDemandCrops,
    volatilityIndex,
    forecast,
    priceHistory,
    filteredListings.length,
    filteredOrders.length
  );

  return {
    region,
    crop: targetCrop,
    avgPriceSeries: priceHistory,
    trend,
    topDemandCrops,
    summaryText,
    generatedAt: new Date().toISOString(),
    dataSource: 'aggregated_mvp_data',
  };
}

export function getDashboardForCrop(crop: string, region?: string): DashboardData {
  return buildDashboard(region || 'All India', crop);
}

export function getAllCropsDashboard(region?: string): DashboardData[] {
  const crops = ['Tomato', 'Onion', 'Potato', 'Green Chilli', 'Wheat', 'Soybean', 'Grapes'];
  return crops.map(c => buildDashboard(region || 'All India', c));
}