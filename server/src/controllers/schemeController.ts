import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { SEED_GOV_SCHEMES } from '../data/seedData.js';
import { matchSchemesForFarmer } from '../services/schemeService.js';
import { notifySchemeMatch } from '../services/notificationService.js';

/**
 * GET /api/schemes
 * Returns all schemes. Optional query param: ?category=<category>
 */
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

/**
 * GET /api/schemes/match/:farmerId
 * Returns schemes matched to the specified farmer using rule-based eligibility.
 * Optional query param: ?category=<category>
 *
 * Authorization: farmer can only view their own matches; admin can view any.
 */
export function getMatchedSchemesForFarmer(req: AuthRequest, res: Response): void {
  const { farmerId } = req.params;
  const category = req.query.category as string | undefined;

  // Authorization: farmers can only see their own matched schemes
  if (req.user?.role === 'farmer' && req.user.userId !== farmerId) {
    res.status(403).json({ error: 'Forbidden: you can only view your own scheme matches' });
    return;
  }

  try {
    const matched = matchSchemesForFarmer(farmerId, category);
    
    // Send notification if there are new matches (simple approach for MVP)
    if (matched.length > 0) {
      const schemeTitles = matched.map(s => s.title);
      notifySchemeMatch(farmerId, schemeTitles);
    }
    
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