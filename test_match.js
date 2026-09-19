import { matchSchemes } from './server/src/services/schemeService.js';
import { SEED_USERS } from './server/src/data/seedData.js';
import { SEED_GOV_SCHEMES } from './server/src/data/seedData.js';

const farmer = SEED_USERS.find(u => u.id === 'farmer_1');
const matched = matchSchemes(farmer, SEED_GOV_SCHEMES);
console.log(`Matched: ${matched.length}`);
