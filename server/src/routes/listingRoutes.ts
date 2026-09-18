import { Router } from 'express';
import { getListings, getListing, createListing, updateListing } from '../controllers/listingController.js';

const router = Router();

// GET /api/listings — Get all listings
// GET /api/listings/:id — Get single listing
// POST /api/listings — Create new listing
// PATCH /api/listings/:id — Update listing
router.route('/')
  .get(getListings)
  .post(createListing);
router.route('/:id')
  .get(getListing)
  .patch(updateListing);

export default router;
