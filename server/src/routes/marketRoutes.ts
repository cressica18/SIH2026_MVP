import { Router } from 'express';
import { getPriceRecommendation } from '../controllers/marketController.js';

const router = Router();

// GET /api/market/price?crop=Tomato&region=Nashik
// Returns AI-powered price band recommendation based on scrap market data
router.get('/price', getPriceRecommendation);

export default router;
