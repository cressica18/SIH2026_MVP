import { Request, Response } from 'express';
import { SEED_GOV_SCHEMES } from '../data/seedData.js';

export function getSchemes(_req: Request, res: Response): void {
  // Can be extended later to take farmer profile and filter matching schemes,
  // but for the MVP we return the static curated seed data.
  res.json({ schemes: SEED_GOV_SCHEMES });
}
