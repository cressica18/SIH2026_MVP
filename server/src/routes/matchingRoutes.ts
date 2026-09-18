import { Router } from 'express';
import { getRankedListingsForBuyer, getRankedBuyersForListing } from '../controllers/matchingController.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

// Protect routes
router.use(requireRole('buyer', 'farmer', 'admin', 'logistics'));

router.get('/buyer/:id', getRankedListingsForBuyer);
router.get('/listing/:id', getRankedBuyersForListing);

export default router;
