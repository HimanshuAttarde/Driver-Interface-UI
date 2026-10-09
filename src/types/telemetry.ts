// TypeScript definitions for SmartPool Driver Telemetry & GPS Tracking

export interface TelemetryCoords {
  lat: number;
  lng: number;
  heading: number; // 0 - 360 degrees
  speed: number; // km/h
  accuracy: number; // meters
}

export interface DriverPingPayload {
  driverId: string;
  tripBatchId: string;
  coords: {
    lat: number;
    lng: number;
    heading: number;
    speed: number;
    accuracy: number;
  };
  timestamp: number;
}

export type TelemetryStatus =
  | 'active' // Real GPS lock acquired and streaming
  | 'simulated' // Fallback / Dev NH48 playback simulator active
  | 'reconnecting' // Socket connection dropped, buffering pings
  | 'connecting' // Initializing GPS watcher or socket handshake
  | 'denied' // Browser geolocation permission denied
  | 'offline'; // Standby / Driver offline

export type CameraMode = 'free' | 'locked';

export interface UseDriverTelemetryOptions {
  isOnline: boolean;
  isInTrip: boolean;
  driverId?: string;
  tripBatchId?: string;
  authToken?: string;
  gatewayUrl?: string;
  enableSimulation?: boolean;
  routePolyline?: [number, number][];
}

export interface UseDriverTelemetryReturn {
  rawCoords: TelemetryCoords | null;
  interpolatedCoords: TelemetryCoords | null;
  status: TelemetryStatus;
  isSimulating: boolean;
  setSimulating: (sim: boolean) => void;
  toggleSimulation: () => void;
  isReconnecting: boolean;
  bufferedPingsCount: number;
  reconnectAttempts: number;
  cameraMode: CameraMode;
  setCameraMode: (mode: CameraMode) => void;
  toggleCameraMode: () => void;
  corridorStatus: string;
  lastPingTime: number | null;
  speedKmh: number;
  headingDeg: number;
  accuracyMeters: number;
}
