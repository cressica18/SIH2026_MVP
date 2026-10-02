import { Router, RequestHandler } from 'express';
import {
  getSmartPools,
  getSmartPool,
  getPoolsForCollector,
  createSmartPoolFromLot,
  joinSmartPool,
  leaveSmartPool,
  getPoolOffers,
  createPoolOffer,
  respondToOffer,
  getSettlements,
  getSettlement,
  completeHandover,
  getReferencePrices,
} from '../controllers/smartPoolController.js';
import { requireAnyRole } from '../middleware/auth.js';

const router = Router();

// Public / Collector
router.get('/', getSmartPools);
router.get('/reference-prices', getReferencePrices);
router.get('/collector/my-pools', requireAnyRole('collector'), getPoolsForCollector as unknown as RequestHandler);
router.get('/:id', getSmartPool);
router.post('/create-from-lot', requireAnyRole('collector'), createSmartPoolFromLot as unknown as RequestHandler);
router.post('/join', requireAnyRole('collector'), joinSmartPool as unknown as RequestHandler);
router.post('/leave', requireAnyRole('collector'), leaveSmartPool as unknown as RequestHandler);

// Offers
router.get('/:poolId/offers', getPoolOffers);
router.post('/offers', requireAnyRole('recycler', 'admin'), createPoolOffer as unknown as RequestHandler);
router.post('/offers/respond', requireAnyRole('collector', 'admin'), respondToOffer as unknown as RequestHandler);

// Settlements
router.get('/settlements', getSettlements);
router.get('/settlements/:id', getSettlement);
router.post('/settlements/complete', requireAnyRole('recycler', 'admin'), completeHandover as unknown as RequestHandler);

export default router;