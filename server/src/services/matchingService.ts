import { store } from '../data/store.js';
import { Listing, BuyerProfile } from '../../src/types.js';
import { SEED_BUYERS } from '../data/seedData.js';

/**
 * Calculates the Haversine distance between two coordinates in kilometers.
 */
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
            
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c;
  
  return Math.round(d);
}

/**
 * Deterministic scoring algorithm (max 100 points)
 */
export function scoreMatch(listing: Listing, buyer: BuyerProfile): { score: number, factors: any, distanceKm: number } {
  // 1. Distance (Max 35 pts)
  // Assume buyer has lat/lng in a real DB. For our MVP, we use default coordinates for Pune
  const buyerLat = (buyer as any).lat || 18.5204;
  const buyerLng = (buyer as any).lng || 73.8567;
  
  const distanceKm = calculateDistanceKm(listing.lat, listing.lng, buyerLat, buyerLng);
  
  let distanceScore = 0;
  if (distanceKm <= 50) distanceScore = 35;
  else if (distanceKm <= 100) distanceScore = 25;
  else if (distanceKm <= 300) distanceScore = 15;
  else if (distanceKm <= 500) distanceScore = 5;

  // 2. Quality (Max 25 pts)
  let qualityScore = 5;
  if (listing.quality.grade === 'A') qualityScore = 25;
  else if (listing.quality.grade === 'B') qualityScore = 15;
  
  // 3. Price Fit (Max 25 pts)
  let priceScore = 0;
  if (listing.priceExpected <= listing.priceAi.fair) {
    priceScore = 25; // Good deal
  } else if (listing.priceExpected <= listing.priceAi.max) {
    priceScore = 15; // Okay deal
  } else {
    priceScore = 5;  // Expensive
  }

  // 4. Reputation (Max 15 pts)
  const rep = listing.farmerReputation || 4.0;
  const repScore = Math.round((rep / 5.0) * 15);

  const totalScore = distanceScore + qualityScore + priceScore + repScore;

  return {
    score: totalScore,
    distanceKm,
    factors: {
      distanceScore,
      qualityScore,
      priceScore,
      reputationScore: repScore
    }
  };
}

export const matchingService = {
  getRankedListingsForBuyer: (buyerId: string) => {
    const buyer = SEED_BUYERS.find(b => b.id === buyerId);
    if (!buyer) {
      throw new Error('Buyer not found');
    }

    const activeListings = store.listings.filter(l => l.status === 'active');
    
    const scored = activeListings.map(listing => {
      const match = scoreMatch(listing, buyer);
      const scrubbed = { ...listing };
      delete scrubbed.farmerRealName;
      delete scrubbed.farmerPhone;
      return {
        ...scrubbed,
        matchScore: match.score,
        distanceKm: match.distanceKm,
        matchFactors: match.factors
      };
    });

    // Sort descending by score
    scored.sort((a, b) => b.matchScore! - a.matchScore!);
    
    return scored;
  },

  getRankedBuyersForListing: (listingId: string) => {
    const listing = store.listings.find(l => l.id === listingId);
    if (!listing) {
      throw new Error('Listing not found');
    }
    
    const scoredBuyers = SEED_BUYERS.map(buyer => {
      const match = scoreMatch(listing, buyer);
      return {
        ...buyer,
        matchScore: match.score,
        distanceKm: match.distanceKm,
        matchFactors: match.factors
      };
    });

    scoredBuyers.sort((a: any, b: any) => b.matchScore - a.matchScore);
    
    return scoredBuyers;
  }
};
