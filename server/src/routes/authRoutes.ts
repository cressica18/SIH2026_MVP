import { Router } from 'express';
import { sendOtp, verifyOtp, getMe, refreshToken } from '../controllers/authController.js';

const router = Router();

// POST /api/auth/otp/send — Send OTP to phone
// POST /api/auth/otp/verify — Verify OTP and get JWT tokens
// GET /api/auth/me — Get current user profile
// POST /api/auth/refresh — Refresh access token

router.route('/otp/send').post(sendOtp);
router.route('/otp/verify').post(verifyOtp);
router.route('/me').get(getMe);
router.route('/refresh').post(refreshToken);

export default router;
