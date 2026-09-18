import { Request, Response } from 'express';
import { assessProduceQualityService } from '../services/qualityService.js';

export async function assessQuality(req: Request, res: Response): Promise<void> {
  try {
    const { crop, image } = req.body;

    if (!crop || typeof crop !== 'string') {
      res.status(400).json({ error: 'crop is required and must be a string' });
      return;
    }

    const result = await assessProduceQualityService(image || '', crop);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to assess quality', details: String(error) });
  }
}
