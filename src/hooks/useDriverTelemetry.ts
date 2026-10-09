import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  TelemetryCoords,
  TelemetryStatus,
  CameraMode,
  DriverPingPayload,
  UseDriverTelemetryOptions,
  UseDriverTelemetryReturn,
} from '../types/telemetry';
import {
  getDistanceMeters,
  calculateBearing,
  lerp,
  lerpAngle,
} from '../utils/geoMath';
import { MULTI_STOP_ROUTE_POLYLINE } from '../data/corridorData';

const DEFAULT_CORRIDOR_ROUTE = MULTI_STOP_ROUTE_POLYLINE;
const EMIT_CADENCE_MS = 3000;
const MAX_BUFFERED_PINGS = 5;
const ACCURACY_THRESHOLD_METERS = 30;
const JITTER_DISTANCE_METERS = 2;

/**
 * useDriverTelemetry
 *
 * Production-ready React hook for real-time driver GPS telemetry:
 * 1. Tracks browser geolocation (navigator.geolocation.watchPosition) with jitter filters.
 * 2. Emits throttled telemetry via Socket.io at 3-second cadence to /telemetry.
 * 3. Smooths coordinates using requestAnimationFrame linear interpolation (Lerp).
 * 4. Provides highway route playback simulator for local development or permission denial.
 * 5. Manages offline ping buffering and reconnection status.
 */
export function useDriverTelemetry({
  isOnline,
  isInTrip,
  driverId = '550e8400-e29b-41d4-a716-446655440000',
  tripBatchId = 'SP-BATCH-944',
  authToken,
  gatewayUrl = 'http://localhost:3000',
  enableSimulation = true,
  routePolyline = DEFAULT_CORRIDOR_ROUTE,
}: UseDriverTelemetryOptions): UseDriverTelemetryReturn {
  // Coords states
  const [rawCoords, setRawCoords] = useState<TelemetryCoords | null>(() => {
    const start = routePolyline[0] || [18.587, 73.731];
    return {
      lat: start[0],
      lng: start[1],
      heading: 45,
      speed: 64,
      accuracy: 4,
    };
  });

  const [interpolatedCoords, setInterpolatedCoords] = useState<TelemetryCoords | null>(rawCoords);
  const [isSimulating, setIsSimulating] = useState<boolean>(enableSimulation);
  const [isGpsActive, setIsGpsActive] = useState<boolean>(false);
  const [isPermissionDenied, setIsPermissionDenied] = useState<boolean>(false);
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const [bufferedPingsCount, setBufferedPingsCount] = useState<number>(0);
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
  const [cameraMode, setCameraMode] = useState<CameraMode>('locked');
  const [lastPingTime, setLastPingTime] = useState<number | null>(null);

  // Derive TelemetryStatus during render to prevent unnecessary cascading renders
  const status: TelemetryStatus = !isOnline
    ? 'offline'
    : isPermissionDenied
    ? 'denied'
    : isReconnecting
    ? 'reconnecting'
    : isSimulating
    ? 'simulated'
    : isGpsActive
    ? 'active'
    : 'connecting';

  // Refs for tracking animation & sockets without re-renders
  const socketRef = useRef<Socket | null>(null);
  const bufferedPingsRef = useRef<DriverPingPayload[]>([]);
  const simIndexRef = useRef<number>(0);
  const lastRawCoordsRef = useRef<TelemetryCoords | null>(rawCoords);
  const lastEmitTimeRef = useRef<number>(0);

  // Lerp Animation Refs
  const animStartCoordsRef = useRef<TelemetryCoords | null>(rawCoords);
  const animTargetCoordsRef = useRef<TelemetryCoords | null>(rawCoords);
  const animStartTimeRef = useRef<number>(0);
  const interpolatedCoordsRef = useRef<TelemetryCoords | null>(rawCoords);

  // Sync ref
  useEffect(() => {
    interpolatedCoordsRef.current = interpolatedCoords;
  }, [interpolatedCoords]);

  // Toggle Camera Mode
  const toggleCameraMode = useCallback(() => {
    setCameraMode((prev) => (prev === 'locked' ? 'free' : 'locked'));
  }, []);

  // Toggle Simulation
  const toggleSimulation = useCallback(() => {
    setIsSimulating((prev) => !prev);
  }, []);

  // Set simulation directly
  const setSimulating = useCallback((sim: boolean) => {
    setIsSimulating(sim);
  }, []);

  // --------------------------------------------------------------------------
  // 1. Socket.io Telemetry Emitter Gateway Connection
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isOnline) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    try {
      const socket = io(gatewayUrl, {
        path: '/telemetry',
        transports: ['websocket', 'polling'],
        auth: { token: authToken || localStorage.getItem('smartpool_access_token') || 'demo-driver-token' },
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: Infinity,
        timeout: 5000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        setIsReconnecting(false);
        setReconnectAttempts(0);

        // Flush buffered pings if any were queued while offline
        if (bufferedPingsRef.current.length > 0) {
          bufferedPingsRef.current.forEach((ping) => {
            socket.emit('driver:ping', ping);
            socket.emit('driver:location_ping', {
              tripBatchId: ping.tripBatchId,
              lat: ping.coords.lat,
              lng: ping.coords.lng,
              bearing: ping.coords.heading,
              speed: ping.coords.speed,
              timestamp: ping.timestamp,
            });
          });
          bufferedPingsRef.current = [];
          setBufferedPingsCount(0);
        }
      });

      socket.on('disconnect', () => {
        setIsReconnecting(true);
      });

      socket.on('connect_error', () => {
        setIsReconnecting(true);
        setReconnectAttempts((prev) => prev + 1);
      });

      return () => {
        socket.disconnect();
        socketRef.current = null;
      };
    } catch (err) {
      console.warn('Telemetry socket gateway initialization deferred:', err);
    }
  }, [isOnline, gatewayUrl, authToken]);

  // --------------------------------------------------------------------------
  // 2. Throttled Telemetry Emitter (Strict 3-second Cadence)
  // --------------------------------------------------------------------------
  const emitTelemetryPing = useCallback(
    (coords: TelemetryCoords) => {
      const now = Date.now();
      if (now - lastEmitTimeRef.current < EMIT_CADENCE_MS - 200) {
        return; // Throttled to maintain 3s cadence
      }
      lastEmitTimeRef.current = now;
      setLastPingTime(now);

      const payload: DriverPingPayload = {
        driverId,
        tripBatchId,
        coords: {
          lat: Number(coords.lat.toFixed(6)),
          lng: Number(coords.lng.toFixed(6)),
          heading: Math.round(coords.heading),
          speed: Math.round(coords.speed),
          accuracy: Math.round(coords.accuracy),
        },
        timestamp: now,
      };

      const socket = socketRef.current;
      if (socket && socket.connected) {
        socket.emit('driver:ping', payload);
        // Dual emit for compatibility with backend TelemetryGateway schema
        socket.emit('driver:location_ping', {
          tripBatchId,
          lat: payload.coords.lat,
          lng: payload.coords.lng,
          bearing: payload.coords.heading,
          speed: payload.coords.speed,
          timestamp: payload.timestamp,
        });
      } else {
        // Buffer last 5 pings if disconnected
        bufferedPingsRef.current.push(payload);
        if (bufferedPingsRef.current.length > MAX_BUFFERED_PINGS) {
          bufferedPingsRef.current.shift();
        }
        setBufferedPingsCount(bufferedPingsRef.current.length);
        setIsReconnecting(true);
      }
    },
    [driverId, tripBatchId]
  );

  // --------------------------------------------------------------------------
  // 3. New GPS Point Handler (Applies Lerp Target & Telemetry Emitter)
  // --------------------------------------------------------------------------
  const handleNewTargetCoords = useCallback(
    (newCoords: TelemetryCoords) => {
      setRawCoords(newCoords);
      lastRawCoordsRef.current = newCoords;

      // Start 3-second glide from current interpolated position to new target
      animStartCoordsRef.current = interpolatedCoordsRef.current || newCoords;
      animTargetCoordsRef.current = newCoords;
      animStartTimeRef.current = performance.now();

      // Emit over WebSocket
      emitTelemetryPing(newCoords);
    },
    [emitTelemetryPing]
  );

  // --------------------------------------------------------------------------
  // 4. Geolocation Watcher Service (Browser API)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isOnline || isSimulating) return;

    if (!navigator.geolocation) {
      console.warn('Geolocation not supported by this browser. Falling back to NH48 simulator.');
      return;
    }

    let watchId: number | null = null;

    try {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, heading, speed, accuracy } = position.coords;

          // Jitter Filter 1: Ignore erratic pings with accuracy > 30 meters
          if (accuracy && accuracy > ACCURACY_THRESHOLD_METERS) {
            return;
          }

          // Jitter Filter 2: Ignore pings with distance delta < 2 meters
          if (lastRawCoordsRef.current) {
            const distanceDelta = getDistanceMeters(
              lastRawCoordsRef.current.lat,
              lastRawCoordsRef.current.lng,
              latitude,
              longitude
            );
            if (distanceDelta < JITTER_DISTANCE_METERS) {
              return;
            }
          }

          // Calculate heading if device does not provide it
          let calculatedHeading = typeof heading === 'number' && !isNaN(heading) ? heading : 0;
          if (calculatedHeading === 0 && lastRawCoordsRef.current) {
            calculatedHeading = calculateBearing(
              lastRawCoordsRef.current.lat,
              lastRawCoordsRef.current.lng,
              latitude,
              longitude
            );
          }

          // Speed in km/h (position.coords.speed is in m/s)
          const speedKmh = typeof speed === 'number' && speed > 0 ? Math.round(speed * 3.6) : 62;

          setIsGpsActive(true);
          handleNewTargetCoords({
            lat: latitude,
            lng: longitude,
            heading: calculatedHeading,
            speed: speedKmh,
            accuracy: accuracy || 5,
          });
        },
        (error) => {
          console.warn(`Geolocation error (${error.code}): ${error.message}. Activating NH48 simulator.`);
          if (error.code === error.PERMISSION_DENIED) {
            setIsPermissionDenied(true);
          }
          setIsSimulating(true);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 10000,
        }
      );
    } catch {
      // Fallback
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isOnline, isSimulating, handleNewTargetCoords]);

  // --------------------------------------------------------------------------
  // 5. Fallback / Dev Simulator (Steps Along NH 48 Every 3 Seconds)
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isOnline || !isSimulating) return;

    const route = routePolyline.length > 0 ? routePolyline : DEFAULT_CORRIDOR_ROUTE;

    const interval = setInterval(() => {
      simIndexRef.current = (simIndexRef.current + 1) % route.length;
      const currentPoint = route[simIndexRef.current];
      const nextPoint = route[(simIndexRef.current + 1) % route.length];

      // Calculate forward highway heading to next waypoint
      const heading = calculateBearing(
        currentPoint[0],
        currentPoint[1],
        nextPoint[0],
        nextPoint[1]
      );

      // Realistic highway cruising speed with subtle variance (65 - 82 km/h)
      const simulatedSpeed = Math.floor(66 + Math.sin(simIndexRef.current) * 12);
      const simulatedAccuracy = Math.floor(3 + Math.random() * 2); // ±3m to ±5m accuracy

      handleNewTargetCoords({
        lat: currentPoint[0],
        lng: currentPoint[1],
        heading,
        speed: simulatedSpeed,
        accuracy: simulatedAccuracy,
      });
    }, EMIT_CADENCE_MS);

    return () => clearInterval(interval);
  }, [isOnline, isSimulating, routePolyline, handleNewTargetCoords]);

  // --------------------------------------------------------------------------
  // 6. Coordinate Interpolation Loop (requestAnimationFrame over 3000ms)
  // --------------------------------------------------------------------------
  useEffect(() => {
    let animFrameId: number;

    const animate = (now: number) => {
      const start = animStartCoordsRef.current;
      const target = animTargetCoordsRef.current;

      if (start && target) {
        const elapsed = now - animStartTimeRef.current;
        // Interpolate over the 3-second ping cadence
        const t = Math.min(1, elapsed / EMIT_CADENCE_MS);

        const currentLat = lerp(start.lat, target.lat, t);
        const currentLng = lerp(start.lng, target.lng, t);
        const currentHeading = lerpAngle(start.heading, target.heading, t);
        const currentSpeed = lerp(start.speed, target.speed, t);

        const nextInterpolated: TelemetryCoords = {
          lat: currentLat,
          lng: currentLng,
          heading: currentHeading,
          speed: Math.round(currentSpeed),
          accuracy: target.accuracy,
        };

        setInterpolatedCoords(nextInterpolated);
      }

      animFrameId = requestAnimationFrame(animate);
    };

    animFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameId);
  }, []);

  const speedKmh = interpolatedCoords?.speed ?? 64;
  const headingDeg = interpolatedCoords?.heading ?? 0;
  const accuracyMeters = interpolatedCoords?.accuracy ?? 4;
  const corridorStatus = isInTrip ? 'On-Route (NH 48 Expressway)' : 'Corridor Standby';

  return {
    rawCoords,
    interpolatedCoords,
    status,
    isSimulating,
    setSimulating,
    toggleSimulation,
    isReconnecting,
    bufferedPingsCount,
    reconnectAttempts,
    cameraMode,
    setCameraMode,
    toggleCameraMode,
    corridorStatus,
    lastPingTime,
    speedKmh,
    headingDeg,
    accuracyMeters,
  };
}
