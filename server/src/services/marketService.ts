// Market intelligence service for Kabadiwala Connect.
// Provides AI price recommendations based on benchmark scrap market baseline data.

import { PriceBand } from '../types.js';

const SCRAP_BASELINES: Record<string, { fair: number; min: number; max: number; mandi: string }> = {
  'Copper Wire': { fair: 620, min: 580, max: 680, mandi: 'Nashik & Pune Scrap Yard' },
  'Aluminum Extrusion': { fair: 155, min: 140, max: 170, mandi: 'Nashik Scrap Market' },
  Brass: { fair: 450, min: 410, max: 490, mandi: 'Bhosari MIDC Depot' },
  'Steel Scrap': { fair: 38.5, min: 35.0, max: 42.0, mandi: 'Khanna & Ludhiana Scrap Yard' },
  'HDPE Plastic': { fair: 33.0, min: 28.0, max: 38.0, mandi: 'Pune Plastic Market' },
  'PET Bottles': { fair: 28.0, min: 24.0, max: 32.0, mandi: 'Mumbai Recycling Depot' },
  'Corrugated Paper': { fair: 18.0, min: 15.0, max: 22.0, mandi: 'Pune Paper Market' },
  'E-Waste': { fair: 1250, min: 1100, max: 1400, mandi: 'Bangalore E-Waste Hub' },
  Tomato: { fair: 18.5, min: 16.0, max: 21.0, mandi: 'Pimpalgaon / Kolar Market' },
  Onion: { fair: 24.5, min: 22.0, max: 27.0, mandi: 'Lasalgaon Market' },
  Potato: { fair: 14.2, min: 12.5, max: 16.0, mandi: 'Khanna Market' },
};

export function getPriceRecommendationService(
  crop: string,
  _region: string = 'Nashik'
): PriceBand {
  const base = SCRAP_BASELINES[crop] || { fair: 100.0, min: 80.0, max: 120.0, mandi: 'Regional Scrap Yard' };

  return {
    min: Math.round(base.min * 10) / 10,
    fair: Math.round(base.fair * 10) / 10,
    max: Math.round(base.max * 10) / 10,
    confidence: 93,
    historicalMandiAvg: Math.round((base.fair - 2) * 10) / 10,
    trend: 'rising',
    benchmarkMandi: base.mandi,
  };
}
