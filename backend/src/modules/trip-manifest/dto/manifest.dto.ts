import { z } from 'zod';

// ============================================================================
// ENUM DEFINITIONS
// ============================================================================

export const TripStatusEnum = z.enum([
  'BATCHING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);
export type TripStatus = z.infer<typeof TripStatusEnum>;

export const StopTypeEnum = z.enum(['PICKUP', 'DROPOFF']);
export type StopType = z.infer<typeof StopTypeEnum>;

export const StopStatusEnum = z.enum([
  'PENDING',
  'ARRIVED',
  'COMPLETED',
  'SKIPPED',
]);
export type StopStatus = z.infer<typeof StopStatusEnum>;

// ============================================================================
// 1. TELEMETRY & SOCKET SCHEMAS
// ============================================================================

/**
 * Event: driver:location_ping
 * Driver streams GPS location every 3-4 seconds.
 */
export const LocationPingSchema = z.object({
  tripBatchId: z.string().uuid('Invalid TripBatch UUID'),
  lat: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
  lng: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
  bearing: z.number().min(0).max(360, 'Bearing must be between 0 and 360 degrees').default(0),
  speed: z.number().min(0, 'Speed must be non-negative (km/h)').default(0),
  timestamp: z.number().optional().default(() => Date.now()),
});

export type LocationPingDto = z.infer<typeof LocationPingSchema>;

/**
 * Event: driver:verify_boarding
 * Driver submits 4-digit OTP provided by rider at pickup.
 */
export const VerifyBoardingSchema = z.object({
  stopId: z.string().uuid('Invalid ManifestStop UUID'),
  otp: z
    .string()
    .trim()
    .regex(/^[0-9]{4}$/, 'Boarding OTP must be exactly a 4-digit code (e.g. "4821")'),
});

export type VerifyBoardingDto = z.infer<typeof VerifyBoardingSchema>;

/**
 * Event: driver:complete_dropoff
 * Driver marks passenger drop-off complete.
 */
export const CompleteDropoffSchema = z.object({
  stopId: z.string().uuid('Invalid ManifestStop UUID'),
});

export type CompleteDropoffDto = z.infer<typeof CompleteDropoffSchema>;

/**
 * REST: POST /api/v1/driver/stops/:stopId/arrived
 */
export const ArrivedStopParamsSchema = z.object({
  stopId: z.string().uuid('Invalid ManifestStop UUID parameter'),
});

export type ArrivedStopParams = z.infer<typeof ArrivedStopParamsSchema>;

// ============================================================================
// 2. RESPONSE DTO INTERFACES
// ============================================================================

export interface ManifestStopItem {
  id: string;
  tripBatchId: string;
  riderId: string;
  riderName: string;
  stopType: StopType;
  sequenceOrder: number;
  locationName: string;
  latitude: number;
  longitude: number;
  passengerCount: number;
  luggageCount: number;
  status: StopStatus;
  estimatedArrival: Date | string;
  isNextActionableStop: boolean;
}

export interface ActiveManifestResponse {
  tripBatchId: string;
  corridorName: string;
  status: TripStatus;
  totalShapleyPayout: number;
  payoutCurrency: string;
  currentOccupancy: number;
  maxCapacity: number;
  nextStop: ManifestStopItem | null;
  progress: {
    completedStops: number;
    totalStops: number;
    percentComplete: number;
  };
  stops: ManifestStopItem[];
}
