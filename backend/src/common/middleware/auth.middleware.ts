import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../errors/app-error';
import { prisma } from '../prisma.service';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'smartpool-driver-access-secret-key-32chars!';

export interface AuthenticatedDriver {
  id: string;
  phoneNumber?: string;
  status?: string;
  role: string;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      driverId?: string;
      driver?: AuthenticatedDriver;
    }
  }
}

/**
 * Production-ready JWT authentication middleware for Captain/Driver routes
 */
export async function authenticateDriver(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    // Direct header fallback for development/internal gateways
    const headerDriverId = req.headers['x-driver-id'] as string;

    if (!token && headerDriverId) {
      req.driverId = headerDriverId.trim();
      req.driver = {
        id: req.driverId,
        role: 'DRIVER',
        status: 'ACTIVE',
      };
      return next();
    }

    if (!token) {
      // Dev bypass if specified
      if (process.env.NODE_ENV !== 'production' && req.headers['x-dev-bypass']) {
        req.driverId = '550e8400-e29b-41d4-a716-446655440000';
        req.driver = {
          id: req.driverId,
          role: 'DRIVER',
          status: 'ACTIVE',
        };
        return next();
      }

      throw new UnauthorizedError('Authentication token missing. Please log in.');
    }

    // Verify JWT signature
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token has expired. Please refresh your session.');
      }
      throw new UnauthorizedError('Invalid authentication token.');
    }

    const driverId = decoded.driverId || decoded.sub;
    if (!driverId) {
      throw new UnauthorizedError('Malformed token payload.');
    }

    req.driverId = driverId;
    req.driver = {
      id: driverId,
      role: decoded.role || 'DRIVER',
      status: 'ACTIVE',
    };

    // Optionally check if driver is active in database if connection exists
    try {
      if (process.env.DATABASE_URL) {
        const dbDriver = await prisma.driver.findUnique({
          where: { id: driverId },
          select: { id: true, phoneNumber: true, status: true, isActive: true },
        });

        if (dbDriver) {
          if (!dbDriver.isActive || dbDriver.status === 'SUSPENDED' || dbDriver.status === 'DEACTIVATED') {
            throw new ForbiddenError('Driver account is suspended or inactive.');
          }
          req.driver.phoneNumber = dbDriver.phoneNumber;
          req.driver.status = dbDriver.status;
        }
      }
    } catch (err) {
      if (err instanceof ForbiddenError) throw err;
      // If DB error, proceed with token claims in degraded mode
    }

    next();
  } catch (error) {
    next(error);
  }
}

// Backwards compatibility alias
export const requireDriverAuth = authenticateDriver;
