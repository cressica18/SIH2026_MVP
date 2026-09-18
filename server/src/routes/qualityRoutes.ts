import { Router } from 'express';
import { assessQuality } from '../controllers/qualityController.js';

const router = Router();

// POST /api/quality/assess
// Assesses produce quality grade using simulated CNN classifier
router.post('/assess', assessQuality);

export default router;
