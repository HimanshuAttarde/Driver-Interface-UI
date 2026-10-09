import { z } from 'zod';

// ============================================================================
// ENUM DEFINITIONS (Matching Prisma Schema)
// ============================================================================

export const FuelTypeEnum = z.enum(['EV', 'PETROL', 'DIESEL', 'CNG']);
export type FuelType = z.infer<typeof FuelTypeEnum>;

export const BootCapacityTierEnum = z.enum([
  'ZERO_LUGGAGE',
  'CABIN_BAGS_ONLY',
  'LARGE_SUITCASES',
]);
export type BootCapacityTier = z.infer<typeof BootCapacityTierEnum>;

// ============================================================================
// PLATE NUMBER SANITIZATION & VALIDATION
// Standard Indian High Security Registration Plate (HSRP) format:
// e.g., "MH 12 AB 1234", "DL-01-CA-9999", "KA03MG4567", "MH14JM8821"
// ============================================================================

const cleanPlateNumber = (rawPlate: string): string => {
  return rawPlate
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, ''); // strip spaces, hyphens, dots
};

const PlateNumberSchema = z
  .string({ required_error: 'Plate number is required' })
  .min(4, 'Plate number must be at least 4 characters')
  .max(16, 'Plate number cannot exceed 16 characters')
  .transform(cleanPlateNumber)
  .refine(
    (val) => /^[A-Z]{2}[0-9]{1,3}[A-Z]{0,3}[0-9]{4}$/.test(val) || /^[A-Z0-9]{5,12}$/.test(val),
    {
      message:
        'Invalid plate number format. Example valid formats: "MH12AB1234", "MH 14 JM 8821"',
    }
  );

// ============================================================================
// 1. CREATE VEHICLE SCHEMA
// Validates identification, sanitizes registration plate, enforces physical limits
// ============================================================================

export const CreateVehicleSchema = z
  .object({
    plateNumber: PlateNumberSchema,
    make: z
      .string({ required_error: 'Vehicle make is required' })
      .trim()
      .min(2, 'Vehicle make must be at least 2 characters')
      .max(60, 'Vehicle make must not exceed 60 characters'),
    model: z
      .string({ required_error: 'Vehicle model is required' })
      .trim()
      .min(1, 'Vehicle model must be at least 1 character')
      .max(60, 'Vehicle model must not exceed 60 characters'),
    color: z
      .string({ required_error: 'Vehicle color is required' })
      .trim()
      .min(2, 'Vehicle color must be at least 2 characters')
      .max(40, 'Vehicle color must not exceed 40 characters'),
    fuelType: FuelTypeEnum,
    totalPhysicalSeats: z
      .number({ required_error: 'Total physical seats is required' })
      .int('Physical seats must be an integer')
      .min(1, 'Total physical seats must be at least 1 (excluding driver)')
      .max(8, 'Total physical seats cannot exceed 8 for passenger pooling'),
    bootCapacityTier: BootCapacityTierEnum,
    maxCabinBags: z
      .number()
      .int('Cabin bags must be an integer')
      .min(0, 'Max cabin bags cannot be negative')
      .max(8, 'Max cabin bags cannot exceed 8')
      .default(2),
    maxLargeBags: z
      .number()
      .int('Large bags must be an integer')
      .min(0, 'Max large bags cannot be negative')
      .max(4, 'Max large bags cannot exceed 4')
      .default(1),
    hasAC: z.boolean().default(true),
    isActiveVehicle: z.boolean().default(true),
  })
  // Enforce luggage invariants according to boot capacity tier
  .superRefine((data, ctx) => {
    if (data.bootCapacityTier === 'ZERO_LUGGAGE') {
      if (data.maxCabinBags > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'ZERO_LUGGAGE tier vehicles cannot accommodate cabin bags',
          path: ['maxCabinBags'],
        });
      }
      if (data.maxLargeBags > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'ZERO_LUGGAGE tier vehicles cannot accommodate large bags',
          path: ['maxLargeBags'],
        });
      }
    }

    if (data.bootCapacityTier === 'CABIN_BAGS_ONLY') {
      if (data.maxLargeBags > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'CABIN_BAGS_ONLY tier cannot accept large suitcases',
          path: ['maxLargeBags'],
        });
      }
    }
  });

export type CreateVehicleDto = z.infer<typeof CreateVehicleSchema>;

// ============================================================================
// 2. UPDATE CAPACITY MATRIX SCHEMA
// Dynamically adjusts boot availability and comfort without altering registration
// ============================================================================

export const UpdateCapacityMatrixSchema = z
  .object({
    bootCapacityTier: BootCapacityTierEnum.optional(),
    maxCabinBags: z
      .number()
      .int('Cabin bags must be an integer')
      .min(0, 'Max cabin bags cannot be negative')
      .max(8, 'Max cabin bags cannot exceed 8')
      .optional(),
    maxLargeBags: z
      .number()
      .int('Large bags must be an integer')
      .min(0, 'Max large bags cannot be negative')
      .max(4, 'Max large bags cannot exceed 4')
      .optional(),
    hasAC: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    // If bootCapacityTier is being updated to ZERO_LUGGAGE
    if (data.bootCapacityTier === 'ZERO_LUGGAGE') {
      if (data.maxCabinBags && data.maxCabinBags > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Cannot set cabin bags > 0 when tier is ZERO_LUGGAGE',
          path: ['maxCabinBags'],
        });
      }
      if (data.maxLargeBags && data.maxLargeBags > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Cannot set large bags > 0 when tier is ZERO_LUGGAGE',
          path: ['maxLargeBags'],
        });
      }
    }

    // If bootCapacityTier is being updated to CABIN_BAGS_ONLY
    if (data.bootCapacityTier === 'CABIN_BAGS_ONLY') {
      if (data.maxLargeBags && data.maxLargeBags > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Cannot accept large suitcases in CABIN_BAGS_ONLY tier',
          path: ['maxLargeBags'],
        });
      }
    }
  });

export type UpdateCapacityMatrixDto = z.infer<typeof UpdateCapacityMatrixSchema>;

// ============================================================================
// 3. TELEMETRY & RESPONSE DATA STRUCTURES
// Formatted output for driver app UI and SmartPool batching engine
// ============================================================================

export interface BatchingCapacityMatrix {
  availablePassengerSeats: number;
  availableCabinBags: number;
  availableLargeBags: number;
  isAirConditioned: number | boolean;
  bootTier: BootCapacityTier;
  comfortRating: 'STANDARD' | 'PREMIUM_EV' | 'ECO';
  luggageAcceptanceReady: boolean;
}

export interface VehicleResponse {
  id: string;
  driverId: string;
  plateNumber: string;
  make: string;
  model: string;
  color: string;
  fuelType: FuelType;
  totalPhysicalSeats: number;
  bootCapacityTier: BootCapacityTier;
  maxCabinBags: number;
  maxLargeBags: number;
  hasAC: boolean;
  isVerified: boolean;
  isActiveVehicle: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Live computed matrix for batching engine
  batchingConstraints: BatchingCapacityMatrix;
}
