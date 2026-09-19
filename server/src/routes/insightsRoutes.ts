import { Router } from 'express';
import { getInsightsDashboard, getInsightsAllCrops } from '../controllers/insightsController.js';

const router = Router();

// GET /api/insights/dashboard?crop=Tomato&region=Maharashtra
// Returns aggregated market insights with price trends, top demand crops, and AI summary
router.get('/dashboard', getInsightsDashboard);

// GET /api/insights/dashboard/all?region=Maharashtra
// Returns insights for all crops in a region
router.get('/dashboard/all', getInsightsAllCrops);

export default router;