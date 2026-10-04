import { store } from '../data/store.js';
import { MarketInsight, MarketPricePoint, Listing, Order } from '@shared/types.ts';

const SEED_MARKET_INSIGHTS: MarketInsight[] = [
  {
    crop: 'Copper Wire',
    currentAvgPrice: 620.0,
    lastWeekAvgPrice: 590.0,
    changePercent: +5.1,
    trend: 'rising',
    history: [
      { date: 'Aug 10', price: 560, arrivalsTons: 42 },
      { date: 'Aug 17', price: 575, arrivalsTons: 40 },
      { date: 'Aug 24', price: 580, arrivalsTons: 38 },
      { date: 'Aug 31', price: 590, arrivalsTons: 39 },
      { date: 'Sep 07', price: 605, arrivalsTons: 35 },
      { date: 'Sep 14', price: 615, arrivalsTons: 31 },
      { date: 'Sep 17', price: 620, arrivalsTons: 29 },
    ],
    volatilityIndex: 'Moderate',
    forecastNextWeek: 635.0,
    aiSummary: 'Copper wire prices across industrial recycling hubs are appreciating (+5.1%) due to increased foundry demand for Grade A heavy scrap. Collectors pooling lots are realizing higher bulk premiums.',
  },
  {
    crop: 'Aluminum Extrusion',
    currentAvgPrice: 155.0,
    lastWeekAvgPrice: 148.0,
    changePercent: +4.7,
    trend: 'rising',
    history: [
      { date: 'Aug 10', price: 140, arrivalsTons: 95 },
      { date: 'Aug 17', price: 142, arrivalsTons: 92 },
      { date: 'Aug 24', price: 145, arrivalsTons: 90 },
      { date: 'Aug 31', price: 148, arrivalsTons: 88 },
      { date: 'Sep 07', price: 150, arrivalsTons: 86 },
      { date: 'Sep 14', price: 153, arrivalsTons: 82 },
      { date: 'Sep 17', price: 155, arrivalsTons: 79 },
    ],
    volatilityIndex: 'Low',
    forecastNextWeek: 158.0,
    aiSummary: 'Aluminum extrusion scrap shows steady price strengthening as industrial fabrication demand rises across Pune & Bhosari MIDC hubs.',
  },
  {
    crop: 'HDPE Plastic',
    currentAvgPrice: 33.0,
    lastWeekAvgPrice: 32.5,
    changePercent: +1.5,
    trend: 'stable',
    history: [
      { date: 'Aug 10', price: 32.0, arrivalsTons: 110 },
      { date: 'Aug 17', price: 32.2, arrivalsTons: 115 },
      { date: 'Aug 24', price: 32.5, arrivalsTons: 118 },
      { date: 'Aug 31', price: 32.5, arrivalsTons: 116 },
      { date: 'Sep 07', price: 32.5, arrivalsTons: 115 },
      { date: 'Sep 14', price: 32.8, arrivalsTons: 114 },
      { date: 'Sep 17', price: 33.0, arrivalsTons: 113 },
    ],
    volatilityIndex: 'Low',
    forecastNextWeek: 33.5,
    aiSummary: 'HDPE plastic prices in Western belts remain remarkably stable backed by consistent recycling plant intake.',
  },
  {
    crop: 'E-Waste',
    currentAvgPrice: 1250.0,
    lastWeekAvgPrice: 1180.0,
    changePercent: +5.9,
    trend: 'rising',
    history: [
      { date: 'Aug 10', price: 1100, arrivalsTons: 35 },
      { date: 'Aug 17', price: 1120, arrivalsTons: 34 },
      { date: 'Aug 24', price: 1150, arrivalsTons: 33 },
      { date: 'Aug 31', price: 1180, arrivalsTons: 32 },
      { date: 'Sep 07', price: 1200, arrivalsTons: 31 },
      { date: 'Sep 14', price: 1230, arrivalsTons: 29 },
      { date: 'Sep 17', price: 1250, arrivalsTons: 28 },
    ],
    volatilityIndex: 'Moderate',
    forecastNextWeek: 1280.0,
    aiSummary: 'Authorized recyclers in Bangalore and Pune are bidding aggressively for pooled e-waste PCB and circuit board lots.',
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
    'Copper Wire': 620.0,
    'Aluminum Extrusion': 155.0,
    Brass: 450.0,
    'Steel Scrap': 38.5,
    'HDPE Plastic': 33.0,
    'Corrugated Paper': 18.0,
    'E-Waste': 1250.0,
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
  const crops = ['Copper Wire', 'Aluminum Extrusion', 'Brass', 'Steel Scrap', 'HDPE Plastic', 'Corrugated Paper', 'E-Waste'];
  return crops.map(c => buildDashboard(region || 'All India', c));
}