// Quality assessment controller.
// POST /api/quality/assess — accepts:
//   1. JSON body: { crop: string, image?: string (base64 or URL) }
//   2. multipart/form-data: crop field + image file upload
//
// Returns QualityAssessment with grade, confidence, and sub-scores.

import { Request, Response } from 'express';
import { assessProduceQualityService } from '../services/qualityService.js';

export async function assessQuality(req: Request, res: Response): Promise<void> {
  try {
    let crop: string | undefined;
    let imageData: string = '';

    // Support both JSON body and multipart form-data
    if (req.is('multipart/form-data')) {
      // Multer would normally handle this; for MVP we read from body fields
      crop = req.body?.crop;
      // If file was uploaded via multer (future integration), it would be in req.file
      // For now, read base64 from the form field if present
      imageData = req.body?.image || '';
    } else {
      // Standard JSON body
      crop = req.body?.crop;
      imageData = req.body?.image || '';
    }

    if (!crop || typeof crop !== 'string') {
      res.status(400).json({ error: 'crop is required and must be a string' });
      return;
    }

    const result = await assessProduceQualityService(imageData, crop);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to assess quality', details: String(error) });
  }
}
