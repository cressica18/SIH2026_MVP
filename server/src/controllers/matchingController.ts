import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { matchingService } from '../services/matchingService.js';
import { notifyNewMatch } from '../services/notificationService.js';
import { store } from '../data/store.js';

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
    if (req.user?.role !== 'farmer' && req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const matches = matchingService.getRankedBuyersForListing(id);
    
    // Notify farmer of high-scoring new matches (simple approach for MVP)
    if (req.user?.role === 'farmer' && matches.length > 0) {
      const topMatches = matches.filter(m => m.matchScore >= 90).slice(0, 3);
      for (const match of topMatches) {
        const listing = store.listings.find(l => l.id === id);
        if (listing) {
          notifyNewMatch(req.user.userId, match.businessName || match.name, listing.crop, match.matchScore);
        }
      }
    }
    
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