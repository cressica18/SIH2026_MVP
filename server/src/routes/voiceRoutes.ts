import { Router } from 'express';
import { extractVoiceListing } from '../controllers/voiceController.js';

const router = Router();

// POST /api/voice/extract-listing
// Extracts structured listing data (crop, variety, quantity, price) from a voice transcript
router.post('/extract-listing', extractVoiceListing);

export default router;
