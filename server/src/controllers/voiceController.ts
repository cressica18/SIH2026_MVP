import { Request, Response } from 'express';
import { extractVoiceListingService } from '../services/voiceService.js';

export async function extractVoiceListing(req: Request, res: Response): Promise<void> {
  try {
    const { transcript, language } = req.body;

    if (!transcript || typeof transcript !== 'string') {
      res.status(400).json({ error: 'transcript is required and must be a string' });
      return;
    }

    const result = await extractVoiceListingService(transcript, language || 'en');
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to extract voice listing', details: String(error) });
  }
}
