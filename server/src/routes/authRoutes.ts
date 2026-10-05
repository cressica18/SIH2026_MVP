import { Router, RequestHandler } from 'express';
import { sendOtp, verifyOtp, refreshToken, getMe } from '../controllers/authController.js';
import { requireAnyRole } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/otp/send — Send OTP to Indian mobile number
router.post('/otp/send', sendOtp as unknown as RequestHandler);

// POST /api/auth/otp/verify — Verify OTP & receive JWT token pair
router.post('/otp/verify', verifyOtp as unknown as RequestHandler);

// POST /api/auth/refresh — Obtain new access token using refresh token
router.post('/refresh', refreshToken as unknown as RequestHandler);

// GET /api/auth/me — Get current user profile (requires valid JWT)
router.get('/me', requireAnyRole('collector', 'recycler', 'admin'), getMe as unknown as RequestHandler);

export default router;
