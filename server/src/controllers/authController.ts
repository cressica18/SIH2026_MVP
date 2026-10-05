import { Response } from 'express';
import { SEED_COLLECTORS, SEED_RECYCLERS } from '../data/seedData.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateOtpChallenge,
  verifyOtpChallenge,
} from '../core/security.js';
import { AuthRequest } from '../middleware/auth.js';

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getIsDemoMode(): boolean {
  return process.env.DEMO_MODE === 'true';
}

export function sendOtp(req: AuthRequest, res: Response): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = req.body as any;
  const phone: string | undefined = body?.phone;

  if (!phone || typeof phone !== 'string' || !phone.startsWith('+91')) {
    res.status(400).json({ error: 'Valid Indian phone number (+91...) is required' });
    return;
  }

  const isDemo = getIsDemoMode();
  const otp = process.env.NODE_ENV === 'test' ? '123456' : isDemo ? '123456' : generateOtp();
  const otpChallenge = generateOtpChallenge({ phone, otp });

  console.log(`[OTP] Phone: ${phone} | OTP: ${otp} | Expires: ${new Date(Date.now() + 5 * 60 * 1000).toISOString()}`);

  res.json({
    message: 'OTP sent successfully',
    phone,
    otpChallenge,
    demoMode: isDemo,
    devOtp: isDemo || process.env.NODE_ENV !== 'production' ? otp : undefined,
  });
}

export function verifyOtp(req: AuthRequest, res: Response): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = req.body as any;
  const phone: string | undefined = body?.phone;
  const otp: string | undefined = body?.otp;
  const otpChallenge: string | undefined = body?.otpChallenge;

  if (!phone || !otp) {
    res.status(400).json({ error: 'Phone and OTP are required' });
    return;
  }

  if (!otpChallenge) {
    res.status(400).json({ error: 'OTP challenge required. Request OTP first.' });
    return;
  }

  const challenge = verifyOtpChallenge(otpChallenge);
  if (!challenge) {
    res.status(400).json({ error: 'Invalid or expired OTP challenge. Request a new OTP.' });
    return;
  }

  if (challenge.phone !== phone) {
    res.status(400).json({ error: 'OTP challenge does not match this phone number.' });
    return;
  }

  if (Date.now() > challenge.exp) {
    res.status(400).json({ error: 'OTP has expired. Request a new one.' });
    return;
  }

  const isDemo = getIsDemoMode();
  const isTestOtp = process.env.NODE_ENV === 'test' && otp === '123456';
  const isDemoOtp = isDemo && otp === '123456';
  if (challenge.otp !== otp && !isTestOtp && !isDemoOtp) {
    res.status(400).json({ error: 'Invalid OTP. Please try again.' });
    return;
  }

  const allUsers = [...SEED_COLLECTORS, ...SEED_RECYCLERS];
  const foundUser = allUsers.find((u) => u.phone === phone);

  const ADMIN_PHONE = '+91 99999 99999';
  if (phone === ADMIN_PHONE) {
    const accessToken = generateAccessToken({ userId: 'admin_1', phone, role: 'admin' });
    const refreshToken = generateRefreshToken({ userId: 'admin_1', phone, role: 'admin' });
    res.json({
      message: 'OTP verified successfully',
      tokens: { accessToken, refreshToken },
      user: { id: 'admin_1', phone, name: 'Admin User', role: 'admin' },
    });
    return;
  }

  if (!foundUser) {
    const newId = `user_${Date.now()}`;
    const accessToken = generateAccessToken({ userId: newId, phone, role: 'collector' });
    const refreshToken = generateRefreshToken({ userId: newId, phone, role: 'collector' });
    res.status(201).json({
      message: 'Phone verified. New user registered.',
      tokens: { accessToken, refreshToken },
      user: { id: newId, phone, role: 'collector', name: phone },
    });
    return;
  }

  const { id, name, role } = foundUser;
  const accessToken = generateAccessToken({ userId: id, phone, role });
  const refreshToken = generateRefreshToken({ userId: id, phone, role });

  res.json({
    message: 'OTP verified successfully',
    tokens: { accessToken, refreshToken },
    user: { id, phone, name, role },
  });
}

export function getMe(req: AuthRequest, res: Response): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const allUsers = [...SEED_COLLECTORS, ...SEED_RECYCLERS];
  const profile = allUsers.find((u) => u.id === user.userId || u.phone === user.phone);

  if (profile) {
    res.json({ user: { ...profile }, role: user.role });
  } else {
    res.json({ user, role: user.role });
  }
}

export function refreshToken(req: AuthRequest, res: Response): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = req.body as any;
  const token: string | undefined = body?.refreshToken;

  if (!token) {
    res.status(400).json({ error: 'Refresh token is required' });
    return;
  }

  const claims = verifyRefreshToken(token);
  if (!claims) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
    return;
  }

  const newAccessToken = generateAccessToken({ userId: claims.userId, phone: claims.phone, role: claims.role });
  const newRefreshToken = generateRefreshToken({ userId: claims.userId, phone: claims.phone, role: claims.role });

  res.json({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });
}
