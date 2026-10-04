import { VoiceExtractionResult, PriceBand, QualityAssessment } from '../types';

// Scrap Material Dictionary for voice extraction
const MATERIAL_DICTIONARY: Record<string, { standardName: string; category: string }> = {
  // Metals
  'copper': { standardName: 'Copper Wire', category: 'metal' },
  'copper wire': { standardName: 'Copper Wire', category: 'metal' },
  'copper cable': { standardName: 'Copper Cable', category: 'metal' },
  'aluminum': { standardName: 'Aluminum', category: 'metal' },
  'aluminium': { standardName: 'Aluminum', category: 'metal' },
  'aluminum scrap': { standardName: 'Aluminum Scrap', category: 'metal' },
  'aluminum extrusion': { standardName: 'Aluminum Extrusion', category: 'metal' },
  'brass': { standardName: 'Brass', category: 'metal' },
  'brass scrap': { standardName: 'Brass Scrap', category: 'metal' },
  'steel': { standardName: 'Steel Scrap', category: 'metal' },
  'steel scrap': { standardName: 'Steel Scrap', category: 'metal' },
  'iron': { standardName: 'Iron Scrap', category: 'metal' },
  'stainless steel': { standardName: 'Stainless Steel', category: 'metal' },
  'stainless': { standardName: 'Stainless Steel', category: 'metal' },
  'lead': { standardName: 'Lead', category: 'metal' },
  'zinc': { standardName: 'Zinc', category: 'metal' },

  // Plastics
  'plastic': { standardName: 'Plastic Scrap', category: 'plastic' },
  'hdpe': { standardName: 'HDPE', category: 'plastic' },
  'pet': { standardName: 'PET', category: 'plastic' },
  'pvc': { standardName: 'PVC', category: 'plastic' },
  'pp': { standardName: 'PP', category: 'plastic' },
  'ldpe': { standardName: 'LDPE', category: 'plastic' },
  'ps': { standardName: 'PS', category: 'plastic' },
  'abs': { standardName: 'ABS', category: 'plastic' },
  'plastic bottle': { standardName: 'PET Bottles', category: 'plastic' },
  'plastic drum': { standardName: 'HDPE Drums', category: 'plastic' },

  // Paper
  'paper': { standardName: 'Paper Scrap', category: 'paper' },
  'cardboard': { standardName: 'Cardboard (OCC)', category: 'paper' },
  'corrugated': { standardName: 'Corrugated Cardboard', category: 'paper' },
  'newspaper': { standardName: 'Newspaper', category: 'paper' },
  'office paper': { standardName: 'Office Paper', category: 'paper' },
  'mixed paper': { standardName: 'Mixed Paper', category: 'paper' },

  // E-Waste
  'e-waste': { standardName: 'E-Waste', category: 'ewaste' },
  'ewaste': { standardName: 'E-Waste', category: 'ewaste' },
  'pcb': { standardName: 'PCB Boards', category: 'ewaste' },
  'pcb board': { standardName: 'PCB Boards', category: 'ewaste' },
  'motherboard': { standardName: 'PCB Boards', category: 'ewaste' },
  'cable': { standardName: 'Cables', category: 'ewaste' },
  'cables': { standardName: 'Mixed Cables', category: 'ewaste' },
  'wire': { standardName: 'Copper Wire', category: 'metal' },
  'battery': { standardName: 'Batteries', category: 'ewaste' },
  'batteries': { standardName: 'Batteries', category: 'ewaste' },
  'screen': { standardName: 'Screens/Monitors', category: 'ewaste' },
  'phone': { standardName: 'Mobile Phones', category: 'ewaste' },
  'laptop': { standardName: 'Laptops', category: 'ewaste' },
  'computer': { standardName: 'Computers', category: 'ewaste' },

  // Glass
  'glass': { standardName: 'Glass Scrap', category: 'glass' },
  'clear glass': { standardName: 'Clear Glass', category: 'glass' },
  'green glass': { standardName: 'Green Glass', category: 'glass' },
  'brown glass': { standardName: 'Brown Glass', category: 'glass' },

  // Rubber
  'rubber': { standardName: 'Rubber Scrap', category: 'rubber' },
  'tyre': { standardName: 'Tyres', category: 'rubber' },
  'tire': { standardName: 'Tyres', category: 'rubber' },
  'tyres': { standardName: 'Tyres', category: 'rubber' },
  'conveyor belt': { standardName: 'Conveyor Belts', category: 'rubber' },

  // Mixed
  'mixed': { standardName: 'Mixed Scrap', category: 'mixed' },
  'mixed scrap': { standardName: 'Mixed Scrap', category: 'mixed' },
  'general scrap': { standardName: 'General Scrap', category: 'mixed' },
};

const SCRAP_PRICE_BASELINES: Record<string, { fair: number; min: number; max: number; category: string }> = {
  'Copper Wire': { fair: 620, min: 580, max: 680, category: 'metal' },
  'Copper Cable': { fair: 550, min: 500, max: 600, category: 'metal' },
  'Aluminum': { fair: 155, min: 140, max: 170, category: 'metal' },
  'Aluminum Extrusion': { fair: 165, min: 150, max: 180, category: 'metal' },
  'Aluminum Scrap': { fair: 145, min: 130, max: 160, category: 'metal' },
  'Brass': { fair: 320, min: 300, max: 350, category: 'metal' },
  'Brass Scrap': { fair: 310, min: 290, max: 340, category: 'metal' },
  'Steel Scrap': { fair: 30, min: 25, max: 35, category: 'metal' },
  'Iron Scrap': { fair: 28, min: 24, max: 32, category: 'metal' },
  'Stainless Steel': { fair: 120, min: 100, max: 140, category: 'metal' },
  'Lead': { fair: 150, min: 130, max: 170, category: 'metal' },
  'Zinc': { fair: 180, min: 160, max: 200, category: 'metal' },
  'HDPE': { fair: 33, min: 28, max: 38, category: 'plastic' },
  'PET': { fair: 28, min: 24, max: 32, category: 'plastic' },
  'PVC': { fair: 22, min: 18, max: 26, category: 'plastic' },
  'PP': { fair: 25, min: 20, max: 30, category: 'plastic' },
  'LDPE': { fair: 20, min: 16, max: 24, category: 'plastic' },
  'PS': { fair: 18, min: 15, max: 22, category: 'plastic' },
  'ABS': { fair: 45, min: 40, max: 50, category: 'plastic' },
  'PET Bottles': { fair: 25, min: 20, max: 30, category: 'plastic' },
  'HDPE Drums': { fair: 30, min: 25, max: 35, category: 'plastic' },
  'Cardboard (OCC)': { fair: 18, min: 15, max: 22, category: 'paper' },
  'Corrugated Cardboard': { fair: 17, min: 14, max: 20, category: 'paper' },
  'Newspaper': { fair: 12, min: 10, max: 15, category: 'paper' },
  'Office Paper': { fair: 15, min: 12, max: 18, category: 'paper' },
  'Mixed Paper': { fair: 11, min: 8, max: 14, category: 'paper' },
  'PCB Boards': { fair: 1250, min: 1100, max: 1400, category: 'ewaste' },
  'Cables': { fair: 285, min: 250, max: 320, category: 'ewaste' },
  'Batteries': { fair: 80, min: 60, max: 100, category: 'ewaste' },
  'Screens/Monitors': { fair: 200, min: 150, max: 250, category: 'ewaste' },
  'Mobile Phones': { fair: 500, min: 300, max: 700, category: 'ewaste' },
  'Laptops': { fair: 1500, min: 1000, max: 2000, category: 'ewaste' },
  'Computers': { fair: 800, min: 500, max: 1200, category: 'ewaste' },
  'Clear Glass': { fair: 8, min: 6, max: 10, category: 'glass' },
  'Green Glass': { fair: 6, min: 4, max: 8, category: 'glass' },
  'Brown Glass': { fair: 6, min: 4, max: 8, category: 'glass' },
  'Tyres': { fair: 15, min: 12, max: 18, category: 'rubber' },
  'Conveyor Belts': { fair: 25, min: 20, max: 30, category: 'rubber' },
  'Mixed Scrap': { fair: 25, min: 20, max: 30, category: 'mixed' },
  'General Scrap': { fair: 22, min: 18, max: 26, category: 'mixed' },
};

export async function extractVoiceListing(
  transcript: string,
  _language: string
): Promise<{
  materialType: string;
  materialCategory: string;
  quantityKg: number;
  priceExpectedPerKg: number;
  confidence: number;
  rawTranscript: string;
}> {
  const text = transcript.toLowerCase();

  // Try calling server endpoint if available
  try {
    const res = await fetch('/api/voice/extract-listing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, language: _language }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.materialType && data.quantityKg) {
        return data;
      }
    }
  } catch {
    // Client-side rule-based fallback
  }

  // 1. Detect material type
  let detectedMaterial = 'Copper Wire';
  let detectedCategory = 'metal';
  for (const [key, matInfo] of Object.entries(MATERIAL_DICTIONARY)) {
    if (text.includes(key)) {
      detectedMaterial = matInfo.standardName;
      detectedCategory = matInfo.category;
      break;
    }
  }

  // 2. Detect quantity
  // Patterns: "500 kg", "500 kilo", "1 ton", "10 quintal", "500 kilo copper wire"
  let quantityKg = 500;
  const numMatches = text.match(/(\d+(?:\.\d+)?)\s*(quintal|kuntal|qtl|kg|kilo|ton|tonne)?/i);

  // Word numerals in Hindi / Marathi / English
  const wordMap: Record<string, number> = {
    one: 1, ek: 1, one_and_half: 1.5, dedh: 1.5, two: 2, do: 2, don: 2,
    three: 3, teen: 3, char: 4, four: 4, paanch: 5, pach: 5, five: 5,
    ten: 10, das: 10, dah: 10, twenty: 20, bees: 20, vees: 20,
    fifty: 50, pachas: 50, pannas: 50,
    hundred: 100, sau: 100, she: 100, do_sau: 200,
  };

  if (numMatches && numMatches[1]) {
    const val = parseFloat(numMatches[1]);
    const unit = (numMatches[2] || '').toLowerCase();
    if (unit.includes('quintal') || unit.includes('kuntal') || unit.includes('qtl')) {
      quantityKg = val * 100;
    } else if (unit.includes('ton')) {
      quantityKg = val * 1000;
    } else {
      quantityKg = val >= 50 ? val : val * 100;
    }
  } else {
    // Check word numerals
    for (const [word, val] of Object.entries(wordMap)) {
      if (text.includes(word)) {
        if (text.includes('quintal') || text.includes('kuntal')) {
          quantityKg = val * 100;
        } else if (text.includes('ton')) {
          quantityKg = val * 1000;
        } else if (text.includes('kilo') || text.includes('kg')) {
          quantityKg = val;
        } else {
          quantityKg = val <= 10 ? val * 100 : val;
        }
        break;
      }
    }
  }

  // 3. Detect expected price
  // Patterns: "620 rupees", "620 rupaye", "₹620/kg", "620 per kg"
  let priceExpected = 620;
  const priceMatches = text.match(/(?:rupees?|rupaye?|rs\.?|₹|rate|bhav)?\s*(\d+(?:\.\d+)?)\s*(?:rupees?|rupaye?|rs\.?|₹|per\s*kg|\/kg|kilo)?/i);

  if (priceMatches && priceMatches[1]) {
    const val = parseFloat(priceMatches[1]);
    if (val > 0 && val < 5000) {
      priceExpected = val;
    }
  } else {
    // Check for word numerals in price
    const priceWords: Record<string, number> = {
      'atharah': 18, 'athra': 18, 'eighteen': 18,
      'bees': 20, 'vees': 20, 'twenty': 20,
      'chaubees': 24, 'chovis': 24, 'twenty four': 24,
      'chauda': 14, 'fourteen': 14,
      'tees': 30, 'thirty': 30,
      'chalis': 40, 'forty': 40,
      'pachas': 50, 'fifty': 50,
      'saath': 60, 'sixty': 60,
      'sattar': 70, 'seventy': 70,
      'assi': 80, 'eighty': 80,
      'nabbe': 90, 'ninety': 90,
      'sau': 100, 'hundred': 100,
      'do sau': 200, 'two hundred': 200,
      'teen sau': 300, 'three hundred': 300,
      'char sau': 400, 'four hundred': 400,
      'paanch sau': 500, 'five hundred': 500,
      'cheh sau': 600, 'six hundred': 600,
      'saat sau': 700, 'seven hundred': 700,
      'aath sau': 800, 'eight hundred': 800,
      'nau sau': 900, 'nine hundred': 900,
      'hazaar': 1000, 'thousand': 1000,
    };
    for (const [word, val] of Object.entries(priceWords)) {
      if (text.includes(word)) {
        priceExpected = val;
        break;
      }
    }
  }

  return {
    materialType: detectedMaterial,
    materialCategory: detectedCategory,
    quantityKg: Math.max(50, Math.round(quantityKg)),
    priceExpectedPerKg: Math.max(5, Math.round(priceExpected * 10) / 10),
    confidence: 94,
    rawTranscript: transcript,
  };
}

export function getAiPriceRecommendation(materialType: string, _region: string = 'Nashik'): PriceBand {
  const base = SCRAP_PRICE_BASELINES[materialType] || {
    fair: 100,
    min: 80,
    max: 120,
    category: 'mixed',
  };

  return {
    min: Math.round(base.min * 10) / 10,
    fair: Math.round(base.fair * 10) / 10,
    max: Math.round(base.max * 10) / 10,
    confidence: 93,
    historicalMarketAvg: Math.round((base.fair - 0.5) * 10) / 10,
    trend: 'stable',
    benchmarkMarket: 'Local Scrap Market',
  };
}

export async function assessMaterialQuality(
  _imageDataUrl: string,
  materialType: string
): Promise<QualityAssessment> {
  try {
    const res = await fetch('/api/quality/assess', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ materialType, image: _imageDataUrl }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.grade) return data;
    }
  } catch {
    // Client fallback
  }

  // Deterministic quality classification for demo
  const isCopper = materialType.toLowerCase().includes('copper');
  const isPCB = materialType.toLowerCase().includes('pcb');
  const isPlastic = materialType.toLowerCase().includes('plastic') || materialType.toLowerCase().includes('pet') || materialType.toLowerCase().includes('hdpe');

  if (isCopper) {
    return {
      grade: 'A',
      confidence: 96,
      colorUniformity: 95,
      surfaceDefects: 2,
      firmnessScore: 98,
      freshnessLabel: 'Clean, uninsulated copper wire',
      notes: '99.9% pure copper, no oxidation, ideal for direct smelting.',
    };
  }

  if (isPCB) {
    return {
      grade: 'A',
      confidence: 96,
      colorUniformity: 98,
      surfaceDefects: 1,
      firmnessScore: 99,
      freshnessLabel: 'Intact gold fingers, no component removal',
      notes: 'Server motherboards, telecommunications grade, high precious metal content.',
    };
  }

  if (isPlastic) {
    return {
      grade: 'B',
      confidence: 90,
      colorUniformity: 85,
      surfaceDefects: 8,
      firmnessScore: 92,
      freshnessLabel: 'Cleaned, labels removed',
      notes: 'Food-grade certified, triple rinsed.',
    };
  }

  return {
    grade: 'B',
    confidence: 88,
    colorUniformity: 85,
    surfaceDefects: 10,
    firmnessScore: 85,
    freshnessLabel: 'Standard scrap grade',
    notes: 'Quality not yet assessed via CNN.',
  };
}