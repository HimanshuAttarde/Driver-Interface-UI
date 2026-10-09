import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { TripManifestService } from './manifest.service';
import {
  LocationPingSchema,
  VerifyBoardingSchema,
  CompleteDropoffSchema,
} from './dto/manifest.dto';

interface AuthenticatedSocket extends WebSocket {
  driverId?: string;
  isAlive?: boolean;
}

export class TelemetryGateway {
  private wss: WebSocketServer;
  private connectedDrivers = new Map<string, AuthenticatedSocket>();

  constructor(server: HttpServer, private readonly manifestService: TripManifestService) {
    this.wss = new WebSocketServer({ server, path: '/ws/telemetry' });
    this.setupSocketServer();
  }

  private setupSocketServer(): void {
    this.wss.on('connection', (ws: AuthenticatedSocket, req) => {
      // 1. Authenticate connection via query param or header
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const driverId =
        url.searchParams.get('driverId') ||
        (req.headers['x-driver-id'] as string) ||
        '550e8400-e29b-41d4-a716-446655440000'; // Default test driver

      ws.driverId = driverId;
      ws.isAlive = true;
      this.connectedDrivers.set(driverId, ws);

      console.log(`🔌 [WS CONNECTED] Driver socket registered: ${driverId}`);

      // Send initial handshake confirmation
      this.send(ws, 'system:connected', {
        status: 'AUTHENTICATED',
        driverId,
        message: 'Telemetry gateway connected. Stream driver:location_ping every 3-4s.',
        serverTime: Date.now(),
      });

      // Heartbeat ping-pong
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Handle incoming socket events
      ws.on('message', async (rawMessage: string) => {
        try {
          const payload = JSON.parse(rawMessage.toString());
          await this.handleEvent(ws, payload.event, payload.data);
        } catch (err: any) {
          this.send(ws, 'system:error', {
            message: err.message || 'Invalid JSON format or unknown error',
          });
        }
      });

      // Handle disconnect
      ws.on('close', () => {
        if (ws.driverId) {
          this.connectedDrivers.delete(ws.driverId);
          console.log(`🔌 [WS DISCONNECTED] Driver socket closed: ${ws.driverId}`);
        }
      });
    });

    // Keep-alive heartbeat interval (every 30 seconds)
    const interval = setInterval(() => {
      this.wss.clients.forEach((wsClient) => {
        const socket = wsClient as AuthenticatedSocket;
        if (socket.isAlive === false) {
          return socket.terminate();
        }
        socket.isAlive = false;
        socket.ping();
      });
    }, 30000);
    interval.unref();
  }

  public close(): void {
    this.wss.close();
  }

  /**
   * Central Event Dispatcher
   */
  private async handleEvent(ws: AuthenticatedSocket, event: string, data: any): Promise<void> {
    const driverId = ws.driverId || '550e8400-e29b-41d4-a716-446655440000';

    switch (event) {
      // ----------------------------------------------------------------------
      // 1. EVENT: driver:location_ping
      // ----------------------------------------------------------------------
      case 'driver:location_ping': {
        const parse = LocationPingSchema.safeParse(data);
        if (!parse.success) {
          return this.send(ws, 'error:location_ping', {
            errors: parse.error.errors.map((e) => e.message),
          });
        }

        const result = this.manifestService.recordLocationPing(driverId, parse.data);

        // Acknowledge to driver
        this.send(ws, 'driver:location_ack', {
          tripBatchId: result.tripBatchId,
          timestamp: Date.now(),
        });

        // Broadcast live vehicle position to riders subscribed to this batch
        this.broadcastToBatch(result.tripBatchId, 'rider:driver_location', {
          tripBatchId: result.tripBatchId,
          lat: result.lat,
          lng: result.lng,
          speed: result.speed,
          bearing: result.bearing,
          timestamp: Date.now(),
        });
        break;
      }

      // ----------------------------------------------------------------------
      // 2. EVENT: driver:verify_boarding
      // ----------------------------------------------------------------------
      case 'driver:verify_boarding': {
        const parse = VerifyBoardingSchema.safeParse(data);
        if (!parse.success) {
          return this.send(ws, 'error:verify_boarding', {
            errors: parse.error.errors.map((e) => e.message),
          });
        }

        try {
          const outcome = await this.manifestService.verifyBoarding(driverId, parse.data);

          // Notify driver that boarding was confirmed and seat was occupied
          this.send(ws, 'driver:boarding_verified', {
            success: true,
            verifiedRider: outcome.verifiedRider,
            currentOccupancy: outcome.currentOccupancy,
            completedStopId: outcome.completedStopId,
            nextStop: outcome.nextStop,
            message: `OTP verified! ${outcome.verifiedRider} boarded. Occupancy: ${outcome.currentOccupancy} seats.`,
          });

          // Broadcast to riders
          this.broadcastAll('rider:boarding_confirmed', {
            stopId: outcome.completedStopId,
            riderName: outcome.verifiedRider,
            status: 'BOARDED',
            message: 'Boarding verified. Welcome to your SmartPool ride!',
          });
        } catch (err: any) {
          this.send(ws, 'error:verify_boarding', {
            message: err.message || 'OTP verification failed',
            statusCode: err.statusCode || 400,
          });
        }
        break;
      }

      // ----------------------------------------------------------------------
      // 3. EVENT: driver:complete_dropoff
      // ----------------------------------------------------------------------
      case 'driver:complete_dropoff': {
        const parse = CompleteDropoffSchema.safeParse(data);
        if (!parse.success) {
          return this.send(ws, 'error:complete_dropoff', {
            errors: parse.error.errors.map((e) => e.message),
          });
        }

        try {
          const outcome = await this.manifestService.completeDropoff(driverId, parse.data.stopId);

          // Notify driver that passenger was dropped off
          this.send(ws, 'driver:dropoff_completed', {
            success: true,
            riderName: outcome.riderName,
            currentOccupancy: outcome.currentOccupancy,
            tripFinished: outcome.tripFinished,
            totalShapleyPayout: outcome.totalShapleyPayout,
            settlementStatus: outcome.settlementStatus,
            message: outcome.tripFinished
              ? `All stops completed! Trip finished. Shapley payout ₹${outcome.totalShapleyPayout} settled.`
              : `${outcome.riderName} dropped off. Remaining occupancy: ${outcome.currentOccupancy} seats.`,
          });

          // Broadcast to rider
          this.broadcastAll('rider:trip_completed', {
            stopId: outcome.completedStopId,
            riderName: outcome.riderName,
            status: 'DROPPED_OFF',
            message: 'Thank you for pooling with SmartPool!',
          });
        } catch (err: any) {
          this.send(ws, 'error:complete_dropoff', {
            message: err.message || 'Dropoff completion failed',
            statusCode: err.statusCode || 400,
          });
        }
        break;
      }

      default: {
        this.send(ws, 'system:unknown_event', {
          event,
          message: `Unknown telemetry event "${event}". Supported events: driver:location_ping, driver:verify_boarding, driver:complete_dropoff`,
        });
      }
    }
  }

  /**
   * Helper to send JSON event to specific socket
   */
  private send(ws: WebSocket, event: string, data: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ event, data, timestamp: Date.now() }));
    }
  }

  /**
   * Broadcast to all connected clients in a trip batch
   */
  private broadcastToBatch(tripBatchId: string, event: string, data: any): void {
    const payload = JSON.stringify({ event, data, tripBatchId, timestamp: Date.now() });
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  /**
   * Broadcast to all connected WebSocket clients
   */
  private broadcastAll(event: string, data: any): void {
    const payload = JSON.stringify({ event, data, timestamp: Date.now() });
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }
}
