import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../errors/app-error';

// Extend Express Request type to include driver
declare global {
  namespace Express {
    interface Request {
      driverId?: string;
    }
  }
}

export function requireDriverAuth(req: Request, _res: Response, next: NextFunction): void {
  // 1. Check for x-driver-id header (direct driver context / gateway forwarding)
  const headerDriverId = req.headers['x-driver-id'] as string;
  if (headerDriverId && headerDriverId.trim()) {
    req.driverId = headerDriverId.trim();
    return next();
  }

  // 2. Check for Authorization Bearer token (simulated JWT decode)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) {
      // In production, verify JWT payload: jwt.verify(token, secret)
      // Here we parse token or extract sub
      req.driverId = token.startsWith('drv_') ? token : `drv_${token.slice(0, 8)}`;
      return next();
    }
  }

  // 3. Fallback for sandbox/development if specified in environment
  if (process.env.NODE_ENV !== 'production' && req.headers['x-dev-bypass']) {
    req.driverId = '550e8400-e29b-41d4-a716-446655440000'; // Default test UUID
    return next();
  }

  next(new UnauthorizedError('Missing or invalid driver authentication credentials. Provide "x-driver-id" or "Authorization: Bearer <token>"'));
}
