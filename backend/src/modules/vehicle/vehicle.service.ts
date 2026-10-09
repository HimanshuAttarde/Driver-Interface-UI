import { PrismaClient, Vehicle } from '@prisma/client';
import {
  CreateVehicleDto,
  UpdateCapacityMatrixDto,
  VehicleResponse,
  BatchingCapacityMatrix,
} from './dto/vehicle.dto';
import {
  ConflictError,
  NotFoundError,
  BadRequestError,
} from '../../common/errors/app-error';

export class VehicleService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Helper to format vehicle entity with real-time batching engine constraints
   */
  private formatVehicleResponse(vehicle: Vehicle): VehicleResponse {
    const batchingConstraints: BatchingCapacityMatrix = {
      availablePassengerSeats: vehicle.totalPhysicalSeats,
      availableCabinBags: vehicle.maxCabinBags,
      availableLargeBags: vehicle.maxLargeBags,
      isAirConditioned: vehicle.hasAC,
      bootTier: vehicle.bootCapacityTier,
      comfortRating: vehicle.fuelType === 'EV' ? 'PREMIUM_EV' : 'STANDARD',
      luggageAcceptanceReady:
        vehicle.bootCapacityTier !== 'ZERO_LUGGAGE' &&
        (vehicle.maxCabinBags > 0 || vehicle.maxLargeBags > 0),
    };

    return {
      id: vehicle.id,
      driverId: vehicle.driverId,
      plateNumber: vehicle.plateNumber,
      make: vehicle.make,
      model: vehicle.model,
      color: vehicle.color,
      fuelType: vehicle.fuelType,
      totalPhysicalSeats: vehicle.totalPhysicalSeats,
      bootCapacityTier: vehicle.bootCapacityTier,
      maxCabinBags: vehicle.maxCabinBags,
      maxLargeBags: vehicle.maxLargeBags,
      hasAC: vehicle.hasAC,
      isVerified: vehicle.isVerified,
      isActiveVehicle: vehicle.isActiveVehicle,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
      batchingConstraints,
    };
  }

  /**
   * POST /api/v1/driver/vehicle
   * Register a new vehicle linked to the authenticated driver.
   * Ensures plate uniqueness and updates active vehicle flag atomically.
   */
  async registerVehicle(driverId: string, dto: CreateVehicleDto): Promise<VehicleResponse> {
    // 1. Check for plate uniqueness globally
    const existingVehicle = await this.prisma.vehicle.findUnique({
      where: { plateNumber: dto.plateNumber },
    });

    if (existingVehicle) {
      throw new ConflictError(
        `Vehicle with plate number "${dto.plateNumber}" is already registered in the system`
      );
    }

    // 2. Ensure driver exists (or initialize if in onboarding state)
    let driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
    });

    if (!driver) {
      // Create minimal driver profile record if foreign key not yet seeded
      driver = await this.prisma.driver.create({
        data: {
          id: driverId,
          fullName: 'Captain Driver',
          phoneNumber: `+91${Math.floor(6000000000 + Math.random() * 3999999999)}`,
          isVerified: true,
        },
      });
    }

    // 3. Atomically deactivate any other vehicles if this one is active, then create
    const createdVehicle = await this.prisma.$transaction(async (tx) => {
      if (dto.isActiveVehicle) {
        await tx.vehicle.updateMany({
          where: { driverId, isActiveVehicle: true },
          data: { isActiveVehicle: false },
        });
      }

      return tx.vehicle.create({
        data: {
          driverId,
          plateNumber: dto.plateNumber,
          make: dto.make,
          model: dto.model,
          color: dto.color,
          fuelType: dto.fuelType,
          totalPhysicalSeats: dto.totalPhysicalSeats,
          bootCapacityTier: dto.bootCapacityTier,
          maxCabinBags: dto.maxCabinBags ?? 2,
          maxLargeBags: dto.maxLargeBags ?? 1,
          hasAC: dto.hasAC ?? true,
          isActiveVehicle: dto.isActiveVehicle ?? true,
          isVerified: false, // Default false until admin / FASTag verification
        },
      });
    });

    return this.formatVehicleResponse(createdVehicle);
  }

  /**
   * GET /api/v1/driver/vehicle/active
   * Retrieve current active vehicle details and capacity configuration for the authenticated driver.
   */
  async getActiveVehicle(driverId: string): Promise<VehicleResponse> {
    const activeVehicle = await this.prisma.vehicle.findFirst({
      where: {
        driverId,
        isActiveVehicle: true,
      },
    });

    if (!activeVehicle) {
      throw new NotFoundError(
        'No active vehicle found for this driver. Please register or activate a vehicle first.'
      );
    }

    return this.formatVehicleResponse(activeVehicle);
  }

  /**
   * PATCH /api/v1/driver/vehicle/capacity-matrix
   * Update dynamic boot space availability and toggle AC without modifying immutable registration details.
   */
  async updateCapacityMatrix(
    driverId: string,
    dto: UpdateCapacityMatrixDto
  ): Promise<VehicleResponse> {
    // 1. Fetch current active vehicle
    const activeVehicle = await this.prisma.vehicle.findFirst({
      where: {
        driverId,
        isActiveVehicle: true,
      },
    });

    if (!activeVehicle) {
      throw new NotFoundError(
        'Cannot update capacity matrix: no active vehicle registered for driver.'
      );
    }

    // 2. Validate requested capacity against tier constraints
    const effectiveTier = dto.bootCapacityTier ?? activeVehicle.bootCapacityTier;
    const effectiveCabinBags = dto.maxCabinBags ?? activeVehicle.maxCabinBags;
    const effectiveLargeBags = dto.maxLargeBags ?? activeVehicle.maxLargeBags;

    if (effectiveTier === 'ZERO_LUGGAGE') {
      if (effectiveCabinBags > 0 || effectiveLargeBags > 0) {
        throw new BadRequestError(
          'Vehicle boot is marked ZERO_LUGGAGE (e.g. CNG cylinder or zero boot space). Cabin and large bag capacities must be 0.'
        );
      }
    }

    if (effectiveTier === 'CABIN_BAGS_ONLY') {
      if (effectiveLargeBags > 0) {
        throw new BadRequestError(
          'Tier CABIN_BAGS_ONLY cannot accommodate large suitcases. Set large bags to 0 or upgrade tier.'
        );
      }
    }

    // 3. Update the dynamic fields
    const updatedVehicle = await this.prisma.vehicle.update({
      where: { id: activeVehicle.id },
      data: {
        ...(dto.bootCapacityTier && { bootCapacityTier: dto.bootCapacityTier }),
        ...(dto.maxCabinBags !== undefined && { maxCabinBags: dto.maxCabinBags }),
        ...(dto.maxLargeBags !== undefined && { maxLargeBags: dto.maxLargeBags }),
        ...(dto.hasAC !== undefined && { hasAC: dto.hasAC }),
      },
    });

    return this.formatVehicleResponse(updatedVehicle);
  }
}
