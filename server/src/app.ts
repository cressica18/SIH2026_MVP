import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import voiceRoutes from './routes/voiceRoutes.js';
import qualityRoutes from './routes/qualityRoutes.js';
import marketRoutes from './routes/marketRoutes.js';
import listingRoutes from './routes/listingRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import logisticsRoutes from './routes/logisticsRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import financeRoutes from './routes/financeRoutes.js';
import schemeRoutes from './routes/schemeRoutes.js';
import reputationRoutes from './routes/reputationRoutes.js';
import matchingRoutes from './routes/matchingRoutes.js';
import insightsRoutes from './routes/insightsRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import scrapLotRoutes from './routes/scrapLotRoutes.js';
import smartPoolRoutes from './routes/smartPoolRoutes.js';

dotenv.config();

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'Kabadiwala Connect API' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/reputation', reputationRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/scrap-lots', scrapLotRoutes);
app.use('/api/smart-pools', smartPoolRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

export default app;
