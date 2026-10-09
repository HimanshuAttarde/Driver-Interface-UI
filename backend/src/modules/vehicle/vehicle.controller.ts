import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UsePipes,
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';
import { VehicleService } from './vehicle.service';
import {
  CreateVehicleSchema,
  CreateVehicleDto,
  UpdateCapacityMatrixSchema,
  UpdateCapacityMatrixDto,
  VehicleResponse,
} from './dto/vehicle.dto';

// ----------------------------------------------------------------------------
// Custom Zod Validation Pipe for NestJS
// ----------------------------------------------------------------------------
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestException({
          message: 'Validation failed on vehicle payload',
          errors: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
            code: e.code,
          })),
        });
      }
      throw new BadRequestException('Validation failed');
    }
  }
}

// ----------------------------------------------------------------------------
// Custom Decorator to extract authenticated Driver ID from request context
// ----------------------------------------------------------------------------
export const CurrentDriverId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const driverId = request.headers['x-driver-id'] || request.user?.id || request.driverId;
    if (!driverId) {
      throw new BadRequestException('Missing authenticated driver ID (x-driver-id header or auth token)');
    }
    return driverId;
  }
);

// ----------------------------------------------------------------------------
// NestJS Controller
// ----------------------------------------------------------------------------
@Controller('api/v1/driver/vehicle')
export class VehicleController {
  constructor(
    @Inject(VehicleService)
    private readonly vehicleService: VehicleService
  ) {}

  /**
   * POST /api/v1/driver/vehicle
   * Register a new vehicle linked to the authenticated driver.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(CreateVehicleSchema))
  async registerVehicle(
    @CurrentDriverId() driverId: string,
    @Body() dto: CreateVehicleDto
  ): Promise<{ success: boolean; message: string; data: VehicleResponse }> {
    const vehicle = await this.vehicleService.registerVehicle(driverId, dto);
    return {
      success: true,
      message: 'Vehicle registered successfully and marked as active dispatch vehicle',
      data: vehicle,
    };
  }

  /**
   * GET /api/v1/driver/vehicle/active
   * Retrieve current active vehicle details and live capacity matrix.
   */
  @Get('active')
  @HttpCode(HttpStatus.OK)
  async getActiveVehicle(
    @CurrentDriverId() driverId: string
  ): Promise<{ success: boolean; message: string; data: VehicleResponse }> {
    const vehicle = await this.vehicleService.getActiveVehicle(driverId);
    return {
      success: true,
      message: 'Active vehicle and capacity matrix retrieved successfully',
      data: vehicle,
    };
  }

  /**
   * PATCH /api/v1/driver/vehicle/capacity-matrix
   * Dynamically update active boot space, luggage limits, and AC availability.
   */
  @Patch('capacity-matrix')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(UpdateCapacityMatrixSchema))
  async updateCapacityMatrix(
    @CurrentDriverId() driverId: string,
    @Body() dto: UpdateCapacityMatrixDto
  ): Promise<{ success: boolean; message: string; data: VehicleResponse }> {
    const vehicle = await this.vehicleService.updateCapacityMatrix(driverId, dto);
    return {
      success: true,
      message: 'Physical capacity matrix updated and synced with batching engine',
      data: vehicle,
    };
  }
}
