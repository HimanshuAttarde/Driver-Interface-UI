import http from 'http';
import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import { prisma } from './common/prisma.service';
import { AppError } from './common/errors/app-error';

// Auth Module
import { AuthService } from './modules/auth/auth.service';
import { createAuthRouter } from './modules/auth/auth.router';

// Vehicle Module
import { VehicleService } from './modules/vehicle/vehicle.service';
import { createVehicleRouter } from './modules/vehicle/vehicle.router';

// Trip Manifest & Telemetry Module
import { TripManifestService } from './modules/trip-manifest/manifest.service';
import { createManifestRouter } from './modules/trip-manifest/manifest.router';
import { TelemetryGateway } from './modules/trip-manifest/telemetry.gateway';

// Export all module elements for external project consumption
export * from './modules/auth/dto/auth.dto';
export * from './modules/auth/auth.service';
export * from './modules/auth/auth.controller';
export * from './modules/auth/auth.router';
export * from './modules/auth/sms-provider';
export * from './modules/auth/rate-limiter';

export * from './modules/vehicle/dto/vehicle.dto';
export * from './modules/vehicle/vehicle.service';
export * from './modules/vehicle/vehicle.router';
export * from './modules/vehicle/vehicle.controller';
export * from './modules/vehicle/vehicle.module';

export * from './modules/trip-manifest/dto/manifest.dto';
export * from './modules/trip-manifest/manifest.service';
export * from './modules/trip-manifest/manifest.router';
export * from './modules/trip-manifest/telemetry.gateway';
export * from './modules/trip-manifest/mock-manifest.data';

export * from './common/prisma.service';
export * from './common/errors/app-error';
export * from './common/middleware/auth.middleware';

export interface AppServerContext {
  app: express.Application;
  server: http.Server;
  telemetryGateway: TelemetryGateway;
  manifestService: TripManifestService;
  vehicleService: VehicleService;
  authService: AuthService;
}

export function createApp(): express.Application {
  const app = express();

  // Core Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // CORS headers
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-driver-id');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'UP',
      service: 'smartpool-driver-manifest-backend',
      timestamp: new Date().toISOString(),
    });
  });

  // 1. Initialize Auth Service and Router
  const authService = new AuthService(prisma);
  const authRouter = createAuthRouter(authService);
  app.use('/api/v1/driver/auth', authRouter);

  // 2. Initialize Vehicle Service and Router
  const vehicleService = new VehicleService(prisma);
  const vehicleRouter = createVehicleRouter(vehicleService);
  app.use('/api/v1/driver/vehicle', vehicleRouter);

  // 3. Initialize Trip Manifest Service and Router
  const manifestService = new TripManifestService(prisma);
  const manifestRouter = createManifestRouter(manifestService);
  app.use('/api/v1/driver', manifestRouter);

  // 404 Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        message: `Cannot ${req.method} ${req.path}`,
        statusCode: 404,
      },
    });
  });

  // Global Centralized Error Handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        success: false,
        error: {
          message: err.message,
          statusCode: err.statusCode,
          ...(err.errors && { details: err.errors }),
        },
      });
      return;
    }

    if ('code' in err) {
      const prismaCode = (err as { code: string }).code;
      if (prismaCode === 'P2002') {
        res.status(409).json({
          success: false,
          error: {
            message: 'A resource with this unique identifier already exists.',
            statusCode: 409,
          },
        });
        return;
      }
      if (prismaCode === 'P2025') {
        res.status(404).json({
          success: false,
          error: {
            message: 'Target database record not found.',
            statusCode: 404,
          },
        });
        return;
      }
    }

    console.error('Unhandled Server Error:', err);
    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error',
        statusCode: 500,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
      },
    });
  });

  return app;
}

export function createServerContext(): AppServerContext {
  const app = createApp();
  const server = http.createServer(app);
  const manifestService = new TripManifestService(prisma);
  const vehicleService = new VehicleService(prisma);
  const authService = new AuthService(prisma);
  const telemetryGateway = new TelemetryGateway(server, manifestService);

  return {
    app,
    server,
    telemetryGateway,
    manifestService,
    vehicleService,
    authService,
  };
}

// Standalone runner when executed directly
if (process.env.START_SERVER === 'true' || require.main === module) {
  const PORT = process.env.PORT || 4000;
  const context = createServerContext();

  context.server.listen(PORT, () => {
    console.log(`🚗 SmartPool Driver Portal Backend running on http://localhost:${PORT}`);
    console.log(`📡 WebSocket Telemetry: ws://localhost:${PORT}/ws/telemetry`);
    console.log(`📡 REST Auth Endpoints:`);
    console.log(`   POST  /api/v1/driver/auth/send-otp`);
    console.log(`   POST  /api/v1/driver/auth/verify-otp`);
    console.log(`   POST  /api/v1/driver/auth/refresh`);
    console.log(`   POST  /api/v1/driver/auth/logout`);
  });
}
