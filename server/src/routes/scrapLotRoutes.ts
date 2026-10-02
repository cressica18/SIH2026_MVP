import { Router, RequestHandler } from 'express';
import { getScrapLots, getScrapLot, createScrapLot, updateScrapLot } from '../controllers/scrapLotController.js';
import { requireAnyRole } from '../middleware/auth.js';

const router = Router();

router.route('/')
  .get(getScrapLots)
  .post(requireAnyRole('collector'), createScrapLot as unknown as RequestHandler);
router.route('/:id')
  .get(getScrapLot);
router.route('/:id/status')
  .patch(requireAnyRole('collector', 'admin'), updateScrapLot as unknown as RequestHandler);

export default router;