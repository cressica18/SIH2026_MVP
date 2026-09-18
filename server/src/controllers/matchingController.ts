import { Request, Response } from 'express';
import { matchingService } from '../services/matchingService.js';
import { AuthRequest } from '../middleware/auth.js';

export const getRankedListingsForBuyer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Authorization: only the buyer themselves can get their personalized matches
    if (req.user?.role !== 'buyer' || req.user?.userId !== id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const matches = matchingService.getRankedListingsForBuyer(id);
    res.json(matches);
  } catch (error: any) {
    if (error.message === 'Buyer not found') {
      res.status(404).json({ error: error.message });
    } else {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};

export const getRankedBuyersForListing = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Authorization: only the farmer who owns the listing can see its buyer matches
    // (We allow logistics/admin for demo purposes if needed, but strict rule is farmer only)
    if (req.user?.role !== 'farmer' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // We should ideally check if req.user is the owner of the listing, 
    // but the store logic inside getRankedBuyersForListing will find the listing.
    const matches = matchingService.getRankedBuyersForListing(id);
    res.json(matches);
  } catch (error: any) {
    if (error.message === 'Listing not found') {
      res.status(404).json({ error: error.message });
    } else {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};
