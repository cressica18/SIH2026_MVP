// JWT security utilities for authentication and role-based access.
// Access tokens are short-lived (15 min); refresh tokens persist (7 days).

import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'vasundhara-dev-secret-change-me';
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'vasundhara-refresh-secret-change-me';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface JwtPayload {
  userId: string;
  phone: string;
  role: string;
  iat: number;
  exp: number;
}

export function generateAccessToken(payload: { userId: string; phone: string; role: string }): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function generateRefreshToken(payload: { userId: string; phone: string; role: string }): string {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function extractClaims(token: string): JwtPayload | null {
  return verifyAccessToken(token);
}

export { ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY };
