import { Router, Request, Response, NextFunction } from 'express';
import { VehicleService } from './vehicle.service';
import {
  CreateVehicleSchema,
  UpdateCapacityMatrixSchema,
} from './dto/vehicle.dto';
import { validateBody } from '../../common/middleware/validate.middleware';
import { requireDriverAuth } from '../../common/middleware/auth.middleware';

export function createVehicleRouter(vehicleService: VehicleService): Router {
  const router = Router();

  // Apply driver authentication to all vehicle endpoints
  router.use(requireDriverAuth);

  /**
   * POST /api/v1/driver/vehicle
   * Register a new vehicle linked to the authenticated driver.
   */
  router.post(
    '/',
    validateBody(CreateVehicleSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const driverId = req.driverId!;
        const result = await vehicleService.registerVehicle(driverId, req.body);

        res.status(201).json({
          success: true,
          message: 'Vehicle registered successfully and marked as active dispatch vehicle',
          data: result,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /api/v1/driver/vehicle/active
   * Retrieve current active vehicle details and live capacity matrix.
   */
  router.get(
    '/active',
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const driverId = req.driverId!;
        const result = await vehicleService.getActiveVehicle(driverId);

        res.status(200).json({
          success: true,
          message: 'Active vehicle and capacity matrix retrieved successfully',
          data: result,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * PATCH /api/v1/driver/vehicle/capacity-matrix
   * Dynamically update active boot space, luggage limits, and AC availability.
   */
  router.patch(
    '/capacity-matrix',
    validateBody(UpdateCapacityMatrixSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const driverId = req.driverId!;
        const result = await vehicleService.updateCapacityMatrix(driverId, req.body);

        res.status(200).json({
          success: true,
          message: 'Physical capacity matrix updated and synced with batching engine',
          data: result,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
