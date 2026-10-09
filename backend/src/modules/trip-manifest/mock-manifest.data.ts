import { TripStatus, StopType, StopStatus } from './dto/manifest.dto';

export interface SeededStop {
  id: string;
  riderId: string;
  riderName: string;
  stopType: StopType;
  sequenceOrder: number;
  locationName: string;
  latitude: number;
  longitude: number;
  passengerCount: number;
  luggageCount: number;
  boardingOtp: string;
  status: StopStatus;
  estimatedArrival: Date;
}

export interface SeededTripBatch {
  id: string;
  driverId: string;
  corridorName: string;
  status: TripStatus;
  totalShapleyPayout: number;
  currentOccupancy: number;
  maxCapacity: number;
  stops: SeededStop[];
}

export function generateMockNH48TripBatch(
  driverId = '550e8400-e29b-41d4-a716-446655440000'
): SeededTripBatch {
  const tripBatchId = '88219011-3c4a-4bb5-9011-abcdef123456';
  const now = Date.now();

  return {
    id: tripBatchId,
    driverId,
    corridorName: 'Pune -> Mumbai Expressway (NH48)',
    status: 'IN_PROGRESS',
    totalShapleyPayout: 1680.0,
    currentOccupancy: 2,
    maxCapacity: 3,
    stops: [
      {
        id: '11111111-1111-1111-1111-111111111111',
        riderId: 'a1b2c3d4-0001-4000-8000-000000000001',
        riderName: 'Rahul Sharma',
        stopType: 'PICKUP',
        sequenceOrder: 1,
        locationName: 'Pune Kiwale Toll Plaza (Km 0)',
        latitude: 18.6477,
        longitude: 73.7438,
        passengerCount: 1,
        luggageCount: 1,
        boardingOtp: '4821',
        status: 'COMPLETED',
        estimatedArrival: new Date(now - 45 * 60 * 1000), // 45 mins ago
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        riderId: 'a1b2c3d4-0002-4000-8000-000000000002',
        riderName: 'Priya Kulkarni',
        stopType: 'PICKUP',
        sequenceOrder: 2,
        locationName: 'Talegaon Interchange (Km 18)',
        latitude: 18.7351,
        longitude: 73.6749,
        passengerCount: 1,
        luggageCount: 1,
        boardingOtp: '7392',
        status: 'COMPLETED',
        estimatedArrival: new Date(now - 20 * 60 * 1000), // 20 mins ago
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        riderId: 'a1b2c3d4-0003-4000-8000-000000000003',
        riderName: 'Amit Verma',
        stopType: 'PICKUP',
        sequenceOrder: 3,
        locationName: 'Lonavala Expressway Gate (Km 58)',
        latitude: 18.7557,
        longitude: 73.4091,
        passengerCount: 1,
        luggageCount: 1,
        boardingOtp: '1934',
        status: 'PENDING',
        estimatedArrival: new Date(now + 8 * 60 * 1000), // in 8 mins
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        riderId: 'a1b2c3d4-0001-4000-8000-000000000001',
        riderName: 'Rahul Sharma',
        stopType: 'DROPOFF',
        sequenceOrder: 4,
        locationName: 'Vashi Creek Bridge Hub (Km 135)',
        latitude: 19.0664,
        longitude: 72.9982,
        passengerCount: 1,
        luggageCount: 1,
        boardingOtp: '0000',
        status: 'PENDING',
        estimatedArrival: new Date(now + 65 * 60 * 1000), // in 65 mins
      },
      {
        id: '55555555-5555-5555-5555-555555555555',
        riderId: 'a1b2c3d4-0002-4000-8000-000000000002',
        riderName: 'Priya Kulkarni',
        stopType: 'DROPOFF',
        sequenceOrder: 5,
        locationName: 'Mankhurd Link Hub (Km 142)',
        latitude: 19.0589,
        longitude: 72.9645,
        passengerCount: 1,
        luggageCount: 1,
        boardingOtp: '0000',
        status: 'PENDING',
        estimatedArrival: new Date(now + 75 * 60 * 1000), // in 75 mins
      },
      {
        id: '66666666-6666-6666-6666-666666666666',
        riderId: 'a1b2c3d4-0003-4000-8000-000000000003',
        riderName: 'Amit Verma',
        stopType: 'DROPOFF',
        sequenceOrder: 6,
        locationName: 'Chembur Amar Mahal Hub (Mumbai Km 148)',
        latitude: 19.0521,
        longitude: 72.9245,
        passengerCount: 1,
        luggageCount: 1,
        boardingOtp: '0000',
        status: 'PENDING',
        estimatedArrival: new Date(now + 85 * 60 * 1000), // in 85 mins
      },
    ],
  };
}
