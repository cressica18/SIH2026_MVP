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

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'Vasundhara API' });
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
