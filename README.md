# smartpool. Driver Interface Portal & Telemetry Engine

A next-generation Expressway Ride-Pooling Portal and Real-Time Telemetry Cockpit built for **smartpool.** Captains along the **Pune — Mumbai Yashwantrao Chavan Expressway (NH48)** corridor.

Built with **React 19, Tailwind CSS, Leaflet, Node.js/TypeScript, Prisma ORM, and WebSockets (`ws`)**.

---

## 🌟 Overview & Key Capabilities

1. **Active Ride Manifest & Multi-Stop Tracking Cockpit**:
   - Replaces control panels during live trips with an algorithmically ordered multi-stop sequential queue constrained strictly within the **≤ 15% Detour Guarantee**.
   - **Current Active Stop Card**: Amber double-border glow, rider details, one-tap calling/chat, luggage baggage verification, and 4-digit numeric OTP boarding validation (`Verify & Board`).
   - **Sequential Queue Timeline**: Vertical dashed timeline connecting upcoming pickups and drop-offs with detour and yield metrics.
   - **Emergency / SOS Trigger**: Instant 24x7 highway patrol notification.

2. **Live Multi-Stop Highway Map**:
   - CartoDB Dark Matter tile rendering with full high-contrast matte black styling.
   - Interactive multi-stop polyline tracing Driver ➔ P1 (Hinjawadi) ➔ P2 (Wakad) ➔ Expressway Corridor ➔ D1 (Vashi) ➔ D2 (Chembur).
   - Moving driver vehicle marker with dynamic heading directional arrow.
   - Numbered pickup pins (`P1: Sameer`, `P2: Priya`) and drop-off pins (`D1: Sameer`, `D2: Priya`).
   - Floating turn-by-turn navigation card: `Turn left in 300m toward Mumbai Expressway Entry`.

3. **Vehicle Profile & Physical Capacity Matrix**:
   - Live Fastag-verified vehicle badge (`Tata Nexon EV Max • MH 12 RN 8820`).
   - Segmented trunk capacity allocation cards: `Zero Luggage`, `Cabin Bags Only`, `Large Suitcases`.
   - Dynamic bag steppers with algorithmic trunk constraint locking.

4. **Shapley Value Fair-Share Payout Tracker**:
   - Live comparative payout estimator: Solo trip (`₹950`) vs. Pooled batch (`₹1,680`, `+76% Synergy`).
   - Automated marginal cost settlement disbursed directly upon batch completion.

---

## 🏗️ Repository Architecture

```text
Driver-Interface-UI/
├── src/                               # Frontend Application (React 19 + Vite)
│   ├── components/
│   │   ├── ActiveManifestCockpit.jsx  # Multi-stop sequential queue & OTP verification
│   │   ├── CorridorMap.jsx            # Leaflet map with multi-stop polyline & custom pins
│   │   ├── DriverProfileCard.jsx      # Control card with seat matrix & Shapley card
│   │   ├── Navbar.jsx                 # Top bar with in-trip pill and live occupancy
│   │   ├── ShiftLogView.jsx           # Shift telemetry & CSV export
│   │   ├── Toast.jsx                  # Floating notification toast
│   │   └── VehicleCapacityView.jsx    # Trunk capacity & luggage allocation matrix
│   ├── data/
│   │   └── corridorData.js            # NH48 coordinates, waypoints & mock batches
│   ├── App.jsx                        # Root application
│   └── index.css                      # Tailwind & dark theme styling
├── backend/                           # Backend Microservices (Node.js + Prisma)
│   ├── prisma/
│   │   └── schema.prisma              # Driver, Vehicle, TripBatch & ManifestStop models
│   ├── src/
│   │   ├── modules/
│   │   │   ├── trip-manifest/         # Manifest REST router, service & WebSocket gateway
│   │   │   └── vehicle/               # Vehicle profile & capacity matrix module
│   │   ├── test-demo.ts               # Manifest lifecycle & Shapley settlement runner
│   │   ├── test-ws.ts                 # Real-time WebSocket telemetry test suite
│   │   └── index.ts                   # Unified HTTP + WS server entrypoint
│   └── package.json
└── package.json
```

---

## 🚀 Quick Start

### 1. Frontend Portal
```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev

# Lint & build
npm run lint
npm run build
```
Opens on **`http://localhost:5173/`**.

### 2. Backend Services
```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Build TypeScript
npm run build

# Run automated verification test suites
npm run test:demo   # Tests active manifest retrieval, OTP boarding & drop-off settlement
npm run test:ws     # Tests real-time WebSocket telemetry gateway (/ws/telemetry)
```
WebSocket endpoint runs at **`ws://localhost:4000/ws/telemetry`**.

---

## 📡 Telemetry Socket Events (`/ws/telemetry`)

| Event Name | Direction | Payload | Behavior |
|---|---|---|---|
| `driver:location_ping` | Client ➔ Server | `{ tripBatchId, lat, lng, bearing, speed }` | Broadcasts vehicle position to riders in this batch every 3-4s |
| `driver:verify_boarding`| Client ➔ Server | `{ stopId, otp }` | Validates 4-digit OTP, increments live occupancy, marks stop `COMPLETED` |
| `driver:complete_dropoff`| Client ➔ Server | `{ stopId }` | Decrements occupancy. When last stop completes, triggers Shapley payout settlement |

---

## 🛡️ License & Trademarks
Developed for the **smartpool.** Driver Interface Portal. All rights reserved.
