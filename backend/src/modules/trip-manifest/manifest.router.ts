import { Router, Request, Response, NextFunction } from 'express';
import { TripManifestService } from './manifest.service';
import { requireDriverAuth } from '../../common/middleware/auth.middleware';
import { ArrivedStopParamsSchema } from './dto/manifest.dto';
import { BadRequestError } from '../../common/errors/app-error';

export function createManifestRouter(manifestService: TripManifestService): Router {
  const router = Router();

  // Apply authentication to all trip endpoints
  router.use(requireDriverAuth);

  /**
   * GET /api/v1/driver/trips/active-manifest
   * Returns the current active TripBatch with all ordered ManifestStop items and total expected payout.
   */
  router.get(
    '/trips/active-manifest',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const driverId = req.driverId!;
        const manifest = await manifestService.getActiveManifest(driverId);

        res.status(200).json({
          success: true,
          message: 'Active trip manifest retrieved successfully',
          data: manifest,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/v1/driver/stops/:stopId/arrived
   * Marks driver as arrived at pickup/dropoff point and triggers notification to the rider.
   */
  router.post(
    '/stops/:stopId/arrived',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const parseResult = ArrivedStopParamsSchema.safeParse(req.params);
        if (!parseResult.success) {
          throw new BadRequestError('Invalid stopId parameter in URL path', parseResult.error.errors);
        }

        const driverId = req.driverId!;
        const stopId = parseResult.data.stopId;
        const updatedStop = await manifestService.markStopArrived(driverId, stopId);

        res.status(200).json({
          success: true,
          message: `Driver arrival registered for ${updatedStop.stopType} stop at ${updatedStop.locationName}. Passenger notified.`,
          data: updatedStop,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
