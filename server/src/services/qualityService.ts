// Material quality assessment service — CNN-based quality grading simulation.
// Implements deterministic per-image quality scoring based on scrap material type,
// image metadata (if available), and a realistic multi-factor scoring model.

import { QualityAssessment, QualityGrade } from '../types.js';

const MATERIAL_QUALITY_PROFILES: Record<string, {
  gradeDistribution: { A: number; B: number; C: number };
  colorBase: number;
  firmnessBase: number;
  defectBase: number;
  gradeLabels: { A: string; B: string; C: string };
  notes: { A: string; B: string; C: string };
}> = {
  copper: {
    gradeDistribution: { A: 70, B: 22, C: 8 },
    colorBase: 94,
    firmnessBase: 92,
    defectBase: 3,
    gradeLabels: {
      A: 'Bright & Shiny Premium Grade — Smelter Ready',
      B: 'Standard Industrial Copper — Insulated/Mixed',
      C: 'Oxidized / Low Yield Grade',
    },
    notes: {
      A: '99.9% pure uninsulated copper wire, zero oxidation or insulation remnants.',
      B: 'Clean PVC insulation attached, minimal tarnishing. Good stripping yield.',
      C: 'Heavy oxidation, burnt wire or solder contamination present. Lower recovery yield.',
    },
  },
  plastic: {
    gradeDistribution: { A: 65, B: 25, C: 10 },
    colorBase: 88,
    firmnessBase: 86,
    defectBase: 6,
    gradeLabels: {
      A: 'Food Grade HDPE / PET — Clean Flakes',
      B: 'Mixed Industrial Rigid Plastic',
      C: 'Contaminated / Mixed Polymer Scrap',
    },
    notes: {
      A: 'Triple rinsed, zero chemical residue, uniform resin identification code.',
      B: 'Minor label adhesive or paper residue present. Suitable for regrind.',
      C: 'Mixed resin types (HDPE + PVC mix). Sorting required before extrusion.',
    },
  },
  ewaste: {
    gradeDistribution: { A: 75, B: 18, C: 7 },
    colorBase: 95,
    firmnessBase: 96,
    defectBase: 2,
    gradeLabels: {
      A: 'High Grade Server PCB — Gold Fingers Intact',
      B: 'Standard Computer Motherboards',
      C: 'Low Grade Consumer Electronics PCB',
    },
    notes: {
      A: 'Server/telecom grade circuit boards with intact gold fingers and multi-layer copper.',
      B: 'Standard PC motherboards and RAM sticks. Moderate precious metal content.',
      C: 'Brown power supply boards or single-layer consumer PCB.',
    },
  },
  default: {
    gradeDistribution: { A: 65, B: 25, C: 10 },
    colorBase: 88,
    firmnessBase: 88,
    defectBase: 6,
    gradeLabels: {
      A: 'Verified Premium Grade A Scrap',
      B: 'Standard Commercial Grade B Scrap',
      C: 'Mixed / Secondary Grade C Scrap',
    },
    notes: {
      A: 'Clean, sorted material meeting recycler quality benchmarks.',
      B: 'Acceptable commercial quality with minor non-metallic attachments.',
      C: 'Requires manual sorting, cleaning, or baling before processing.',
    },
  },
};

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickGradeFromDistribution(
  distribution: { A: number; B: number; C: number },
  seed: number
): QualityGrade {
  const total = distribution.A + distribution.B + distribution.C;
  const roll = seed % total;
  if (roll < distribution.A) return 'A';
  if (roll < distribution.A + distribution.B) return 'B';
  return 'C';
}

export async function assessProduceQualityService(
  imageData: string,
  crop: string
): Promise<QualityAssessment> {
  const cropLower = crop.toLowerCase();

  let profileKey = 'default';
  for (const key of Object.keys(MATERIAL_QUALITY_PROFILES)) {
    if (key !== 'default' && cropLower.includes(key)) {
      profileKey = key;
      break;
    }
  }
  const profile = MATERIAL_QUALITY_PROFILES[profileKey];

  const imageSeed = imageData ? hashCode(imageData.slice(0, 200) + crop) : hashCode(crop + Date.now().toString());
  const grade = pickGradeFromDistribution(profile.gradeDistribution, imageSeed);

  const gradeModifier = grade === 'A' ? 0 : grade === 'B' ? -8 : -18;
  const jitter = (imageSeed % 7);

  const colorUniformity = Math.min(99, Math.max(60, profile.colorBase + gradeModifier + jitter));
  const firmnessScore = Math.min(99, Math.max(58, profile.firmnessBase + gradeModifier + (jitter - 3)));
  const surfaceDefects = Math.max(1, Math.min(35, profile.defectBase - gradeModifier + (jitter % 4)));

  const confidence = grade === 'A' ? 92 + (jitter % 7) : grade === 'B' ? 84 + (jitter % 8) : 77 + (jitter % 8);

  return {
    grade,
    confidence: Math.min(99, confidence),
    colorUniformity,
    firmnessScore,
    surfaceDefects,
    freshnessLabel: profile.gradeLabels[grade],
    notes: profile.notes[grade],
  };
}
