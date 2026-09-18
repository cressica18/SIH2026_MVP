import { Router, RequestHandler } from 'express';
import { getListings, getListing, createListing, updateListing } from '../controllers/listingController.js';
import { requireAnyRole } from '../middleware/auth.js';

const router = Router();

// GET /api/listings — Get all listings
// GET /api/listings/:id — Get single listing
// POST /api/listings — Create new listing
// PATCH /api/listings/:id/status — Update listing status

router.route('/')
  .get(getListings)
  .post(requireAnyRole('farmer'), createListing as unknown as RequestHandler);
router.route('/:id')
  .get(getListing);
router.route('/:id/status')
  .patch(requireAnyRole('farmer', 'admin'), updateListing as unknown as RequestHandler);

export default router;
