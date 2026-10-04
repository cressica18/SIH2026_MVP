// Voice lot extraction service for Kabadiwala Connect.
// Extracts structured scrap lot data (material, category, weight in kg, expected price) from speech transcripts.

import { VoiceExtractionResult } from '../types.js';

const MATERIAL_DICTIONARY: Record<string, { standardName: string; category: string; defaultVariety: string }> = {
  copper: { standardName: 'Copper Wire', category: 'metal', defaultVariety: 'Bright & Shiny Heavy Grade' },
  tamba: { standardName: 'Copper Wire', category: 'metal', defaultVariety: 'Bright & Shiny Heavy Grade' },
  tambya: { standardName: 'Copper Wire', category: 'metal', defaultVariety: 'Bright & Shiny Heavy Grade' },
  aluminum: { standardName: 'Aluminum Extrusion', category: 'metal', defaultVariety: '6063 Alloy Scrap' },
  eluminium: { standardName: 'Aluminum Extrusion', category: 'metal', defaultVariety: '6063 Alloy Scrap' },
  pittul: { standardName: 'Brass', category: 'metal', defaultVariety: 'Honey Grade Scrap' },
  brass: { standardName: 'Brass', category: 'metal', defaultVariety: 'Honey Grade Scrap' },
  steel: { standardName: 'Steel Scrap', category: 'metal', defaultVariety: 'HMS 1 Heavy Melting' },
  loha: { standardName: 'Steel Scrap', category: 'metal', defaultVariety: 'HMS 1 Heavy Melting' },
  plastic: { standardName: 'HDPE Plastic', category: 'plastic', defaultVariety: 'Blue Drum Flakes' },
  pet: { standardName: 'PET Bottles', category: 'plastic', defaultVariety: 'Baled PET Flakes' },
  hdpe: { standardName: 'HDPE Plastic', category: 'plastic', defaultVariety: 'Blue Drum Flakes' },
  paper: { standardName: 'Corrugated Paper', category: 'paper', defaultVariety: 'Baled OCC Grade 11' },
  cardboard: { standardName: 'Corrugated Paper', category: 'paper', defaultVariety: 'Baled OCC Grade 11' },
  raddi: { standardName: 'Corrugated Paper', category: 'paper', defaultVariety: 'Mixed Paper & Cardboard' },
  ewaste: { standardName: 'E-Waste', category: 'ewaste', defaultVariety: 'Server PCB Boards' },
  pcb: { standardName: 'E-Waste', category: 'ewaste', defaultVariety: 'Server PCB Boards' },
  computer: { standardName: 'E-Waste', category: 'ewaste', defaultVariety: 'Mixed Computer Boards' },
};

export async function extractVoiceListingService(
  transcript: string,
  _language: string
): Promise<VoiceExtractionResult> {
  const text = transcript.toLowerCase();

  // 1. Detect material
  let detectedMaterial = 'Copper Wire';
  let detectedVariety = 'Bright & Shiny Heavy Grade';
  let materialFound = false;

  for (const [key, matInfo] of Object.entries(MATERIAL_DICTIONARY)) {
    if (text.includes(key)) {
      detectedMaterial = matInfo.standardName;
      detectedVariety = matInfo.defaultVariety;
      materialFound = true;
      break;
    }
  }

  // 2. Detect weight (kg or tons)
  let quantityKg = 500;
  const numMatches = text.match(/(\d+(?:\.\d+)?)\s*(quintal|kuntal|qtl|kg|kilo|ton|tonne)?/i);

  const wordMap: Record<string, number> = {
    one: 1, ek: 1, two: 2, do: 2, three: 3, teen: 3, char: 4, four: 4, paanch: 5,
    five: 5, ten: 10, das: 10, twenty: 20, fifty: 50, hundred: 100, sau: 100,
    'panch sau': 500, 'paanch sau': 500, 'five hundred': 500,
  };

  if (numMatches && numMatches[1]) {
    const val = parseFloat(numMatches[1]);
    const unit = (numMatches[2] || '').toLowerCase();
    if (unit.includes('quintal') || unit.includes('kuntal') || unit.includes('qtl')) {
      quantityKg = val * 100;
    } else if (unit.includes('ton')) {
      quantityKg = val * 1000;
    } else {
      quantityKg = val;
    }
  } else {
    for (const [word, val] of Object.entries(wordMap)) {
      if (text.includes(word)) {
        if (text.includes('ton')) quantityKg = val * 1000;
        else if (text.includes('kilo') || text.includes('kg')) quantityKg = val;
        else quantityKg = val;
        break;
      }
    }
  }

  // 3. Detect expected price per kg
  let priceExpected = 620;
  const priceMatches = text.match(/(?:rupees?|rupaye?|₹)\s*(\d+(?:\.\d+)?)/i);
  if (priceMatches && priceMatches[1]) {
    const val = parseFloat(priceMatches[1]);
    if (val > 0) priceExpected = val;
  } else if (text.includes('chaar sau pachas') || text.includes('450')) priceExpected = 450;
  else if (text.includes('chhe sau bees') || text.includes('620')) priceExpected = 620;

  const quantityMatched = numMatches !== null;
  const priceMatched = priceMatches !== null;
  const confidence = materialFound ? (quantityMatched && priceMatched ? 94 : 78) : 40;

  return {
    crop: detectedMaterial,
    variety: detectedVariety,
    quantityKg: Math.max(10, Math.round(quantityKg)),
    priceExpected: Math.max(1, Math.round(priceExpected * 10) / 10),
    confidence,
    rawTranscript: transcript,
  };
}
