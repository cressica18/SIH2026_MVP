// Voice listing extraction service.
// Provides the business logic for extracting structured listing data from voice transcripts.
// This mirrors the client-side extractVoiceListing logic but can be replaced with
// real AI/ML model inference (e.g., Gemini Speech-to-Text + NER).

import { VoiceExtractionResult } from '../types.js';

const CROP_DICTIONARY: Record<string, { standardName: string; defaultVariety: string }> = {
  tomato: { standardName: 'Tomato', defaultVariety: 'Abhinav Hybrid' },
  tamatar: { standardName: 'Tomato', defaultVariety: 'Kashi Vishesh' },
  tamato: { standardName: 'Tomato', defaultVariety: 'Table Grade Hybrid' },
  onion: { standardName: 'Onion', defaultVariety: 'Nashik Red' },
  pyaz: { standardName: 'Onion', defaultVariety: 'Nashik Red' },
  kanda: { standardName: 'Onion', defaultVariety: 'Garwa / Phursungi' },
  ulli: { standardName: 'Onion', defaultVariety: 'Bellary Medium' },
  potato: { standardName: 'Potato', defaultVariety: 'Kufri Jyoti' },
  aloo: { standardName: 'Potato', defaultVariety: 'Kufri Jyoti' },
  batata: { standardName: 'Potato', defaultVariety: 'Table Grade' },
  bangaladumpa: { standardName: 'Potato', defaultVariety: 'Kufri Pukhraj' },
  chilli: { standardName: 'Green Chilli', defaultVariety: 'G4 Hot Pepper' },
  mirchi: { standardName: 'Green Chilli', defaultVariety: 'G4 Hot Pepper' },
  mirch: { standardName: 'Green Chilli', defaultVariety: 'Teja Hot' },
  pachimirapa: { standardName: 'Green Chilli', defaultVariety: 'Byadgi Green' },
  wheat: { standardName: 'Wheat', defaultVariety: 'Sharbati Gold' },
  gehu: { standardName: 'Wheat', defaultVariety: 'Sharbati Gold' },
  gahuk: { standardName: 'Wheat', defaultVariety: 'Lokwan' },
  kanak: { standardName: 'Wheat', defaultVariety: 'PBW 550' },
  soybean: { standardName: 'Soybean', defaultVariety: 'JS-9560' },
  soya: { standardName: 'Soybean', defaultVariety: 'JS-9560' },
  grapes: { standardName: 'Grapes', defaultVariety: 'Thomson Seedless' },
  angoor: { standardName: 'Grapes', defaultVariety: 'Thomson Seedless' },
  draksh: { standardName: 'Grapes', defaultVariety: 'Sharad Seedless' },
};

export async function extractVoiceListingService(
  transcript: string,
  _language: string
): Promise<VoiceExtractionResult> {
  const text = transcript.toLowerCase();

  // 1. Detect crop
  let detectedCrop = 'Tomato';
  let detectedVariety = 'Abhinav Hybrid';
  let cropFound = false;
  for (const [key, cropInfo] of Object.entries(CROP_DICTIONARY)) {
    if (text.includes(key)) {
      detectedCrop = cropInfo.standardName;
      detectedVariety = cropInfo.defaultVariety;
      cropFound = true;
      break;
    }
  }

  // 2. Detect quantity
  let quantityKg = 1000;
  const numMatches = text.match(/(\d+(?:\.\d+)?)\s*(quintal|kuntal|qtl|kg|kilo|ton|tonne)?/i);

  const wordMap: Record<string, number> = {
    one: 1, ek: 1, two: 2, do: 2, three: 3, teen: 3, char: 4, four: 4, paanch: 5,
    five: 5, ten: 10, das: 10, twenty: 20, fifty: 50, hundred: 100, sau: 100,
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
    for (const [word, val] of Object.entries(wordMap)) {
      if (text.includes(word)) {
        if (text.includes('quintal')) quantityKg = val * 100;
        else if (text.includes('ton')) quantityKg = val * 1000;
        else if (text.includes('kilo') || text.includes('kg')) quantityKg = val;
        else quantityKg = val <= 10 ? val * 100 : val;
        break;
      }
    }
  }

  // 3. Detect expected price
  let priceExpected = 18;
  const priceMatches = text.match(/(?:rupees?|rupaye?|₹)\s*(\d+(?:\.\d+)?)/i);
  if (priceMatches && priceMatches[1]) {
    const val = parseFloat(priceMatches[1]);
    if (val > 0 && val < 500) priceExpected = val;
  } else if (text.includes('atharah')) priceExpected = 18;
  else if (text.includes('bees') || text.includes('twenty')) priceExpected = 20;
  else if (text.includes('chaubees') || text.includes('chovis')) priceExpected = 24;
  else if (text.includes('chauda') || text.includes('fourteen')) priceExpected = 14;

  const quantityMatched = numMatches !== null;
  const priceMatched = priceMatches !== null;
  const confidence = cropFound ? (quantityMatched && priceMatched ? 94 : 75) : 35;

  return {
    crop: detectedCrop,
    variety: detectedVariety,
    quantityKg: Math.max(50, Math.round(quantityKg)),
    priceExpected: Math.max(5, Math.round(priceExpected * 10) / 10),
    confidence,
    rawTranscript: transcript,
  };
}
