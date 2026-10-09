import { WebSocket } from 'ws';
import { createServerContext } from './index';

async function testWebSocketGateway() {
  console.log('\n================================================================');
  console.log('🔌 TESTING WEBSOCKET GATEWAY (/ws/telemetry)');
  console.log('================================================================\n');

  const PORT = 4001;
  const context = createServerContext();

  await new Promise<void>((resolve) => {
    context.server.listen(PORT, () => {
      console.log(`✅ Test server running on http://localhost:${PORT}`);
      resolve();
    });
  });

  const driverId = '550e8400-e29b-41d4-a716-446655440000';
  const ws = new WebSocket(`ws://localhost:${PORT}/ws/telemetry?driverId=${driverId}`);

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('WS connection timeout')), 5000);

    ws.on('open', () => {
      clearTimeout(timeout);
      console.log('⚡ Connected to ws://localhost:4001/ws/telemetry');
    });

    ws.on('message', (data: string) => {
      const msg = JSON.parse(data.toString());
      console.log(`📩 Received WS event: [${msg.event}]`, msg.data || msg);

      if (msg.event === 'system:connected') {
        // Step 1: Send driver:location_ping
        console.log('\n📤 Sending event [driver:location_ping]...');
        ws.send(
          JSON.stringify({
            event: 'driver:location_ping',
            data: {
              tripBatchId: '88219011-3c4a-4bb5-9011-abcdef123456',
              lat: 18.7557,
              lng: 73.4091,
              bearing: 310,
              speed: 82.4,
            },
          })
        );
      }

      if (msg.event === 'driver:location_ack') {
        // Step 2: Send driver:verify_boarding
        console.log('\n📤 Sending event [driver:verify_boarding] with OTP "1934"...');
        ws.send(
          JSON.stringify({
            event: 'driver:verify_boarding',
            data: {
              stopId: '33333333-3333-3333-3333-333333333333',
              otp: '1934',
            },
          })
        );
      }

      if (msg.event === 'driver:boarding_verified') {
        // Step 3: Send driver:complete_dropoff
        console.log('\n📤 Sending event [driver:complete_dropoff] for Vashi stop...');
        ws.send(
          JSON.stringify({
            event: 'driver:complete_dropoff',
            data: {
              stopId: '44444444-4444-4444-4444-444444444444',
            },
          })
        );
      }

      if (msg.event === 'driver:dropoff_completed') {
        console.log('\n🎉 All WebSocket telemetry events received and verified successfully!');
        ws.close();
        context.telemetryGateway.close();
        context.server.close(() => {
          resolve();
        });
      }
    });

    ws.on('error', (err) => {
      console.error('WS Error:', err);
      reject(err);
    });
  });

  console.log('================================================================');
  console.log('✅ WEBSOCKET GATEWAY VERIFICATION COMPLETE');
  console.log('================================================================\n');
}

if (require.main === module) {
  testWebSocketGateway()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

export { testWebSocketGateway };
