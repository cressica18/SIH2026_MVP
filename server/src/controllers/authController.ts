// Authentication controllers: OTP send/verify, JWT issuance, profile lookup, token refresh.
// Dev mode: OTP is logged to console and auto-verified (6-digit, 5 min expiry).

import { Request, Response } from 'express';
import { store } from '../data/store.js';
import { SEED_FARMERS, SEED_BUYERS, SEED_LOGISTICS } from '../data/seedData.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../core/security.js';

// OTP store: maps phone -> { otp, expiresAt }
const otpStore: Map<string, { otp: string; expiresAt: number }> = new Map();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function sendOtp(req: Request, res: Response): void {
  const { phone } = req.body;

  if (!phone || typeof phone !== 'string' || !phone.startsWith('+91')) {
    res.status(400).json({ error: 'Valid Indian phone number (+91...) is required' });
    return;
  }

  const otp = generateOtp();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  otpStore.set(phone, { otp, expiresAt });

  // Dev mode: log OTP to console
  console.log(`[OTP] Phone: ${phone} | OTP: ${otp} | Expires: ${new Date(expiresAt).toISOString()}`);

  res.json({ message: 'OTP sent successfully', phone });
}

export function verifyOtp(req: Request, res: Response): void {
  const { phone, otp } = req.body;

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

  if (record.otp !== otp) {
    res.status(400).json({ error: 'Invalid OTP. Please try again.' });
    return;
  }

  // OTP verified — find user in seed data
  const allUsers = [
    ...store.listings.flatMap((l) => []),
  ];

  // Search all seed data for a matching user
  const farmer = store.listings.find(() => false); // placeholder
  const seedData = require('../data/seedData.js');
  const allFarmers = seedData.SEED_FARMERS;
  const allBuyers = seedData.SEED_BUYERS;
  const allLogistics = seedData.SEED_LOGISTICS;

  const user = [...allFarmers, ...allBuyers, ...allLogistics].find(
    (u) => u.phone === phone
  );

  if (!user) {
    // User not in seed data — register as new user
    res.status(201).json({
      message: 'Phone verified. User registered.',
      tokens: {
        accessToken: generateAccessToken({ userId: `user_${Date.now()}`, phone, role: 'farmer' }),
        refreshToken: generateRefreshToken({ userId: `user_${Date.now()}`, phone, role: 'farmer' }),
      },
      user: { phone, role: 'farmer', name: phone, id: `user_${Date.now()}` },
    });
    return;
  }

  const { id, name, role } = user;

  // Clean up used OTP
  otpStore.delete(phone);

  const accessToken = generateAccessToken({ userId: id, phone, role });
  const refreshToken = generateRefreshToken({ userId: id, phone, role });

  res.json({
    message: 'OTP verified successfully',
    tokens: { accessToken, refreshToken },
    user: { id, phone, name, role },
  });
}

export function getMe(req: Request, res: Response): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // Find full profile from seed data
  const seedData = require('../data/seedData.js');
  const allUsers = [
    ...seedData.SEED_FARMERS,
    ...seedData.SEED_BUYERS,
    ...seedData.SEED_LOGISTICS,
  ];

  const profile = allUsers.find((u) => u.id === user.userId || u.phone === user.phone);

  if (profile) {
    res.json({ user: { ...profile }, role: user.role });
  } else {
    res.json({ user, role: user.role });
  }
}

export function refreshToken(req: Request, res: Response): void {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token is required' });
    return;
  }

  const claims = verifyRefreshToken(refreshToken);
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
