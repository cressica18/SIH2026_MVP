import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { SEED_GOV_SCHEMES } from '../data/seedData.js';
import { matchSchemesForFarmer } from '../services/schemeService.js';

export function getSchemes(req: Request, res: Response): void {
  const category = req.query.category as string | undefined;

  let schemes = SEED_GOV_SCHEMES;
  if (category) {
    schemes = SEED_GOV_SCHEMES.filter(
      (s) => s.category.toLowerCase() === category.toLowerCase()
    );
  }

  res.json({ schemes, total: schemes.length });
}

export function getMatchedSchemesForFarmer(req: AuthRequest, res: Response): void {
  const { farmerId } = req.params;
  const category = req.query.category as string | undefined;

  try {
    const matched = matchSchemesForFarmer(farmerId, category);
    res.json({
      farmerId,
      schemes: matched,
      total: matched.length,
      category: category ?? 'all',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    if (msg.includes('not found')) {
      res.status(404).json({ error: msg });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
