import { Response } from 'express';
import { SEED_FARMERS, SEED_BUYERS, SEED_LOGISTICS } from '../data/seedData.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../core/security.js';
import { AuthRequest } from '../middleware/auth.js';

// OTP store: maps phone -> { otp, expiresAt }
const otpStore: Map<string, { otp: string; expiresAt: number }> = new Map();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function sendOtp(req: AuthRequest, res: Response): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = req.body as any;
  const phone: string | undefined = body?.phone;

  if (!phone || typeof phone !== 'string' || !phone.startsWith('+91')) {
    res.status(400).json({ error: 'Valid Indian phone number (+91...) is required' });
    return;
  }

  // In test/dev environment, allow 123456 as universal test OTP or return devOtp
  const otp = process.env.NODE_ENV === 'test' ? '123456' : generateOtp();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  otpStore.set(phone, { otp, expiresAt });

  // Dev mode: log OTP to console
  console.log(`[OTP] Phone: ${phone} | OTP: ${otp} | Expires: ${new Date(expiresAt).toISOString()}`);

  res.json({ message: 'OTP sent successfully', phone, devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined });
}

export function verifyOtp(req: AuthRequest, res: Response): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = req.body as any;
  const phone: string | undefined = body?.phone;
  const otp: string | undefined = body?.otp;

  if (!phone || !otp) {
    res.status(400).json({ error: 'Phone and OTP are required' });
    return;
  }

  const record = otpStore.get(phone);
  if (!record) {
    res.status(400).json({ error: 'No OTP found for this phone. Request OTP first.' });
    return;
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(phone);
    res.status(400).json({ error: 'OTP has expired. Request a new one.' });
    return;
  }

  const isTestOtp = process.env.NODE_ENV !== 'production' && otp === '123456';

  if (record.otp !== otp && !isTestOtp) {
    res.status(400).json({ error: 'Invalid OTP. Please try again.' });
    return;
  }

  // OTP verified — find user in seed data
  const allUsers = [...SEED_FARMERS, ...SEED_BUYERS, ...SEED_LOGISTICS];
  const foundUser = allUsers.find((u) => u.phone === phone);

  // Clean up used OTP
  otpStore.delete(phone);

  // Admin phone special case
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
    // Phone not in seed data — register as new farmer
    const newId = `user_${Date.now()}`;
    const accessToken = generateAccessToken({ userId: newId, phone, role: 'farmer' });
    const refreshToken = generateRefreshToken({ userId: newId, phone, role: 'farmer' });
    res.status(201).json({
      message: 'Phone verified. New user registered.',
      tokens: { accessToken, refreshToken },
      user: { id: newId, phone, role: 'farmer', name: phone },
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

  // Find full profile from seed data
  const allUsers = [...SEED_FARMERS, ...SEED_BUYERS, ...SEED_LOGISTICS];
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
