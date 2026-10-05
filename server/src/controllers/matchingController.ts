import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';

export const getRankedListingsForBuyer = async (req: AuthRequest, res: Response) => {
  res.json([]);
};

export const getRankedBuyersForListing = async (req: AuthRequest, res: Response) => {
  res.json([]);
};
