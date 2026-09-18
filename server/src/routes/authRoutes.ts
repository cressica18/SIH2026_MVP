import { Router, RequestHandler } from 'express';
import { sendOtp, verifyOtp, getMe, refreshToken } from '../controllers/authController.js';
import { requireAnyRole } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/otp/send — Send OTP to phone
// POST /api/auth/otp/verify — Verify OTP and get JWT tokens
// GET /api/auth/me — Get current user profile (requires valid JWT)
// POST /api/auth/refresh — Refresh access token

// Cast to RequestHandler to satisfy Express overload when using AuthRequest-typed controllers
router.post('/otp/send', sendOtp as unknown as RequestHandler);
router.post('/otp/verify', verifyOtp as unknown as RequestHandler);
router.get('/me', requireAnyRole('farmer', 'buyer', 'logistics', 'admin'), getMe as unknown as RequestHandler);
router.post('/refresh', refreshToken as unknown as RequestHandler);

export default router;
