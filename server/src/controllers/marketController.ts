import { Request, Response } from 'express';
import { getPriceRecommendationService } from '../services/marketService.js';

export async function getPriceRecommendation(req: Request, res: Response): Promise<void> {
  try {
    const { crop, region } = req.query;

    if (!crop || typeof crop !== 'string') {
      res.status(400).json({ error: 'crop query parameter is required' });
      return;
    }

    const result = getPriceRecommendationService(crop, (region as string) || 'Nashik');
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get price recommendation', details: String(error) });
  }
}
