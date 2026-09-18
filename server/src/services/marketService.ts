// Market intelligence service.
// Provides AI price recommendations based on Agmarknet mandi baseline data.
// Replace with real AI model or external API calls later.

import { PriceBand } from '../types.js';

const MANDI_BASELINES: Record<string, { fair: number; min: number; max: number; mandi: string }> = {
  Tomato: { fair: 18.5, min: 16.0, max: 21.0, mandi: 'Pimpalgaon / Kolar APMC' },
  Onion: { fair: 24.5, min: 22.0, max: 27.0, mandi: 'Lasalgaon Mandi' },
  Potato: { fair: 14.2, min: 12.5, max: 16.0, mandi: 'Khanna / Agra Mandi' },
  'Green Chilli': { fair: 43.0, min: 38.0, max: 48.0, mandi: 'Kolar / Guntur APMC' },
  Wheat: { fair: 28.5, min: 26.0, max: 31.0, mandi: 'Khanna / Indore Mandi' },
  Soybean: { fair: 46.8, min: 43.5, max: 49.5, mandi: 'Indore Mandi' },
  Grapes: { fair: 62.0, min: 55.0, max: 70.0, mandi: 'Nashik APMC' },
};

export function getPriceRecommendationService(
  crop: string,
  _region: string = 'Nashik'
): PriceBand {
  const base = MANDI_BASELINES[crop] || { fair: 20.0, min: 17.0, max: 23.0, mandi: 'Regional District APMC' };

  return {
    min: Math.round(base.min * 10) / 10,
    fair: Math.round(base.fair * 10) / 10,
    max: Math.round(base.max * 10) / 10,
    confidence: 93,
    historicalMandiAvg: Math.round((base.fair - 0.5) * 10) / 10,
    trend: 'rising',
    benchmarkMandi: base.mandi,
  };
}
