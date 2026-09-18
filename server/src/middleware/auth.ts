// Authentication middleware for role-based route protection.
// Validates JWT access tokens and enforces role requirements.

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../core/security.js';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    phone: string;
    role: string;
  };
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No access token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const claims = verifyAccessToken(token);
    if (!claims) {
      res.status(401).json({ error: 'Invalid or expired access token' });
      return;
    }

    if (!allowedRoles.includes(claims.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    req.user = { userId: claims.userId, phone: claims.phone, role: claims.role };
    next();
  };
}

export function requireAnyRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No access token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const claims = verifyAccessToken(token);
    if (!claims) {
      res.status(401).json({ error: 'Invalid or expired access token' });
      return;
    }

    if (!allowedRoles.includes(claims.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    req.user = { userId: claims.userId, phone: claims.phone, role: claims.role };
    next();
  };
}
