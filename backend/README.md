# SmartPool Backend: Driver Portal Services

A modular, production-grade backend service built with **Node.js, TypeScript, Prisma ORM, WebSockets (`ws`), and Zod** for the `smartpool.` expressway ride-pooling platform.

---

## Architecture Overview

```text
backend/
├── prisma/
│   └── schema.prisma                 # Driver, Vehicle, TripBatch & ManifestStop models
├── src/
│   ├── modules/
│   │   ├── vehicle/                  # Vehicle Profile & Capacity Matrix Module
│   │   │   ├── dto/vehicle.dto.ts
│   │   │   ├── vehicle.service.ts
│   │   │   ├── vehicle.router.ts
│   │   │   ├── vehicle.controller.ts
│   │   │   └── vehicle.module.ts
│   │   └── trip-manifest/            # Active Trip Manifest & Telemetry Service
│   │       ├── dto/manifest.dto.ts   # Zod validation schemas
│   │       ├── manifest.service.ts   # Manifest queue, boarding & settlement logic
│   │       ├── manifest.router.ts    # REST API endpoints
│   │       ├── telemetry.gateway.ts  # Real-time WebSocket server
│   │       └── mock-manifest.data.ts # NH48 expressway batch generator
│   ├── common/
│   │   ├── prisma.service.ts         # PrismaClient singleton
│   │   ├── errors/app-error.ts       # Standardized HTTP error hierarchy
│   │   └── middleware/               # Auth & Zod validation middleware
│   ├── index.ts                      # Central HTTP + WebSocket entry point
│   └── test-demo.ts                  # Verification test runner
├── package.json
└── tsconfig.json
```

---

## 1. Database Schema (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum FuelType {
  EV
  PETROL
  DIESEL
  CNG
}

enum BootCapacityTier {
  ZERO_LUGGAGE       // CNG cylinder in boot or subcompact hatch
  CABIN_BAGS_ONLY    // Compact boot (1-2 small trolley bags max)
  LARGE_SUITCASES    // Full sedan / SUV boot (2+ large travel suitcases)
}

enum TripStatus {
  BATCHING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum StopType {
  PICKUP
  DROPOFF
}

enum StopStatus {
  PENDING
  ARRIVED
  COMPLETED
  SKIPPED
}

model Driver {
  id              String      @id @default(uuid()) @db.Uuid
  fullName        String      @db.VarChar(120)
  phoneNumber     String      @unique @db.VarChar(20)
  email           String?     @unique @db.VarChar(120)
  isVerified      Boolean     @default(false)
  isActive        Boolean     @default(true)
  vehicles        Vehicle[]
  tripBatches     TripBatch[]
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  @@map("drivers")
}

model Vehicle {
  id                  String            @id @default(uuid()) @db.Uuid
  driverId            String            @db.Uuid
  driver              Driver            @relation(fields: [driverId], references: [id], onDelete: Cascade)
  plateNumber         String            @unique @db.VarChar(20)
  make                String            @db.VarChar(60)
  model               String            @db.VarChar(60)
  color               String            @db.VarChar(40)
  fuelType            FuelType
  totalPhysicalSeats  Int
  bootCapacityTier    BootCapacityTier
  maxCabinBags        Int               @default(2)
  maxLargeBags        Int               @default(1)
  hasAC               Boolean           @default(true)
  isVerified          Boolean           @default(false)
  isActiveVehicle     Boolean           @default(true)
  tripBatches         TripBatch[]
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt
  @@index([driverId, isActiveVehicle])
  @@index([plateNumber])
  @@map("vehicles")
}

model TripBatch {
  id                  String            @id @default(uuid()) @db.Uuid
  driverId            String            @db.Uuid
  driver              Driver            @relation(fields: [driverId], references: [id], onDelete: Cascade)
  vehicleId           String            @db.Uuid
  vehicle             Vehicle           @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  corridorName        String            @db.VarChar(120) // e.g. "Pune -> Mumbai Expressway"
  status              TripStatus        @default(IN_PROGRESS)
  totalShapleyPayout  Float             // Computed driver payout via Shapley value
  currentOccupancy    Int               @default(0)
  maxCapacity         Int               @default(3)
  stops               ManifestStop[]
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt
  @@index([driverId, status])
  @@map("trip_batches")
}

model ManifestStop {
  id                  String            @id @default(uuid()) @db.Uuid
  tripBatchId         String            @db.Uuid
  tripBatch           TripBatch         @relation(fields: [tripBatchId], references: [id], onDelete: Cascade)
  riderId             String            @db.Uuid
  riderName           String            @db.VarChar(120)
  stopType            StopType                          // PICKUP or DROPOFF
  sequenceOrder       Int                               // 1, 2, 3... execution order
  locationName        String            @db.VarChar(200)
  latitude            Float
  longitude           Float
  passengerCount      Int               @default(1)
  luggageCount        Int               @default(1)
  boardingOtp         String?           @db.VarChar(6)  // 4-digit verification code
  status              StopStatus        @default(PENDING) // PENDING, ARRIVED, COMPLETED, SKIPPED
  estimatedArrival    DateTime
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt
  @@index([tripBatchId, sequenceOrder])
  @@index([tripBatchId, status])
  @@map("manifest_stops")
}
```

---

## 2. Real-Time Telemetry & WebSockets (`/ws/telemetry`)

Connect with:
```text
ws://localhost:4000/ws/telemetry?driverId=550e8400-e29b-41d4-a716-446655440000
```

### Event 1: `driver:location_ping`
The driver streams telemetry every 3–4 seconds. The gateway broadcasts the live vehicle coordinates to all co-riders in the batch.

**Client Payload**:
```json
{
  "event": "driver:location_ping",
  "data": {
    "tripBatchId": "88219011-3c4a-4bb5-9011-abcdef123456",
    "lat": 18.7557,
    "lng": 73.4091,
    "bearing": 312,
    "speed": 84.5
  }
}
```

**Gateway Ack**:
```json
{
  "event": "driver:location_ack",
  "data": {
    "tripBatchId": "88219011-3c4a-4bb5-9011-abcdef123456",
    "timestamp": 1728522600000
  }
}
```

---

### Event 2: `driver:verify_boarding`
Validates the rider's 4-digit boarding code. On success, increments `currentOccupancy`, marks the stop `COMPLETED`, and advances the active stop sequence.

**Client Payload**:
```json
{
  "event": "driver:verify_boarding",
  "data": {
    "stopId": "33333333-3333-3333-3333-333333333333",
    "otp": "1934"
  }
}
```

**Gateway Broadcast**:
```json
{
  "event": "driver:boarding_verified",
  "data": {
    "success": true,
    "verifiedRider": "Amit Verma",
    "currentOccupancy": 3,
    "completedStopId": "33333333-3333-3333-3333-333333333333",
    "message": "OTP verified! Amit Verma boarded. Occupancy: 3 seats."
  }
}
```

---

### Event 3: `driver:complete_dropoff`
Marks the drop-off complete and decrements `currentOccupancy`. If all stops are complete, closes the `TripBatch` and triggers Shapley payout settlement.

**Client Payload**:
```json
{
  "event": "driver:complete_dropoff",
  "data": {
    "stopId": "66666666-6666-6666-6666-666666666666"
  }
}
```

**Gateway Broadcast**:
```json
{
  "event": "driver:dropoff_completed",
  "data": {
    "success": true,
    "riderName": "Amit Verma",
    "currentOccupancy": 0,
    "tripFinished": true,
    "totalShapleyPayout": 1680.0,
    "settlementStatus": "SETTLED_TO_UPI",
    "message": "All stops completed! Trip finished. Shapley payout ₹1680 settled."
  }
}
```

---

## 3. REST API Endpoints

### 1. `GET /api/v1/driver/trips/active-manifest`
Retrieves the driver's active batch, ordered stops, next actionable stop, and total expected Shapley payout.

**Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Active trip manifest retrieved successfully",
  "data": {
    "tripBatchId": "88219011-3c4a-4bb5-9011-abcdef123456",
    "corridorName": "Pune -> Mumbai Expressway (NH48)",
    "status": "IN_PROGRESS",
    "totalShapleyPayout": 1680.0,
    "payoutCurrency": "INR",
    "currentOccupancy": 2,
    "maxCapacity": 3,
    "progress": {
      "completedStops": 2,
      "totalStops": 6,
      "percentComplete": 33
    },
    "nextStop": {
      "id": "33333333-3333-3333-3333-333333333333",
      "riderName": "Amit Verma",
      "stopType": "PICKUP",
      "sequenceOrder": 3,
      "locationName": "Lonavala Expressway Gate (Km 58)",
      "status": "PENDING",
      "isNextActionableStop": true
    },
    "stops": [...]
  }
}
```

---

### 2. `POST /api/v1/driver/stops/:stopId/arrived`
Registers driver arrival at a stop and triggers real-time passenger arrival notification.

**Response (`200 OK`)**:
```json
{
  "success": true,
  "message": "Driver arrival registered for PICKUP stop at Lonavala Expressway Gate (Km 58). Passenger notified.",
  "data": {
    "id": "33333333-3333-3333-3333-333333333333",
    "status": "ARRIVED",
    "locationName": "Lonavala Expressway Gate (Km 58)"
  }
}
```

---

## 4. Verification Suite

Run the automated test runner in `backend/`:
```bash
npm run build
node dist/test-demo.js
```
