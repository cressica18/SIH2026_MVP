import { Request, Response } from 'express';
import { buildDashboard, getDashboardForCrop, getAllCropsDashboard } from '../services/insightService.js';

export async function getInsightsDashboard(req: Request, res: Response): Promise<void> {
  try {
    const { crop, region } = req.query;

    if (crop && typeof crop === 'string') {
      const dashboard = getDashboardForCrop(crop, (region as string) || 'All India');
      res.json(dashboard);
      return;
    }

    if (region && typeof region === 'string' && !crop) {
      const allDashboards = getAllCropsDashboard(region);
      res.json({ dashboards: allDashboards, region });
      return;
    }

    const dashboard = buildDashboard('All India');
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate market insights', details: String(error) });
  }
}

export async function getInsightsAllCrops(req: Request, res: Response): Promise<void> {
  try {
    const { region } = req.query;
    const dashboards = getAllCropsDashboard((region as string) || 'All India');
    res.json({ dashboards, region: region || 'All India' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate market insights', details: String(error) });
  }
}